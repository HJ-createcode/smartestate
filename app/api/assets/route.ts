import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assetInputSchema } from "@/lib/asset-schema";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    console.error("[assets POST]", e);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
