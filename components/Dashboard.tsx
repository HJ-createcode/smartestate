"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useAccount } from "@/lib/store/account";
import { AssetCard } from "@/components/AssetCard";
import { fmtEUR } from "@/lib/format";

/**
 * Espace utilisateur — agrège la vision patrimoniale et sert de point de
 * départ pour lancer une nouvelle simulation.
 */
export function Dashboard() {
  // Hydratation : éviter le flash côté serveur (zustand persist)
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const router = useRouter();
  const { data: session, status } = useSession();
  const mode = useAccount((s) => s.mode);
  const list = useAccount((s) => s.list());
  const createSimulation = useAccount((s) => s.createSimulation);

  const biens = list.filter((a) => a.kind === "bien");
  const simulations = list.filter((a) => a.kind === "simulation");

  // Agrégation pour les KPIs globaux (ne prend en compte que les biens)
  const aggregate = biens.reduce(
    (acc, a) => {
      const s = a.snapshot;
      if (!s) return acc;
      const cash =
        a.inputs.detention.regimeFiscal === "is"
          ? s.cashFlowMensuelIS
          : s.cashFlowMensuelIR;
      return {
        cashFlowMensuel: acc.cashFlowMensuel + cash,
        mensualiteMensuelle:
          acc.mensualiteMensuelle + s.mensualiteAvecAssurance,
        loyersMensuels: acc.loyersMensuels + s.loyersAnnuels / 12,
        investissementTotal: acc.investissementTotal + s.investissementTotal,
      };
    },
    {
      cashFlowMensuel: 0,
      mensualiteMensuelle: 0,
      loyersMensuels: 0,
      investissementTotal: 0,
    }
  );

  async function handleNew() {
    const asset = await createSimulation();
    router.push(`/simulation/${asset.id}`);
  }

  if (!hydrated) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10 text-stone-400 text-sm">
        Chargement…
      </div>
    );
  }

  const isEmpty = list.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Mon espace</h1>
          <p className="text-stone-600 mt-2 max-w-2xl">
            Visualise ton patrimoine immobilier et lance de nouvelles
            simulations. Chaque simulation peut ensuite être transformée en
            bien détenu quand le projet se concrétise.
          </p>
        </div>
        <button type="button" onClick={handleNew} className="btn-primary">
          + Faire une simulation
        </button>
      </div>

      {/* Bandeau mode démo si non connecté */}
      {status !== "loading" && !session?.user && mode === "local" && (
        <div className="info-box flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="info-box-title">💾 Mode démo</div>
            <p className="text-sm text-stone-700">
              Tes simulations sont enregistrées uniquement dans ce navigateur.
              Crée un compte gratuit pour les retrouver d&rsquo;un appareil à
              l&rsquo;autre et les conserver durablement.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/login" className="btn-ghost text-sm">
              Se connecter
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Créer un compte
            </Link>
          </div>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="card-accent text-center py-12 max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-xl font-semibold text-stone-900">
            Bienvenue sur SmartEstate
          </h2>
          <p className="text-stone-700 mt-2 max-w-md mx-auto">
            Tu n&rsquo;as encore ni simulation ni bien enregistré. Démarre par
            une simulation pour analyser un projet immobilier : rendement,
            fiscalité IR vs IS, cash-flow, revente…
          </p>
          <button
            type="button"
            onClick={handleNew}
            className="btn-primary mt-6"
          >
            Commencer ma première simulation
          </button>
        </div>
      )}

      {/* KPIs patrimoniaux */}
      {biens.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-stone-500 font-semibold mb-3">
            Vision patrimoniale
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI
              label="Biens détenus"
              value={String(biens.length)}
              sub={biens.length > 1 ? "investissements" : "investissement"}
            />
            <KPI
              label="Investissement total"
              value={fmtEUR(aggregate.investissementTotal)}
              sub="Somme des biens acquis"
            />
            <KPI
              label="Mensualité cumulée"
              value={fmtEUR(aggregate.mensualiteMensuelle, { digits: 0 })}
              sub="Tous emprunts confondus"
              tone="neutral"
            />
            <KPI
              label="Cash-flow mensuel net"
              value={fmtEUR(aggregate.cashFlowMensuel, { digits: 0 })}
              sub={`${fmtEUR(aggregate.loyersMensuels, { digits: 0 })} de loyers / mois`}
              tone={
                aggregate.cashFlowMensuel > 0
                  ? "positive"
                  : aggregate.cashFlowMensuel < 0
                  ? "negative"
                  : "neutral"
              }
            />
          </div>
        </section>
      )}

      {/* Biens */}
      {biens.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-semibold text-stone-900">
              Mes biens immobiliers
            </h2>
            <span className="text-sm text-stone-500">
              {biens.length} {biens.length > 1 ? "biens" : "bien"}
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {biens.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </div>
        </section>
      )}

      {/* Simulations */}
      {simulations.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-semibold text-stone-900">
              Mes simulations
            </h2>
            <span className="text-sm text-stone-500">
              {simulations.length}{" "}
              {simulations.length > 1 ? "projets" : "projet"} à l&rsquo;étude
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {simulations.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </div>
        </section>
      )}

      {/* Section didactique toujours visible */}
      {!isEmpty && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DidacticCard
            emoji="🧮"
            title="Comment on calcule ?"
            body="Chaque simulation compare fidèlement ton projet sous les deux régimes fiscaux principaux (IR et IS) sur un horizon de 10 ans. Le moteur reprend toutes les règles du Code général des impôts."
          />
          <DidacticCard
            emoji="✏️"
            title="Ajuster à tout moment"
            body="Une simulation n'est jamais figée. Tu peux la modifier, dupliquer pour tester des variantes, ou la valider quand tu es satisfait."
          />
          <DidacticCard
            emoji="🏡"
            title="Du projet au bien"
            body="Quand tu passes à l'acte, un clic transforme la simulation en bien détenu. Elle rejoint ta vision patrimoniale et entre dans les KPIs du tableau de bord."
          />
        </section>
      )}
    </div>
  );
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

function DidacticCard({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <div className="card-accent">
      <div className="text-2xl mb-2">{emoji}</div>
      <div className="font-semibold text-stone-900">{title}</div>
      <div className="text-sm text-stone-700 mt-1.5 leading-relaxed">
        {body}
      </div>
    </div>
  );
}
