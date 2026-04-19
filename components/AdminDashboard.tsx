"use client";
import { useEffect, useMemo, useState } from "react";
import { fmtEUR, fmtNum } from "@/lib/format";

type Stats = {
  users: { total: number; newLast7d: number; newLast30d: number };
  assets: {
    total: number;
    draft: number;
    validated: number;
    validatedLast30d: number;
    simulations: number;
    biens: number;
  };
  payments: {
    totalRevenueCents: number;
    totalCount: number;
    last30dRevenueCents: number;
    last30dCount: number;
    byStatus: Record<string, number>;
  };
};

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  isAdmin: boolean;
  assetsCount: number;
  simulations: number;
  biens: number;
  validated: number;
  paymentsCount: number;
  revenueCents: number;
};

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [s, u] = await Promise.all([
          fetch("/api/admin/stats").then((r) => r.json()),
          fetch("/api/admin/users").then((r) => r.json()),
        ]);
        if (!s.ok) throw new Error(s.error ?? "stats");
        if (!u.ok) throw new Error(u.error ?? "users");
        setStats(s.stats);
        setUsers(u.users);
      } catch (e) {
        setErr((e as Error).message);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!users) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(needle) ||
        (u.name ?? "").toLowerCase().includes(needle)
    );
  }, [users, q]);

  if (err) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="info-box">
          <div className="info-box-title">Erreur</div>
          <p className="text-sm text-stone-700">{err}</p>
          <p className="text-xs text-stone-500 mt-2">
            Si tu viens de déployer, vérifie que la base de données Postgres
            est bien configurée et que la variable <code>ADMIN_EMAILS</code>{" "}
            contient ton email.
          </p>
        </div>
      </div>
    );
  }

  if (!stats || !users) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10 text-stone-400 text-sm">
        Chargement…
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-stone-900">Administration</h1>
        <p className="text-stone-600 mt-2 max-w-2xl">
          Vue d&rsquo;ensemble de l&rsquo;activité : utilisateurs, simulations,
          biens enregistrés, paiements.
        </p>
      </div>

      {/* KPIs globaux */}
      <section>
        <h2 className="text-xs uppercase tracking-wide text-stone-500 font-semibold mb-3">
          Vue d&rsquo;ensemble
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI
            label="Utilisateurs"
            value={fmtNum(stats.users.total)}
            sub={`+${stats.users.newLast7d} sur 7 j · +${stats.users.newLast30d} sur 30 j`}
          />
          <KPI
            label="Simulations créées"
            value={fmtNum(stats.assets.simulations)}
            sub={`${stats.assets.validated} validées · ${stats.assets.draft} en brouillon`}
          />
          <KPI
            label="Biens enregistrés"
            value={fmtNum(stats.assets.biens)}
            sub={`${stats.assets.validatedLast30d} validations sur 30 j`}
          />
          <KPI
            label="Revenus cumulés"
            value={fmtEUR(stats.payments.totalRevenueCents / 100)}
            sub={`${fmtEUR(stats.payments.last30dRevenueCents / 100)} sur 30 j`}
            tone="positive"
          />
        </div>
      </section>

      {/* Répartition actifs */}
      <section>
        <h2 className="text-xs uppercase tracking-wide text-stone-500 font-semibold mb-3">
          Répartition des actifs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Breakdown
            title="Total"
            primary={fmtNum(stats.assets.total)}
            rows={[
              { label: "Simulations", value: stats.assets.simulations },
              { label: "Biens", value: stats.assets.biens },
            ]}
          />
          <Breakdown
            title="Statuts"
            primary={fmtNum(stats.assets.draft + stats.assets.validated)}
            rows={[
              { label: "Brouillons", value: stats.assets.draft },
              { label: "Validés", value: stats.assets.validated },
            ]}
          />
          <Breakdown
            title="Paiements"
            primary={fmtNum(stats.payments.totalCount)}
            rows={Object.entries(stats.payments.byStatus).map(([k, v]) => ({
              label: k,
              value: v,
            }))}
            empty="Aucun paiement. L'intégration Stripe reste à connecter — dès qu'un abonnement sera payé, la répartition par statut s'affichera ici."
          />
        </div>
      </section>

      {/* Utilisateurs */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
          <h2 className="text-xl font-semibold text-stone-900">
            Comptes ({users.length})
          </h2>
          <input
            type="search"
            placeholder="Filtrer par email ou nom…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input-base max-w-xs"
          />
        </div>
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sun-50 text-stone-700 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Nom</th>
                  <th className="text-left px-4 py-3">Inscrit le</th>
                  <th className="text-right px-4 py-3">Simulations</th>
                  <th className="text-right px-4 py-3">Biens</th>
                  <th className="text-right px-4 py-3">Validés</th>
                  <th className="text-right px-4 py-3">Paiements</th>
                  <th className="text-right px-4 py-3">Revenus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-stone-500"
                    >
                      Aucun utilisateur ne correspond.
                    </td>
                  </tr>
                )}
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-sun-50/50">
                    <td className="px-4 py-3 text-stone-900">
                      <div className="flex items-center gap-2">
                        <span>{u.email}</span>
                        {u.isAdmin && (
                          <span className="badge-sun text-[10px]">
                            admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-700">
                      {u.name ?? <span className="text-stone-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">{u.simulations}</td>
                    <td className="px-4 py-3 text-right">{u.biens}</td>
                    <td className="px-4 py-3 text-right">{u.validated}</td>
                    <td className="px-4 py-3 text-right">{u.paymentsCount}</td>
                    <td className="px-4 py-3 text-right text-stone-900">
                      {u.revenueCents > 0
                        ? fmtEUR(u.revenueCents / 100)
                        : <span className="text-stone-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="info-box">
        <div className="info-box-title">ℹ️ À propos des paiements</div>
        <p className="text-sm text-stone-700">
          Le modèle <code>Payment</code> est prêt en base. L&rsquo;intégration
          Stripe (abonnement 4,99 €/mois) reste à faire : une fois le webhook
          Stripe branché, chaque paiement s&rsquo;enregistrera automatiquement
          et les KPIs de revenus se rempliront ici.
        </p>
      </section>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function KPI({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneCls =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
      ? "text-red-700"
      : "text-stone-900";
  return (
    <div className="card">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${toneCls}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function Breakdown({
  title,
  primary,
  rows,
  empty,
}: {
  title: string;
  primary: string;
  rows: { label: string; value: number }[];
  empty?: string;
}) {
  const hasData = rows.some((r) => r.value > 0);
  return (
    <div className="card">
      <div className="kpi-label">{title}</div>
      <div className="kpi-value text-stone-900">{primary}</div>
      {hasData ? (
        <ul className="mt-3 space-y-1.5 text-sm text-stone-700">
          {rows.map((r) => (
            <li key={r.label} className="flex justify-between">
              <span className="capitalize">{r.label}</span>
              <span className="tabular-nums text-stone-900 font-medium">
                {fmtNum(r.value)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        empty && (
          <p className="text-xs text-stone-500 mt-3 leading-relaxed">{empty}</p>
        )
      )}
    </div>
  );
}
