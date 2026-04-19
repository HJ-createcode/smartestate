// Barèmes fiscaux 2026 — source : loi de finances en vigueur.
// Les valeurs sont mises à jour manuellement par l'éditeur du simulateur.

// Barème IR - tranches revenu net par part (célibataire 1 part)
export const TRANCHES_IR = [
  { seuil: 11_601, taux: 0.0 },
  { seuil: 29_580, taux: 0.11 },
  { seuil: 84_577, taux: 0.3 },
  { seuil: 181_917, taux: 0.41 },
  { seuil: Infinity, taux: 0.45 },
];

// Prélèvements sociaux sur revenus fonciers et plus-values immobilières
export const CSG_CRDS_TOTAL = 0.172; // 17.2%
export const CSG_CRDS_DEDUCTIBLE = 0.068; // 6.8% déductible N+2
export const CSG_CRDS_SUR_DIVIDENDES = 0.172;

// Flat tax sur dividendes
export const PFU_FLAT_TAX = 0.3;

// Déficit foncier imputable sur revenu global
export const PLAFOND_DEFICIT_RBG = 10_700;

// Abattement dividendes soumis au barème
export const ABATTEMENT_DIVIDENDES = 0.4;

// Plafond demi-part (quotient familial)
export const PLAFOND_DEMI_PART = 1_759; // plafond par demi-part 2024

// Plus-value immobilière IR - taux fixe
export const TAUX_IR_PV_IMMO = 0.19;

// Abattements par année de détention (début à l'année 6)
// À partir de l'année 6 : IR 6%/an, année 22 : +4% (exonération 22 ans)
// PS : 1.65%/an de 6 à 21, 1.6% année 22, 9%/an 23-30 (exonération 30 ans)
export function abattementIR(annees: number): number {
  if (annees <= 5) return 0;
  if (annees < 22) return Math.min(1, (annees - 5) * 0.06);
  return 1; // exo 22 ans
}
export function abattementPS(annees: number): number {
  if (annees <= 5) return 0;
  if (annees <= 21) return (annees - 5) * 0.0165;
  if (annees === 22) return 21 * 0.0165 + 0.016;
  if (annees < 30) return 21 * 0.0165 + 0.016 + (annees - 22) * 0.09;
  return 1; // exo 30 ans
}

// Surtaxe PV > 50 000 € (plus-value nette imposable)
// Formule barème officiel CGI art. 1609 nonies G
export function surtaxePV(pv: number): number {
  if (pv <= 50_000) return 0;
  if (pv <= 60_000) return 0.02 * pv - (60_000 - pv) * 0.05;
  if (pv <= 100_000) return 0.02 * pv;
  if (pv <= 110_000) return 0.03 * pv - (110_000 - pv) * 0.1;
  if (pv <= 150_000) return 0.03 * pv;
  if (pv <= 160_000) return 0.04 * pv - (160_000 - pv) * 0.15;
  if (pv <= 200_000) return 0.04 * pv;
  if (pv <= 210_000) return 0.05 * pv - (210_000 - pv) * 0.2;
  if (pv <= 250_000) return 0.05 * pv;
  if (pv <= 260_000) return 0.06 * pv - (260_000 - pv) * 0.25;
  return 0.06 * pv;
}

// IS PME (sous réserve éligibilité)
export const IS_SEUIL_1 = 42_500;
export const IS_TAUX_1 = 0.15;
export const IS_SEUIL_2 = 500_000;
export const IS_TAUX_2 = 0.25;
export const IS_TAUX_3 = 0.25;

// Abattement forfaitaire travaux si détention > 5 ans (plus-value IR)
export const FORFAIT_TRAVAUX_PV_SI_SUP_5ANS = 0.075;

// Forfait communication et gestion (défalcable en IR)
export const FORFAIT_COMMUNICATION_PAR_BIEN = 20;

// Frais de notaire - barème émoluments du notaire
// Tranches art. A444-91 CCom (barème S1)
export const EMOLUMENTS_NOTAIRE_TRANCHES = [
  { seuil: 6_500, taux: 0.0387 },
  { seuil: 17_000, taux: 0.01596 },
  { seuil: 60_000, taux: 0.01064 },
  { seuil: Infinity, taux: 0.00799 },
];
export const EMOLUMENTS_FORMALITE = 800;
export const FRAIS_DIVERS_NOTAIRE = 400;
export const TVA_NOTAIRE = 0.2;

// DMTO pour immobilier ancien
export const DMTO_ANCIEN_TAXE_DEP = 0.045;
export const DMTO_ANCIEN_TAXE_COM = 0.012;
export const DMTO_ANCIEN_TAXE_ETAT_SUR_DEP = 0.0237;
export const DMTO_CSI = 0.001;

// TVA immobilier neuf (appliquée sur prix HT)
export const DMTO_NEUF_TAUX = 0.0071498; // taxe publicité foncière réduite
