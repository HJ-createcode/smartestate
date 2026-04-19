"use client";
import { useInputs } from "@/lib/store/inputs";
import { Field, NumInput, SelectInput } from "@/components/Field";

export function ChargesForm() {
  const c = useInputs((s) => s.inputs.charges);
  const setNested = useInputs((s) => s.setNested);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Charges</h2>
        <p className="section-sub">
          Charges récurrentes à déduire du rendement. La taxe d&rsquo;enlèvement
          des ordures ménagères (TOM) est comptabilisée à part car elle est
          refacturée au locataire.
        </p>
      </div>

      <div className="card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Taxe foncière" suffix="€ / an">
            <NumInput
              value={c.taxeFonciereAnnuelle}
              onChange={(v) =>
                setNested("charges", { taxeFonciereAnnuelle: v })
              }
              min={0}
            />
          </Field>
          <Field label="Dont TOM (ordures ménagères)" suffix="€ / an" hint="Refacturable au locataire.">
            <NumInput
              value={c.tomAnnuelle}
              onChange={(v) => setNested("charges", { tomAnnuelle: v })}
              min={0}
            />
          </Field>
          <Field label="Charges de copropriété" suffix="€ / an">
            <NumInput
              value={c.coproprieteAnnuelle}
              onChange={(v) =>
                setNested("charges", { coproprieteAnnuelle: v })
              }
              min={0}
            />
          </Field>
          <Field label="Frais de gestion" suffix="%" hint="% sur loyers encaissés.">
            <NumInput
              value={c.fraisGestionPctLoyers * 100}
              onChange={(v) =>
                setNested("charges", { fraisGestionPctLoyers: v / 100 })
              }
              min={0}
              step={0.5}
            />
          </Field>
          <Field label="État des lieux" suffix="€ / an">
            <NumInput
              value={c.etatDesLieux}
              onChange={(v) => setNested("charges", { etatDesLieux: v })}
              min={0}
            />
          </Field>
          <Field label="Assurance GLI (loyers impayés)" suffix="%">
            <NumInput
              value={c.gliPctLoyers * 100}
              onChange={(v) =>
                setNested("charges", { gliPctLoyers: v / 100 })
              }
              min={0}
              step={0.1}
            />
          </Field>
          <Field label="Assurance PNO" suffix="€ / an">
            <NumInput
              value={c.pnoAnnuelle}
              onChange={(v) => setNested("charges", { pnoAnnuelle: v })}
              min={0}
            />
          </Field>
          <Field label="Autres frais fixes" suffix="€ / an" hint="Entretien, réparations récurrentes.">
            <NumInput
              value={c.autresAnnuelle}
              onChange={(v) => setNested("charges", { autresAnnuelle: v })}
              min={0}
            />
          </Field>
          <Field label="Frais comptables (IR)" suffix="€ / an">
            <NumInput
              value={c.fraisComptablesIR}
              onChange={(v) =>
                setNested("charges", { fraisComptablesIR: v })
              }
              min={0}
            />
          </Field>
          <Field
            label="Frais comptables (IS)"
            suffix="€ / an"
            hint="Une SCI à l'IS doit tenir une comptabilité d'engagement."
          >
            <NumInput
              value={c.fraisComptablesIS}
              onChange={(v) =>
                setNested("charges", { fraisComptablesIS: v })
              }
              min={0}
            />
          </Field>
          <Field
            label="Traitement des frais d'acquisition (IS)"
            hint="Charge immédiate ou amortissement sur 10 ans."
          >
            <SelectInput
              value={c.traitementFraisAcquisition}
              onChange={(v) =>
                setNested("charges", {
                  traitementFraisAcquisition: v as "charge" | "amortissement10",
                })
              }
              options={[
                { value: "charge", label: "Charge immédiate (année 1)" },
                { value: "amortissement10", label: "Amortissement sur 10 ans" },
              ]}
            />
          </Field>
          <Field
            label="Contribution sur les revenus locatifs (2,5 %)"
            hint="Applicable uniquement pour les biens > 15 ans en société IS."
          >
            <SelectInput
              value={c.crl25pct ? "oui" : "non"}
              onChange={(v) => setNested("charges", { crl25pct: v === "oui" })}
              options={[
                { value: "non", label: "Non applicable" },
                { value: "oui", label: "Oui (immeuble > 15 ans)" },
              ]}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
