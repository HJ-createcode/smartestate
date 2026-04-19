"use client";
import { useInputs } from "@/lib/store/inputs";
import { Field, NumInput, SelectInput } from "@/components/Field";

export function FinancementForm() {
  const f = useInputs((s) => s.inputs.financement);
  const setNested = useInputs((s) => s.setNested);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Financement</h2>
        <p className="section-sub">
          Paramètres du prêt bancaire. Le calcul de la mensualité utilise un
          taux mensuel équivalent et tient compte d&rsquo;un éventuel différé
          d&rsquo;amortissement de 6 mois.
        </p>
      </div>

      <div className="card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Montant de l'emprunt" suffix="€">
            <NumInput
              value={f.montantEmprunt}
              onChange={(v) => setNested("financement", { montantEmprunt: v })}
              min={0}
              step={1000}
            />
          </Field>
          <Field label="Taux nominal" suffix="%">
            <NumInput
              value={f.tauxNominal * 100}
              onChange={(v) =>
                setNested("financement", { tauxNominal: v / 100 })
              }
              step={0.05}
            />
          </Field>
          <Field label="Durée du prêt" suffix="ans">
            <NumInput
              value={f.dureeAnnees}
              onChange={(v) => setNested("financement", { dureeAnnees: v })}
              min={1}
              max={30}
            />
          </Field>
          <Field label="Assurance (mensualité fixe)" suffix="€">
            <NumInput
              value={f.assuranceMensuelleFixe}
              onChange={(v) =>
                setNested("financement", { assuranceMensuelleFixe: v })
              }
              min={0}
              step={1}
            />
          </Field>
          <Field label="Frais de dossier" suffix="€">
            <NumInput
              value={f.fraisDossier}
              onChange={(v) => setNested("financement", { fraisDossier: v })}
              min={0}
              step={50}
            />
          </Field>
          <Field label="Type de garantie">
            <SelectInput
              value={f.typeGarantie}
              onChange={(v) =>
                setNested("financement", {
                  typeGarantie: v as "hypotheque" | "ippd" | "cautionnement",
                })
              }
              options={[
                { value: "ippd", label: "IPPD (privilège du prêteur)" },
                { value: "hypotheque", label: "Hypothèque conventionnelle" },
                { value: "cautionnement", label: "Cautionnement (organisme)" },
              ]}
            />
          </Field>
          <Field
            label="Différé d'amortissement"
            hint="Pendant un différé, seuls les intérêts sont payés."
          >
            <SelectInput
              value={String(f.differeMois) as "0" | "6"}
              onChange={(v) =>
                setNested("financement", { differeMois: Number(v) as 0 | 6 })
              }
              options={[
                { value: "0", label: "Pas de différé" },
                { value: "6", label: "6 mois de différé" },
              ]}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
