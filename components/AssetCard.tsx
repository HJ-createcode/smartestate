"use client";
import Link from "next/link";
import { useAccount, type Asset } from "@/lib/store/account";
import { fmtEUR, fmtPct } from "@/lib/format";
import {
  MODE_DETENTION_LABELS,
  REGIME_FISCAL_LABELS,
  badgeClassForMode,
} from "@/lib/labels";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AssetCard({ asset }: { asset: Asset }) {
  const duplicate = useAccount((s) => s.duplicate);
  const remove = useAccount((s) => s.remove);
  const convert = useAccount((s) => s.convertToBien);
  const revert = useAccount((s) => s.revertToSimulation);

  const isBien = asset.kind === "bien";
  const snap = asset.snapshot;
  const mode = asset.inputs.detention.mode;
  const regime = asset.inputs.detention.regimeFiscal;

  const cashFlowMonthly =
    snap
      ? asset.inputs.detention.regimeFiscal === "is"
        ? snap.cashFlowMensuelIS
        : snap.cashFlowMensuelIR
      : 0;

  return (
    <div className="card group">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {isBien ? (
              <span className="badge-emerald">Bien détenu</span>
            ) : asset.status === "validated" ? (
              <span className="badge-sun">Simulation validée</span>
            ) : (
              <span className="badge-stone">Brouillon</span>
            )}
            <span className={badgeClassForMode(mode)}>
              {MODE_DETENTION_LABELS[mode].short}
            </span>
            <span className="badge-stone">
              {REGIME_FISCAL_LABELS[regime].short}
            </span>
          </div>
          <Link
            href={`/simulation/${asset.id}`}
            className="block mt-2 font-semibold text-stone-900 text-lg hover:text-sun-700 transition-colors truncate"
          >
            {asset.name}
          </Link>
          <div className="text-xs text-stone-500 mt-1">
            {isBien && asset.realizedAt
              ? `Acquis le ${formatDate(asset.realizedAt)}`
              : `Modifié le ${formatDate(asset.updatedAt)}`}
          </div>
        </div>
      </div>

      {snap ? (
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Metric
            label="Investissement"
            value={fmtEUR(snap.investissementTotal)}
          />
          <Metric
            label="Mensualité crédit"
            value={fmtEUR(snap.mensualiteAvecAssurance, { digits: 0 })}
          />
          <Metric
            label="Loyers / an"
            value={fmtEUR(snap.loyersAnnuels, { digits: 0 })}
          />
          <Metric
            label="Cash-flow / mois"
            value={fmtEUR(cashFlowMonthly, { digits: 0 })}
            tone={
              cashFlowMonthly > 0
                ? "positive"
                : cashFlowMonthly < 0
                ? "negative"
                : "neutral"
            }
          />
          <Metric label="Rendement net" value={fmtPct(snap.rendementNet)} />
          <Metric
            label="Régime favorable"
            value={
              snap.regimeFavorable === "equivalent"
                ? "IR ≈ IS"
                : snap.regimeFavorable
            }
          />
        </div>
      ) : (
        <div className="mt-4 text-sm text-stone-500 italic">
          Ouvre la simulation pour voir les résultats.
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
        <Link href={`/simulation/${asset.id}`} className="btn-primary text-xs">
          {isBien ? "Modifier" : "Ouvrir"}
        </Link>
        <div className="flex items-center gap-1">
          {!isBien && asset.status === "validated" && (
            <button
              type="button"
              onClick={() => convert(asset.id)}
              className="btn-ghost text-xs"
              title="Le projet est réalisé : convertir en bien détenu"
            >
              Transformer en bien
            </button>
          )}
          {isBien && (
            <button
              type="button"
              onClick={() => revert(asset.id)}
              className="btn-ghost text-xs"
              title="Revenir au statut simulation"
            >
              ← Simulation
            </button>
          )}
          <button
            type="button"
            onClick={() => void duplicate(asset.id)}
            className="btn-ghost text-xs"
          >
            Dupliquer
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `Supprimer "${asset.name}" ? Cette action est irréversible.`
                )
              ) {
                void remove(asset.id);
              }
            }}
            className="btn-danger text-xs"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneCls =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
      ? "text-red-700"
      : "text-stone-900";
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium">
        {label}
      </div>
      <div className={`font-semibold ${toneCls}`}>{value}</div>
    </div>
  );
}
