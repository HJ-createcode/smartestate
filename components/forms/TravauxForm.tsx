"use client";
import { useInputs } from "@/lib/store/inputs";
import { NumInput } from "@/components/Field";

export function TravauxForm() {
  const travaux = useInputs((s) => s.inputs.travaux);
  const setInputs = useInputs((s) => s.setInputs);

  function update(i: number, patch: Partial<(typeof travaux)[number]>) {
    const next = travaux.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    setInputs({ travaux: next });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Travaux</h2>
        <p className="section-sub">
          Travaux déductibles par année, répartis entre régimes IR (déductibles
          des revenus fonciers) et IS (déductibles du résultat comptable). Une
          augmentation annuelle de loyer peut être renseignée pour les travaux
          d&rsquo;amélioration qui justifient une hausse.
        </p>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 font-medium w-16">Année</th>
                <th className="py-2 font-medium">Travaux déductibles IR (€)</th>
                <th className="py-2 font-medium">Charges déductibles IS (€)</th>
                <th className="py-2 font-medium">Augm. loyer annuelle (€)</th>
              </tr>
            </thead>
            <tbody>
              {travaux.map((t, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-700 font-medium">{t.annee}</td>
                  <td className="py-2 pr-2">
                    <NumInput
                      value={t.deductibleParticuliers}
                      onChange={(v) =>
                        update(i, { deductibleParticuliers: v })
                      }
                      min={0}
                      step={500}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <NumInput
                      value={t.deductibleSocietes}
                      onChange={(v) => update(i, { deductibleSocietes: v })}
                      min={0}
                      step={500}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <NumInput
                      value={t.augmentationLoyerAnnuelle}
                      onChange={(v) =>
                        update(i, { augmentationLoyerAnnuelle: v })
                      }
                      min={0}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
