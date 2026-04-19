import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assetInputSchema } from "@/lib/asset-schema";
import { guardBodySize } from "@/lib/body-guard";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Plafond global par user — aligné avec bulk-import.
const MAX_ASSETS_PER_USER = 500;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Non connecté" }, { status: 401 });
  }
  const assets = await prisma.asset.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ ok: true, assets });
}

export async function POST(req: Request) {
  // 100 KB = 50 KB inputs + 20 KB snapshot + marge + nom.
  const tooLarge = guardBodySize(req, 100_000);
  if (tooLarge) return tooLarge;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Non connecté" }, { status: 401 });
  }
  try {
    const json = await req.json();
    const parsed = assetInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Entrée invalide" },
        { status: 400 }
      );
    }
    const currentCount = await prisma.asset.count({
      where: { userId: session.user.id },
    });
    if (currentCount >= MAX_ASSETS_PER_USER) {
      return NextResponse.json(
        {
          ok: false,
          error: `Limite de ${MAX_ASSETS_PER_USER} biens/simulations atteinte.`,
        },
        { status: 409 }
      );
    }
    const asset = await prisma.asset.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        kind: parsed.data.kind,
        status: parsed.data.status,
        inputs: parsed.data.inputs as Prisma.InputJsonValue,
        snapshot: (parsed.data.snapshot ?? null) as Prisma.InputJsonValue,
        realizedAt: parsed.data.realizedAt ? new Date(parsed.data.realizedAt) : null,
      },
    });
    return NextResponse.json({ ok: true, asset });
  } catch (e) {
    console.error("[assets POST]", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
