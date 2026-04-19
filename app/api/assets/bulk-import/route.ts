import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assetInputSchema } from "@/lib/asset-schema";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  assets: z.array(assetInputSchema).max(100),
});

/**
 * Import en masse — utilisé pour migrer les simulations localStorage vers
 * la DB au moment où un utilisateur crée son compte. Les assets sont
 * toujours créés (jamais fusionnés) : pas d'écrasement possible des données
 * existantes de l'utilisateur.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Non connecté" }, { status: 401 });
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
