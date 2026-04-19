import { NextResponse } from "next/server";
import { calculerTout } from "@/lib/calc";
import type { CalculateRequest, CalculateResponse } from "@/lib/calc/types";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { guardBodySize } from "@/lib/body-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Limite body : les InputsProjet font quelques Ko maximum, 60 KB couvre
  // tous les cas légitimes et coupe les abus avant parse.
  const tooLarge = guardBodySize(req, 60_000);
  if (tooLarge) return tooLarge as unknown as NextResponse;

  // Rate-limit : 30 req / min / IP. Défense contre le scraping du moteur
  // (réimplémentation concurrente par enumération des inputs).
  const ip = clientIp(req);
  const rl = rateLimit(`calc:${ip}`, { max: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json<CalculateResponse>(
      { ok: false, errors: ["Trop de requêtes, réessayez dans un instant."] },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  try {
    const body = (await req.json()) as CalculateRequest;
    if (!body?.inputs) {
      return NextResponse.json<CalculateResponse>(
        { ok: false, errors: ["Inputs manquants"] },
        { status: 400 }
      );
    }
    const data = calculerTout(body.inputs);
    return NextResponse.json<CalculateResponse>({ ok: true, data });
  } catch (e) {
    // Ne pas fuiter le message brut (pourrait contenir des détails internes).
    const safeMsg =
      e instanceof Error && e.message.length < 200
        ? e.message
        : "Erreur de calcul";
    return NextResponse.json<CalculateResponse>(
      { ok: false, errors: [safeMsg] },
      { status: 500 }
    );
  }
}
