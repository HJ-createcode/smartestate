import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assetInputSchema } from "@/lib/asset-schema";
import { rateLimit } from "@/lib/rate-limit";
import { guardBodySize } from "@/lib/body-guard";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  assets: z.array(assetInputSchema).max(100),
});

// Plafond total d'assets par utilisateur. Au-delà, l'import est refusé.
// Protège contre l'abus de remplissage de la DB (boucle d'imports).
const MAX_ASSETS_PER_USER = 500;

/**
 * Import en masse — utilisé pour migrer les simulations localStorage vers
 * la DB au moment où un utilisateur crée son compte. Les assets sont
 * toujours créés (jamais fusionnés) : pas d'écrasement possible des données
 * existantes de l'utilisateur.
 */
export async function POST(req: Request) {
  // 100 assets × ~70 KB max = 7 MB. On plafonne à 8 MB par requête.
  const tooLarge = guardBodySize(req, 8_000_000);
  if (tooLarge) return tooLarge;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Non connecté" }, { status: 401 });
  }

  // Rate-limit par user : 3 imports / 10 min. Un import légitime (migration
  // localStorage → DB) arrive une seule fois au signup ; au-delà c'est
  // probablement un abus.
  const rl = rateLimit(`bulk-import:${session.user.id}`, {
    max: 3,
    windowMs: 10 * 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Trop d'imports récents, réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Liste invalide" },
        { status: 400 }
      );
    }
    if (parsed.data.assets.length === 0) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    // Quota global par user : refuse l'import si le total dépasserait la limite.
    const currentCount = await prisma.asset.count({
      where: { userId: session.user.id },
    });
    if (currentCount + parsed.data.assets.length > MAX_ASSETS_PER_USER) {
      return NextResponse.json(
        {
          ok: false,
          error: `Limite de ${MAX_ASSETS_PER_USER} biens/simulations atteinte.`,
        },
        { status: 409 }
      );
    }

    const created = await prisma.$transaction(
      parsed.data.assets.map((a) =>
        prisma.asset.create({
          data: {
            userId: session.user!.id!,
            name: a.name,
            kind: a.kind,
            status: a.status,
            inputs: a.inputs as Prisma.InputJsonValue,
            snapshot: (a.snapshot ?? null) as Prisma.InputJsonValue,
            realizedAt: a.realizedAt ? new Date(a.realizedAt) : null,
          },
        })
      )
    );
    return NextResponse.json({ ok: true, count: created.length });
  } catch (e) {
    console.error("[bulk-import]", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
