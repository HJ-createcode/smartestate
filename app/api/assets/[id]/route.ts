import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assetUpdateSchema } from "@/lib/asset-schema";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireOwner(assetId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ ok: false, error: "Non connecté" }, { status: 401 }) };
  }
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset || asset.userId !== session.user.id) {
    return { error: NextResponse.json({ ok: false, error: "Introuvable" }, { status: 404 }) };
  }
  return { session, asset };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const result = await requireOwner(params.id);
  if (result.error) return result.error;
  return NextResponse.json({ ok: true, asset: result.asset });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const result = await requireOwner(params.id);
  if (result.error) return result.error;

  try {
    const json = await req.json();
    const parsed = assetUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Entrée invalide" },
        { status: 400 }
      );
    }

    const data: Prisma.AssetUpdateInput = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.kind !== undefined) data.kind = parsed.data.kind;
    if (parsed.data.status !== undefined) data.status = parsed.data.status;
    if (parsed.data.inputs !== undefined)
      data.inputs = parsed.data.inputs as Prisma.InputJsonValue;
    if (parsed.data.snapshot !== undefined)
      data.snapshot = (parsed.data.snapshot ?? null) as Prisma.InputJsonValue;
    if (parsed.data.realizedAt !== undefined) {
      data.realizedAt = parsed.data.realizedAt ? new Date(parsed.data.realizedAt) : null;
    }

    const updated = await prisma.asset.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ ok: true, asset: updated });
  } catch (e) {
    console.error("[asset PUT]", e);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const result = await requireOwner(params.id);
  if (result.error) return result.error;
  await prisma.asset.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
