import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });
  }
  // Rate-limit admin (compte compromis → empêche le martelage de queries
  // coûteuses count/groupBy).
  const rl = rateLimit(`admin-stats:${session.user.email}`, {
    max: 60,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Trop de requêtes admin." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const [
    totalUsers,
    newUsers7d,
    newUsers30d,
    totalAssets,
    assetsByStatus,
    assetsByKind,
    validatedLast30d,
    paymentAggregates,
    paymentsByStatus,
    payments30d,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.asset.count(),
    prisma.asset.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.asset.groupBy({ by: ["kind"], _count: { _all: true } }),
    // Biens acquis sur 30 j uniquement (kind:bien). Exclut les simulations
    // validées pour ne pas gonfler artificiellement ce KPI d'acquisition.
    prisma.asset.count({
      where: {
        kind: "bien",
        status: "validated",
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.payment.aggregate({
      where: { status: "succeeded" },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
    prisma.payment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.payment.aggregate({
      where: { status: "succeeded", createdAt: { gte: thirtyDaysAgo } },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(
    assetsByStatus.map((r) => [r.status, r._count._all])
  );
  const kindCounts = Object.fromEntries(
    assetsByKind.map((r) => [r.kind, r._count._all])
  );
  const paymentStatusCounts = Object.fromEntries(
    paymentsByStatus.map((r) => [r.status, r._count._all])
  );

  return NextResponse.json({
    ok: true,
    stats: {
      users: {
        total: totalUsers,
        newLast7d: newUsers7d,
        newLast30d: newUsers30d,
      },
      assets: {
        total: totalAssets,
        draft: statusCounts.draft ?? 0,
        validated: statusCounts.validated ?? 0,
        validatedLast30d,
        simulations: kindCounts.simulation ?? 0,
        biens: kindCounts.bien ?? 0,
      },
      payments: {
        totalRevenueCents: paymentAggregates._sum.amountCents ?? 0,
        totalCount: paymentAggregates._count._all,
        last30dRevenueCents: payments30d._sum.amountCents ?? 0,
        last30dCount: payments30d._count._all,
        byStatus: paymentStatusCounts,
      },
    },
  });
}
