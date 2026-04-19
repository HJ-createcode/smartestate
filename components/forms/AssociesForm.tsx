"use client";
import { useInputs } from "@/lib/store/inputs";
import { Field, NumInput, TextInput } from "@/components/Field";
import { fmtPct } from "@/lib/format";

export function AssociesForm() {
  const associes = useInputs((s) => s.inputs.associes);
  const setInputs = useInputs((s) => s.setInputs);

  function update(i: number, patch: Partial<(typeof associes)[number]>) {
    const next = associes.map((a, idx) => (idx === i ? { ...a, ...patch } : a));
    setInputs({ associes: next });
  }

  function addAssocie() {
    if (associes.length >= 4) return;
    setInputs({
      associes: [
        ...associes,
        {
          prenom: `Associé ${associes.length + 1}`,
          apportCapital: 0,
          apportCompteCourant: 0,
          pctParts: 0,
          revenuNetImposableHorsFoncier: 0,
          deficitsFonciersPrealables: 0,
          nbPartsFiscales: 1,
          nbPartsEnfants: 0,
        },
      ],
    });
  }

  function removeAssocie(i: number) {
    setInputs({ associes: associes.filter((_, idx) => idx !== i) });
  }

  const totalParts = associes.reduce((s, a) => s + a.pctParts, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Associés</h2>
        <p className="section-sub">
          Jusqu&rsquo;à 4 associés. Le revenu net imposable et le nombre de
          parts fiscales permettent de calculer l&rsquo;impact réel du projet
          sur l&rsquo;impôt de chaque associé à travers sa TMI.
        </p>
      </div>

      {associes.map((a, i) => (
        <div key={i} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Associé {i + 1}</h3>
            {associes.length > 1 && (
              <button
                type="button"
                onClick={() => removeAssocie(i)}
                className="btn-ghost text-red-600"
              >
                Supprimer
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Prénom / nom">
              <TextInput
                value={a.prenom}
                onChange={(v) => update(i, { prenom: v })}
              />
            </Field>
            <Field label="Pourcentage de parts" suffix="%">
              <NumInput
                value={a.pctParts * 100}
                onChange={(v) => update(i, { pctParts: v / 100 })}
                min={0}
                max={100}
                step={1}
              />
            </Field>
            <Field label="Apport au capital social" suffix="€">
              <NumInput
                value={a.apportCapital}
                onChange={(v) => update(i, { apportCapital: v })}
                min={0}
              />
            </Field>
            <Field label="Apport en compte courant" suffix="€">
              <NumInput
                value={a.apportCompteCourant}
                onChange={(v) => update(i, { apportCompteCourant: v })}
                min={0}
              />
            </Field>
            <Field label="Revenu net imposable (hors foncier)" suffix="€" hint="Permet d'estimer la TMI.">
              <NumInput
                value={a.revenuNetImposableHorsFoncier}
                onChange={(v) =>
                  update(i, { revenuNetImposableHorsFoncier: v })
                }
                min={0}
              />
            </Field>
            <Field label="Nombre de parts fiscales" hint="Ex : célibataire 1, couple 2, +0,5 par enfant.">
              <NumInput
                value={a.nbPartsFiscales}
                onChange={(v) => update(i, { nbPartsFiscales: v })}
                min={1}
                step={0.5}
              />
            </Field>
            <Field label="Dont parts enfants" hint="Impose un plafonnement du quotient familial.">
              <NumInput
                value={a.nbPartsEnfants}
                onChange={(v) => update(i, { nbPartsEnfants: v })}
                min={0}
                step={0.5}
              />
            </Field>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        {associes.length < 4 && (
          <button type="button" onClick={addAssocie} className="btn-ghost">
            + Ajouter un associé
          </button>
        )}
        <p
          className={`text-sm ${
            Math.abs(totalParts - 1) > 0.001
              ? "text-red-600"
              : "text-slate-500"
          }`}
        >
          Somme des parts : {fmtPct(totalParts, 1)}{" "}
          {Math.abs(totalParts - 1) > 0.001 && "(doit faire 100 %)"}
        </p>
      </div>
    </div>
  );
}
