import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email("Email invalide").max(254),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum").max(128),
  name: z.string().trim().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  // Rate-limit : 10 créations / 10 min / IP (brute-force / spam-register).
  const ip = clientIp(req);
  const rl = rateLimit(`signup:${ip}`, { max: 10, windowMs: 10 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Trop de tentatives, réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Entrée invalide" },
        { status: 400 }
      );
    }
    const { email, password, name } = parsed.data;
    const normalized = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalized },
    });

    if (existing) {
      // Anti-énumération : on renvoie toujours la même réponse succès et on
      // effectue un bcrypt factice pour égaliser le temps de réponse.
      // L'auto-login côté client échouera (mauvais mot de passe) pour un
      // attaquant qui tente un email déjà pris, et redirigera proprement
      // vers /login. Un nouvel utilisateur légitime ne voit rien.
      await bcrypt.hash(password, 12);
      return NextResponse.json({ ok: true });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { email: normalized, passwordHash, name },
      select: { id: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Ne logger que le message, pas la stack (évite fuite de noms de
    // colonnes/contraintes Prisma dans les logs Vercel).
    console.error("[signup]", e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
