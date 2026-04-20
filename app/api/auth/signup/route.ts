import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { guardBodySize } from "@/lib/body-guard";

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
  // Un signup fait ~300 octets max (email + password + nom). 2 KB limite
  // largement et stoppe tout body abusif avant parse.
  const tooLarge = guardBodySize(req, 2_000);
  if (tooLarge) return tooLarge;

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
      // Pour égaliser le timing avec la branche "création" (bcrypt.hash +
      // prisma.user.create), on refait ici bcrypt.hash + une transaction
      // interactive avec deux findUnique + un SELECT raw. L'objectif est
      // de se rapprocher du coût d'un create (quelques round-trips DB
      // dans une transaction) sans écrire réellement, et SANS throw pour
      // ne pas polluer les logs Prisma en "error".
      await bcrypt.hash(password, 12);
      await prisma.$transaction(async (tx) => {
        await tx.user.findUnique({ where: { id: "__timing_pad__" } });
        await tx.user.findUnique({ where: { id: "__timing_pad2__" } });
        // Un SELECT 1 pour ajouter un tour dans la transaction.
        await tx.$queryRaw`SELECT 1`;
      });
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
