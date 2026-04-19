"use client";
import { useInputs } from "@/lib/store/inputs";
import { Field, NumInput, SelectInput } from "@/components/Field";

export function ReventeForm() {
  const r = useInputs((s) => s.inputs.revente);
  const setNested = useInputs((s) => s.setNested);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Scénario de revente</h2>
        <p className="section-sub">
          Trois méthodes de valorisation possibles. L&rsquo;année de revente
          détermine les abattements pour durée de détention appliqués à la
          plus-value (exonération IR à 22 ans, PS à 30 ans).
        </p>
      </div>

      <div className="info-box">
        <div className="info-box-title">💡 Quel mode choisir ?</div>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Inflation</strong> : hypothèse prudente, reflète
            l&rsquo;évolution passée moyenne des prix immobiliers sur longue
            période.
          </li>
          <li>
            <strong>Rendement cible</strong> : simule le prix que serait prêt
            à payer un investisseur en fonction des loyers à ce moment-là —
            utile pour un actif vraiment patrimonial.
          </li>
          <li>
            <strong>Prix fixe</strong> : tu forces un prix pour tester un
            scénario précis (dévalorisation, hausse forte…).
          </li>
        </ul>
      </div>

      <div className="card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Choix du mode de valorisation">
            <SelectInput
              value={r.choix}
              onChange={(v) =>
                setNested("revente", {
                  choix: v as "inflation" | "rendement" | "fixe",
                })
              }
              options={[
                {
                  value: "inflation",
                  label: "Prix réévalué par l'inflation",
                },
                {
                  value: "rendement",
                  label: "Prix offrant un rendement cible",
                },
                { value: "fixe", label: "Prix fixé arbitrairement" },
              ]}
            />
          </Field>
          <Field label="Année de revente">
            <NumInput
              value={r.anneeRevente}
              onChange={(v) => setNested("revente", { anneeRevente: v })}
              min={1}
              max={40}
            />
          </Field>
          {r.choix === "inflation" && (
            <Field label="Inflation annuelle estimée" suffix="%">
              <NumInput
                value={r.inflationAnnuelle * 100}
                onChange={(v) =>
                  setNested("revente", { inflationAnnuelle: v / 100 })
                }
                step={0.1}
              />
            </Field>
          )}
          {r.choix === "rendement" && (
            <Field label="Rendement net cible de l'acheteur" suffix="%">
              <NumInput
                value={r.rendementCibleAcheteur * 100}
                onChange={(v) =>
                  setNested("revente", { rendementCibleAcheteur: v / 100 })
                }
                step={0.1}
              />
            </Field>
          )}
          {r.choix === "fixe" && (
            <Field label="Prix de revente fixé" suffix="€">
              <NumInput
                value={r.prixFixe}
                onChange={(v) => setNested("revente", { prixFixe: v })}
                min={0}
                step={1000}
              />
            </Field>
          )}
          <Field label="Frais de revente" suffix="%" hint="Frais d'agence, diagnostics, etc.">
            <NumInput
              value={r.fraisRevente * 100}
              onChange={(v) => setNested("revente", { fraisRevente: v / 100 })}
              min={0}
              step={0.1}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
