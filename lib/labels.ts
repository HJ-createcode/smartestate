import type { ModeDetention, RegimeFiscal } from "@/lib/calc/types";

export const MODE_DETENTION_LABELS: Record<
  ModeDetention,
  { label: string; short: string; desc: string }
> = {
  direct: {
    label: "Détention directe",
    short: "Direct",
    desc: "Acquisition en nom propre, sans structure juridique dédiée.",
  },
  sci_ir: {
    label: "SCI à l'impôt sur le revenu",
    short: "SCI IR",
    desc: "Société civile immobilière transparente fiscalement : le résultat est imposé entre les mains des associés.",
  },
  sci_is: {
    label: "SCI à l'impôt sur les sociétés",
    short: "SCI IS",
    desc: "SCI ayant opté pour l'IS : résultat imposé à la société, amortissement comptable possible.",
  },
  sarl_familiale: {
    label: "SARL de famille",
    short: "SARL fam.",
    desc: "Structure adaptée à la location meublée (LMNP/LMP) dans un cadre familial.",
  },
  indivision: {
    label: "Indivision",
    short: "Indivision",
    desc: "Pluralité de propriétaires sans société. Chacun est imposé sur sa quote-part.",
  },
};

export const REGIME_FISCAL_LABELS: Record<
  RegimeFiscal,
  { label: string; short: string; desc: string }
> = {
  ir_foncier_reel: {
    label: "IR — Revenus fonciers (régime réel)",
    short: "IR foncier",
    desc: "Loyers nets de charges réelles imposés au barème progressif + prélèvements sociaux 17,2 %.",
  },
  ir_micro_foncier: {
    label: "IR — Micro-foncier",
    short: "Micro-foncier",
    desc: "Abattement forfaitaire de 30 % sur les loyers. Limité à 15 000 € de loyers/an.",
  },
  ir_bic_lmnp: {
    label: "IR — BIC / LMNP",
    short: "LMNP",
    desc: "Location meublée non professionnelle : amortissement du bien possible, régime très favorable.",
  },
  is: {
    label: "IS — Impôt sur les sociétés",
    short: "IS",
    desc: "Résultat comptable imposé à 15 % (jusqu'à 42 500 €) puis 25 %. Amortissement du bien.",
  },
};

export function badgeClassForMode(mode: ModeDetention): string {
  switch (mode) {
    case "direct":
      return "badge-stone";
    case "sci_ir":
      return "badge-emerald";
    case "sci_is":
      return "badge-violet";
    case "sarl_familiale":
      return "badge-sky";
    case "indivision":
      return "badge-sun";
  }
}
