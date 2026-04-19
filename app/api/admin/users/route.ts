import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      _count: { select: { assets: true, payments: true } },
      assets: {
        select: { kind: true, status: true },
      },
      payments: {
        where: { status: "succeeded" },
        select: { amountCents: true },
      },
    },
  });

  const result = users.map((u) => {
    const simulations = u.assets.filter((a) => a.kind === "simulation").length;
    const biens = u.assets.filter((a) => a.kind === "bien").length;
    const validated = u.assets.filter((a) => a.status === "validated").length;
    const revenueCents = u.payments.reduce((s, p) => s + p.amountCents, 0);
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt,
      isAdmin: isAdminEmail(u.email),
      assetsCount: u._count.assets,
      simulations,
      biens,
      validated,
      paymentsCount: u._count.payments,
      revenueCents,
    };
  });

  return NextResponse.json({ ok: true, users: result });
}
