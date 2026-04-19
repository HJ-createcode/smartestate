"use client";
import { useInputs } from "@/lib/store/inputs";
import { Field, NumInput, SelectInput, TextInput } from "@/components/Field";

export function ProjetForm() {
  const inputs = useInputs((s) => s.inputs);
  const setInputs = useInputs((s) => s.setInputs);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Projet</h2>
        <p className="section-sub">
          Les informations générales qui cadrent la simulation. Prix, type de
          bien et travaux de première année alimentent le calcul des frais de
          notaire et de l&rsquo;investissement total.
        </p>
      </div>

      <div className="info-box">
        <div className="info-box-title">💡 Par où commencer ?</div>
        <p>
          Si tu découvres un bien à acheter, saisis son prix et son type
          (ancien ou neuf). Tu pourras ensuite détailler son financement, les
          loyers attendus et les charges. L&rsquo;horizon d&rsquo;analyse par
          défaut est de 10 ans — durée standard pour comparer les régimes
          fiscaux.
        </p>
      </div>

      <div className="card space-y-5">
        <Field label="Nom du projet">
          <TextInput
            value={inputs.nomProjet}
            onChange={(v) => setInputs({ nomProjet: v })}
            placeholder="Ex : Appartement Angers"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Type de bien" hint="Modifie le calcul des droits de mutation.">
            <SelectInput
              value={inputs.typeBien}
              onChange={(v) => setInputs({ typeBien: v })}
              options={[
                { value: "ancien", label: "Ancien (DMTO 5,81 %)" },
                { value: "neuf", label: "Neuf (TPF réduite)" },
              ]}
            />
          </Field>

          <Field label="Année d'acquisition">
            <NumInput
              value={inputs.anneeAcquisition}
              onChange={(v) => setInputs({ anneeAcquisition: v })}
              min={1990}
              max={2100}
            />
          </Field>

          <Field label="Prix d'achat" suffix="€">
            <NumInput
              value={inputs.prixAchat}
              onChange={(v) => setInputs({ prixAchat: v })}
              min={0}
              step={1000}
            />
          </Field>

          <Field label="Frais d'agence" suffix="€">
            <NumInput
              value={inputs.fraisAgence}
              onChange={(v) => setInputs({ fraisAgence: v })}
              min={0}
              step={500}
            />
          </Field>

          <Field label="Frais de recherche" suffix="€" hint="Chasseur d'appartement par ex.">
            <NumInput
              value={inputs.fraisRecherche}
              onChange={(v) => setInputs({ fraisRecherche: v })}
              min={0}
            />
          </Field>

          <Field label="Horizon de simulation" suffix="ans" hint="Nombre d'années analysées.">
            <NumInput
              value={inputs.horizonAnnees}
              onChange={(v) => setInputs({ horizonAnnees: Math.min(40, Math.max(1, v)) })}
              min={1}
              max={40}
            />
          </Field>

          <Field label="Inflation annuelle des charges" suffix="%">
            <NumInput
              value={inputs.inflationCharges * 100}
              onChange={(v) => setInputs({ inflationCharges: v / 100 })}
              step={0.1}
            />
          </Field>

          <Field label="IRL (revalorisation annuelle des loyers)" suffix="%">
            <NumInput
              value={inputs.irlAnnuel * 100}
              onChange={(v) => setInputs({ irlAnnuel: v / 100 })}
              step={0.1}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
