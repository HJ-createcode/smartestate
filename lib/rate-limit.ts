/**
 * Rate-limit in-memory (fixed-window) par clé.
 *
 * ⚠️ Limites connues :
 *   - Non distribué : chaque instance Lambda Vercel a sa propre mémoire,
 *     donc un attaquant touchant plusieurs instances peut dépasser le quota.
 *   - Perd l'état à chaque cold-start.
 *
 * C'est donc une défense en profondeur "best effort" en attendant un
 * vrai store partagé (Vercel KV ou Upstash). Suffit à bloquer un
 * script naïf qui hit en série depuis la même IP.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Garbage collection ponctuel pour éviter la fuite mémoire
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

export function rateLimit(
  key: string,
  opts: { max: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.max - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= opts.max) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count++;
  return {
    ok: true,
    remaining: opts.max - bucket.count,
    retryAfterSec: 0,
  };
}

/**
 * Récupère l'IP client. Sur Vercel, x-forwarded-for est peuplé et fiable
 * (origine Vercel edge, non usurpable côté client).
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
