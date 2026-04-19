"use client";
import { useInputs } from "@/lib/store/inputs";
import { fmtEUR, fmtPct, fmtNum } from "@/lib/format";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

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
      ? "text-emerald-600"
      : tone === "negative"
      ? "text-red-600"
      : "text-slate-900";
  return (
    <div className="card">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${toneCls}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

interface ResultsProps {
  onValidate?: () => void;
  onConvert?: () => void;
  status?: "draft" | "validated";
  kind?: "simulation" | "bien";
}

export function Results({ onValidate, onConvert, status, kind }: ResultsProps = {}) {
  const results = useInputs((s) => s.results);
  const loading = useInputs((s) => s.loading);
  const error = useInputs((s) => s.error);

  if (loading && !results) {
    return (
      <div className="card text-slate-500 text-sm">Calcul en cours…</div>
    );
  }
  if (error) {
    return (
      <div className="card text-red-600 text-sm">Erreur : {error}</div>
    );
  }
  if (!results) {
    return (
      <div className="card text-slate-500 text-sm">
        Renseigne les paramètres à gauche, les résultats apparaissent ici.
      </div>
    );
  }

  const { synthese, compteResultatIR, compteResultatIS, recommandation } =
    results;

  const chartIRIS = compteResultatIR.map((l, i) => ({
    annee: `An ${l.annee}`,
    IR: l.cumule,
    IS: compteResultatIS[i]?.cumule ?? 0,
  }));

  const chartMensuel = compteResultatIR.map((l, i) => ({
    annee: `An ${l.annee}`,
    IR: l.effortEpargne / 12,
    IS: (compteResultatIS[i]?.cashFlowNet ?? 0) / 12,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="section-title">Synthèse</h2>
        <p className="section-sub">
          Tous les résultats ci-dessous sont recalculés automatiquement à
          chaque modification des paramètres. Quand tu es satisfait du
          scénario, valide la simulation pour l&rsquo;enregistrer sur ton
          espace.
        </p>
      </div>

      {/* CTA valider / transformer */}
      {(onValidate || onConvert) && (
        <div className="card-accent flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-semibold text-stone-900">
              {kind === "bien"
                ? "Bien enregistré dans ton patrimoine"
                : status === "validated"
                ? "Simulation validée"
                : "Satisfait de ce scénario ?"}
            </div>
            <div className="text-sm text-stone-700 mt-0.5">
              {kind === "bien"
                ? "Tu peux ajuster les paramètres, les KPIs du tableau de bord seront mis à jour."
                : status === "validated"
                ? "Cette simulation est marquée comme validée. Tu peux encore la modifier ou la transformer en bien détenu."
                : "Valide la simulation pour la retrouver sur ton tableau de bord."}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onValidate && (
              <button type="button" onClick={onValidate} className="btn-primary">
                {status === "validated" ? "Re-valider" : "✓ Valider la simulation"}
              </button>
            )}
            {onConvert && (
              <button
                type="button"
                onClick={onConvert}
                className="btn-secondary"
              >
                🏡 Transformer en bien
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reco */}
      <div
        className={`card border-2 ${
          recommandation.regimeFavorable === "IR"
            ? "border-blue-200"
            : recommandation.regimeFavorable === "IS"
            ? "border-purple-200"
            : "border-slate-200"
        }`}
      >
        <div className="text-xs uppercase tracking-wide font-semibold text-slate-500">
          Régime fiscal recommandé sur l&apos;horizon de simulation
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <div className="text-3xl font-bold text-slate-900">
            {recommandation.regimeFavorable === "equivalent"
              ? "IR ≈ IS"
              : recommandation.regimeFavorable}
          </div>
          {recommandation.regimeFavorable !== "equivalent" && (
            <div className="text-sm text-slate-600">
              Avantage estimé : {fmtEUR(recommandation.avantageEurosA10Ans)}
            </div>
          )}
        </div>
        <p className="text-sm text-slate-600 mt-2">
          {recommandation.commentaire}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Investissement total"
          value={fmtEUR(synthese.investissementTotal)}
          sub={`dont ${fmtEUR(synthese.fraisNotaire.total)} de frais de notaire`}
        />
        <KPI
          label="Mensualité crédit (avec assurance)"
          value={fmtEUR(synthese.mensualiteAvecAssurance, { digits: 2 })}
          sub={`TEG annuel ${fmtPct(synthese.tegAnnuel, 3)}`}
        />
        <KPI
          label="Rendement brut"
          value={fmtPct(synthese.rendementBrut)}
          sub={`${fmtEUR(synthese.loyersAnnuels)} / an`}
          tone={synthese.rendementBrut > 0.06 ? "positive" : "neutral"}
        />
        <KPI
          label="Rendement net de charges"
          value={fmtPct(synthese.rendementNet)}
          sub={`Charges fixes : ${fmtEUR(synthese.chargesFixesAnnuelles)} / an`}
          tone={synthese.rendementNet > 0.05 ? "positive" : "neutral"}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Autofinancement simple"
          value={fmtEUR(synthese.autofinancementSimple, { digits: 0 })}
          sub="loyers − mensualité / mois"
          tone={
            synthese.autofinancementSimple > 0
              ? "positive"
              : synthese.autofinancementSimple < 0
              ? "negative"
              : "neutral"
          }
        />
        <KPI
          label="Autofinancement net"
          value={fmtEUR(synthese.autofinancementNet, { digits: 0 })}
          sub="− charges / mois"
          tone={
            synthese.autofinancementNet > 0
              ? "positive"
              : synthese.autofinancementNet < 0
              ? "negative"
              : "neutral"
          }
        />
        <KPI
          label="Effort mensuel moyen IR (10 ans)"
          value={fmtEUR(synthese.autofinancementIRMensuel10ans, { digits: 0 })}
          tone={
            synthese.autofinancementIRMensuel10ans > 0
              ? "positive"
              : "negative"
          }
        />
        <KPI
          label="Cash-flow mensuel moyen IS (10 ans)"
          value={fmtEUR(synthese.autofinancementISMensuel10ans, { digits: 0 })}
          tone={
            synthese.autofinancementISMensuel10ans > 0
              ? "positive"
              : "negative"
          }
        />
      </div>

      <div className="card">
        <div className="kpi-label mb-2">Prix négociable pour un rendement net cible</div>
        <p className="text-sm text-slate-600 mb-2">
          Pour atteindre un rendement net de {fmtPct(synthese.rendementNetCible)}{" "}
          sur la base des loyers et charges actuels :
        </p>
        <div className="text-xl font-semibold text-slate-900">
          {fmtEUR(synthese.prixNegocierObjectifRendement)}
        </div>
      </div>

      {/* Graphique cumul */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-4">
          Cumul du cash-flow net — IR vs IS
        </h3>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={chartIRIS}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="annee" stroke="#64748b" />
              <YAxis
                stroke="#64748b"
                tickFormatter={(v) => fmtNum(v / 1000) + " k€"}
              />
              <Tooltip formatter={(v: number) => fmtEUR(v)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="IR"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="IS"
                stroke="#9333ea"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique mensuel */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-4">
          Effort / gain mensuel par année
        </h3>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={chartMensuel}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="annee" stroke="#64748b" />
              <YAxis
                stroke="#64748b"
                tickFormatter={(v) => fmtNum(v)}
              />
              <Tooltip formatter={(v: number) => fmtEUR(v)} />
              <Legend />
              <Bar dataKey="IR" fill="#2563eb" />
              <Bar dataKey="IS" fill="#9333ea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Détail IR */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-4">
          Compte de résultat — Régime IR
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead className="text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 text-left font-medium">Année</th>
                <th className="py-2 text-right font-medium">Loyers</th>
                <th className="py-2 text-right font-medium">Charges</th>
                <th className="py-2 text-right font-medium">Travaux</th>
                <th className="py-2 text-right font-medium">Intérêts</th>
                <th className="py-2 text-right font-medium">Base RF</th>
                <th className="py-2 text-right font-medium">Δ IR</th>
                <th className="py-2 text-right font-medium">Effort</th>
                <th className="py-2 text-right font-medium">Cumul</th>
              </tr>
            </thead>
            <tbody>
              {compteResultatIR.map((l) => (
                <tr
                  key={l.annee}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-2 font-medium">{l.annee}</td>
                  <td className="py-2 text-right">{fmtEUR(l.loyers)}</td>
                  <td className="py-2 text-right">
                    {fmtEUR(l.chargesDeductibles)}
                  </td>
                  <td className="py-2 text-right">
                    {fmtEUR(l.travauxDeductibles)}
                  </td>
                  <td className="py-2 text-right">{fmtEUR(l.interets)}</td>
                  <td className="py-2 text-right">
                    {fmtEUR(l.baseRevenuFoncier)}
                  </td>
                  <td className="py-2 text-right">
                    {fmtEUR(l.differentielIR)}
                  </td>
                  <td
                    className={`py-2 text-right font-medium ${
                      l.effortEpargne < 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {fmtEUR(l.effortEpargne)}
                  </td>
                  <td className="py-2 text-right">{fmtEUR(l.cumule)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Détail IS */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-4">
          Compte de résultat — Régime IS
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead className="text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 text-left font-medium">Année</th>
                <th className="py-2 text-right font-medium">Loyers</th>
                <th className="py-2 text-right font-medium">Charges</th>
                <th className="py-2 text-right font-medium">Amortissements</th>
                <th className="py-2 text-right font-medium">Intérêts</th>
                <th className="py-2 text-right font-medium">Résultat fiscal</th>
                <th className="py-2 text-right font-medium">IS</th>
                <th className="py-2 text-right font-medium">Cash-flow</th>
                <th className="py-2 text-right font-medium">Cumul</th>
              </tr>
            </thead>
            <tbody>
              {compteResultatIS.map((l) => (
                <tr
                  key={l.annee}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-2 font-medium">{l.annee}</td>
                  <td className="py-2 text-right">{fmtEUR(l.loyers)}</td>
                  <td className="py-2 text-right">
                    {fmtEUR(
                      l.chargesRecurrentes +
                        l.travauxDeductibles +
                        l.fraisFixesSociete +
                        l.fraisAcquisitionIS
                    )}
                  </td>
                  <td className="py-2 text-right">
                    {fmtEUR(l.amortissements)}
                  </td>
                  <td className="py-2 text-right">{fmtEUR(l.interets)}</td>
                  <td className="py-2 text-right">
                    {fmtEUR(l.resultatFiscal)}
                  </td>
                  <td className="py-2 text-right">{fmtEUR(l.impotIS)}</td>
                  <td
                    className={`py-2 text-right font-medium ${
                      l.cashFlowNet < 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {fmtEUR(l.cashFlowNet)}
                  </td>
                  <td className="py-2 text-right">{fmtEUR(l.cumule)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plus-value */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">
            Plus-value à la revente — IR
          </h3>
          <dl className="text-sm space-y-1.5">
            <PVLine label="Prix de vente" value={fmtEUR(results.plusValueIR.prixVente)} />
            <PVLine
              label="Frais de revente"
              value={`− ${fmtEUR(results.plusValueIR.fraisVente)}`}
            />
            <PVLine
              label="Durée de détention"
              value={`${results.plusValueIR.anneeDetention} ans`}
            />
            <PVLine
              label="Abattement IR"
              value={fmtPct(results.plusValueIR.abattementIR, 0)}
            />
            <PVLine
              label="Abattement PS"
              value={fmtPct(results.plusValueIR.abattementPS, 1)}
            />
            <PVLine
              label="Impôt IR (19 %)"
              value={`− ${fmtEUR(results.plusValueIR.impotIR)}`}
              tone="negative"
            />
            <PVLine
              label="Prélèvements sociaux"
              value={`− ${fmtEUR(results.plusValueIR.prelevementsSociaux)}`}
              tone="negative"
            />
            <PVLine
              label="Surtaxe PV > 50 k€"
              value={`− ${fmtEUR(results.plusValueIR.surtaxe)}`}
              tone="negative"
            />
            <PVLine
              label="Capital restant dû"
              value={`− ${fmtEUR(results.plusValueIR.capitalRestantDu)}`}
              tone="negative"
            />
            <div className="border-t border-slate-200 pt-2 mt-2">
              <PVLine
                label="Gain net"
                value={fmtEUR(results.plusValueIR.gainNet)}
                tone={results.plusValueIR.gainNet > 0 ? "positive" : "negative"}
                strong
              />
            </div>
          </dl>
        </div>
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">
            Plus-value à la revente — IS
          </h3>
          <dl className="text-sm space-y-1.5">
            <PVLine label="Prix de vente" value={fmtEUR(results.plusValueIS.prixVente)} />
            <PVLine
              label="Frais de revente"
              value={`− ${fmtEUR(results.plusValueIS.fraisVente)}`}
            />
            <PVLine
              label="Valeur nette comptable"
              value={fmtEUR(results.plusValueIS.valeurNetteComptable)}
            />
            <PVLine
              label="Plus-value professionnelle"
              value={fmtEUR(results.plusValueIS.plusValueProfessionnelle)}
            />
            <PVLine
              label="IS supplémentaire"
              value={`− ${fmtEUR(results.plusValueIS.impotISSupplementaire)}`}
              tone="negative"
            />
            <PVLine
              label="Capital restant dû"
              value={`− ${fmtEUR(results.plusValueIS.capitalRestantDu)}`}
              tone="negative"
            />
            <div className="border-t border-slate-200 pt-2 mt-2">
              <PVLine
                label="Gain net"
                value={fmtEUR(results.plusValueIS.gainNet)}
                tone={results.plusValueIS.gainNet > 0 ? "positive" : "negative"}
                strong
              />
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function PVLine({
  label,
  value,
  tone = "neutral",
  strong,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
  strong?: boolean;
}) {
  const toneCls =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
      ? "text-red-600"
      : "text-slate-900";
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-600">{label}</dt>
      <dd
        className={`${toneCls} ${
          strong ? "text-lg font-bold" : "font-medium"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
