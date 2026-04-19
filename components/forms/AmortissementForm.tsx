"use client";
import { useInputs } from "@/lib/store/inputs";
import { NumInput } from "@/components/Field";
import { fmtEUR, fmtPct } from "@/lib/format";

export function AmortissementForm() {
  const comp = useInputs((s) => s.inputs.amortComposants);
  const prixAchat = useInputs((s) => s.inputs.prixAchat);
  const setInputs = useInputs((s) => s.setInputs);

  function update(i: number, patch: Partial<(typeof comp)[number]>) {
    const next = comp.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    setInputs({ amortComposants: next });
  }

  const totalProportion = comp.reduce((s, c) => s + c.proportion, 0);
  const ecart = Math.abs(totalProportion - 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Amortissement comptable (IS)</h2>
        <p className="section-sub">
          Uniquement utilisé dans le régime IS. La somme des proportions doit
          faire 100 %. Le terrain n&rsquo;est jamais amortissable.
        </p>
      </div>

      <div className="info-box">
        <div className="info-box-title">💡 Qu&rsquo;est-ce que l&rsquo;amortissement comptable ?</div>
        <p className="mb-2">
          L&rsquo;amortissement consiste à déduire chaque année une fraction
          du prix du bien du résultat imposable de la société, comme si le
          bien perdait de la valeur. C&rsquo;est le levier le plus puissant
          de la SCI à l&rsquo;IS : souvent, il suffit à effacer
          l&rsquo;imposition pendant 20 ans.
        </p>
        <p className="text-xs text-stone-600">
          Durées habituelles : habitation 40 à 50 ans, commercial 20 à 50 ans,
          industriel 20 à 25 ans. Les composants (toiture, électricité…) ont
          des durées plus courtes qu&rsquo;un gros œuvre.
        </p>
      </div>

      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 font-medium">Composant</th>
              <th className="py-2 font-medium">Proportion (%)</th>
              <th className="py-2 font-medium">Valeur</th>
              <th className="py-2 font-medium">Durée (années)</th>
              <th className="py-2 font-medium text-right">Dotation annuelle</th>
            </tr>
          </thead>
          <tbody>
            {comp.map((c, i) => {
              const valeur = prixAchat * c.proportion;
              const dot = c.dureeAnnees > 0 ? valeur / c.dureeAnnees : 0;
              return (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-700 font-medium">{c.nom}</td>
                  <td className="py-2 pr-2 w-32">
                    <NumInput
                      value={c.proportion * 100}
                      onChange={(v) => update(i, { proportion: v / 100 })}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </td>
                  <td className="py-2 text-slate-700">{fmtEUR(valeur)}</td>
                  <td className="py-2 pr-2 w-32">
                    <NumInput
                      value={c.dureeAnnees}
                      onChange={(v) => update(i, { dureeAnnees: v })}
                      min={0}
                      max={50}
                      step={1}
                    />
                  </td>
                  <td className="py-2 text-right font-medium text-slate-900">
                    {fmtEUR(dot)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-3 text-slate-500 text-sm">Total</td>
              <td
                className={`pt-3 font-semibold ${
                  ecart > 0.001 ? "text-red-600" : "text-slate-900"
                }`}
              >
                {fmtPct(totalProportion, 1)}
                {ecart > 0.001 && (
                  <span className="block text-xs font-normal">
                    doit faire 100 %
                  </span>
                )}
              </td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
