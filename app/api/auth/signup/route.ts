import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email("Email invalide").max(254),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum").max(128),
  name: z.string().trim().min(1).max(80).optional(),
});

// Réponse générique de succès, utilisée quelle que soit la situation réelle
// pour empêcher l'énumération de comptes.
const genericSuccess = () => NextResponse.json({ ok: true });

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
      // Anti-énumération : on renvoie toujours la même réponse succès.
      // Pour égaliser le timing avec la branche "création" qui fait
      // (1) bcrypt.hash, (2) prisma.user.create, on reproduit ici
      // (1) bcrypt factice et (2) findUnique factice (même round-trip DB
      // qu'un insert court sur Neon). L'auto-login côté client échouera
      // naturellement si l'attaquant a deviné un email existant.
      await bcrypt.hash(password, 12);
      await prisma.user.findUnique({ where: { id: "__timing_pad__" } });
      return genericSuccess();
    }

    const passwordHash = await bcrypt.hash(password, 12);
    try {
      await prisma.user.create({
        data: { email: normalized, passwordHash, name },
        select: { id: true },
      });
    } catch (e) {
      // Race condition : deux signups simultanés avec le même email neuf
      // passent findUnique (null), l'un créé, l'autre tape P2002. On
      // absorbe l'erreur pour rester indistinguable du cas normal.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        return genericSuccess();
      }
      throw e;
    }

    return genericSuccess();
  } catch (e) {
    console.error("[signup]", e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
