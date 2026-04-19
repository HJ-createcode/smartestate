"use client";
import { useInputs } from "@/lib/store/inputs";
import {
  MODE_DETENTION_LABELS,
  REGIME_FISCAL_LABELS,
} from "@/lib/labels";
import type { ModeDetention, RegimeFiscal } from "@/lib/calc/types";

// Quels régimes fiscaux sont disponibles pour chaque mode de détention
const REGIMES_PAR_MODE: Record<ModeDetention, RegimeFiscal[]> = {
  direct: ["ir_foncier_reel", "ir_micro_foncier", "ir_bic_lmnp"],
  sci_ir: ["ir_foncier_reel"],
  sci_is: ["is"],
  sarl_familiale: ["ir_bic_lmnp"],
  indivision: ["ir_foncier_reel", "ir_micro_foncier"],
};

export function DetentionForm() {
  const detention = useInputs((s) => s.inputs.detention);
  const setNested = useInputs((s) => s.setNested);

  const modes = Object.keys(MODE_DETENTION_LABELS) as ModeDetention[];
  const regimesDispo = REGIMES_PAR_MODE[detention.mode];

  function setMode(mode: ModeDetention) {
    const regimes = REGIMES_PAR_MODE[mode];
    setNested("detention", {
      mode,
      regimeFiscal: regimes.includes(detention.regimeFiscal)
        ? detention.regimeFiscal
        : regimes[0],
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Structure de détention</h2>
        <p className="section-sub">
          La structure choisie détermine qui paie l&rsquo;impôt et comment. Ce
          choix est le plus structurant de toute l&rsquo;analyse — c&rsquo;est
          lui qui détermine si on compare IR vs IS, si on peut amortir le bien,
          comment les revenus remontent aux associés.
        </p>
      </div>

      <div className="info-box">
        <div className="info-box-title">💡 Comment choisir ?</div>
        <ul className="list-disc list-inside space-y-1 text-sm text-stone-700">
          <li>
            <strong>Direct</strong> : le plus simple. Adapté à un premier bien
            ou à un investissement seul, sans associés.
          </li>
          <li>
            <strong>SCI IR</strong> : permet d&rsquo;associer plusieurs
            personnes (famille, couple), pas d&rsquo;amortissement mais
            imputation possible des déficits fonciers.
          </li>
          <li>
            <strong>SCI IS</strong> : permet d&rsquo;amortir le bien
            (réduit fortement l&rsquo;impôt les 20 premières années), mais
            plus-value professionnelle lourde à la revente.
          </li>
          <li>
            <strong>SARL familiale</strong> : meublé en famille, cumule LMNP et
            souplesse de la SARL.
          </li>
        </ul>
      </div>

      <div>
        <div className="label-base">Mode de détention</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modes.map((m) => {
            const info = MODE_DETENTION_LABELS[m];
            const active = detention.mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`text-left rounded-xl border-2 p-4 transition-colors ${
                  active
                    ? "border-sun-400 bg-sun-50"
                    : "border-stone-200 bg-white hover:border-sun-200 hover:bg-sun-50/40"
                }`}
              >
                <div className="font-semibold text-stone-900">{info.label}</div>
                <div className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  {info.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="label-base">Régime fiscal applicable</div>
        <div className="space-y-2">
          {regimesDispo.map((r) => {
            const info = REGIME_FISCAL_LABELS[r];
            const active = detention.regimeFiscal === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setNested("detention", { regimeFiscal: r })}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  active
                    ? "border-sun-400 bg-sun-50"
                    : "border-stone-200 bg-white hover:bg-sun-50/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      active
                        ? "border-sun-500 bg-sun-400"
                        : "border-stone-300 bg-white"
                    }`}
                  />
                  <div>
                    <div className="font-medium text-stone-900 text-sm">
                      {info.label}
                    </div>
                    <div className="text-xs text-stone-600 mt-0.5">
                      {info.desc}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="info-box">
        <div className="info-box-title">📊 Le simulateur va tout calculer</div>
        <p className="text-sm text-stone-700">
          Quel que soit ton choix ici, la simulation te montrera{" "}
          <strong>à la fois le régime IR et le régime IS</strong> sur 10 ans
          pour que tu puisses comparer. Ton choix de structure est conservé sur
          le tableau de bord mais n&rsquo;empêche pas l&rsquo;analyse
          comparative.
        </p>
      </div>
    </div>
  );
}
