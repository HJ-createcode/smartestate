"use client";
import { useInputs } from "@/lib/store/inputs";
import { NumInput } from "@/components/Field";
import { fmtEUR } from "@/lib/format";

export function BiensForm() {
  const biens = useInputs((s) => s.inputs.biens);
  const setInputs = useInputs((s) => s.setInputs);

  function update(i: number, patch: Partial<(typeof biens)[number]>) {
    const next = biens.map((b, idx) => (idx === i ? { ...b, ...patch } : b));
    setInputs({ biens: next });
  }

  function addBien() {
    setInputs({
      biens: [
        ...biens,
        { nombre: 0, loyerMensuel: 0, joursVacancePart: 0 },
      ],
    });
  }

  function removeBien(i: number) {
    setInputs({ biens: biens.filter((_, idx) => idx !== i) });
  }

  const loyerAnnuelTotal = biens.reduce((acc, b) => {
    if (b.nombre <= 0) return acc;
    return acc + b.nombre * b.loyerMensuel * ((365 - b.joursVacancePart) / 365) * 12;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Biens à louer</h2>
        <p className="section-sub">
          Déclare autant de types de biens que nécessaire : un T2 et un T3 à des
          loyers différents, ou 21 emplacements de parking, etc. Le nombre de
          jours non loués/impayés ampute le loyer annuel à due proportion.
        </p>
      </div>

      <div className="card space-y-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 font-medium">Type</th>
              <th className="py-2 font-medium">Nombre</th>
              <th className="py-2 font-medium">Loyer mensuel (€)</th>
              <th className="py-2 font-medium">Jours non loués / an</th>
              <th className="py-2 font-medium text-right">Loyer annuel</th>
              <th className="py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {biens.map((b, i) => {
              const loyerAn =
                b.nombre * b.loyerMensuel * ((365 - b.joursVacancePart) / 365) * 12;
              return (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-700">Type {i + 1}</td>
                  <td className="py-2 pr-2">
                    <NumInput
                      value={b.nombre}
                      onChange={(v) => update(i, { nombre: v })}
                      min={0}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <NumInput
                      value={b.loyerMensuel}
                      onChange={(v) => update(i, { loyerMensuel: v })}
                      min={0}
                      step={10}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <NumInput
                      value={b.joursVacancePart}
                      onChange={(v) => update(i, { joursVacancePart: v })}
                      min={0}
                      max={365}
                    />
                  </td>
                  <td className="py-2 pr-2 text-right text-slate-700 font-medium">
                    {fmtEUR(loyerAn)}
                  </td>
                  <td className="py-2">
                    {biens.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBien(i)}
                        className="text-slate-400 hover:text-red-500 text-lg leading-none"
                        aria-label="Supprimer"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="pt-3 text-right text-slate-500 text-sm">
                Loyers annuels totaux
              </td>
              <td className="pt-3 text-right font-semibold text-slate-900">
                {fmtEUR(loyerAnnuelTotal)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <button type="button" onClick={addBien} className="btn-ghost">
          + Ajouter un type de bien
        </button>
      </div>
    </div>
  );
}
