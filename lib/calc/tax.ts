// Barèmes d'impôt et utilitaires

import {
  TRANCHES_IR,
  IS_SEUIL_1,
  IS_SEUIL_2,
  IS_TAUX_1,
  IS_TAUX_2,
  IS_TAUX_3,
} from "./constants";

/** IR par part calculé avec le barème progressif (valeur arrondie) */
export function impotParPart(revenuNetImposableParPart: number): number {
  if (revenuNetImposableParPart <= 0) return 0;
  let impot = 0;
  let reste = revenuNetImposableParPart;
  let borne = 0;
  for (const t of TRANCHES_IR) {
    const assiette = Math.max(0, Math.min(reste + borne, t.seuil) - borne);
    impot += assiette * t.taux;
    if (reste + borne <= t.seuil) break;
    borne = t.seuil;
  }
  return impot;
}

/** IS PME : 15% jusqu'à 42 500 €, 25% au-delà */
export function calculerIS(resultatFiscal: number): number {
  if (resultatFiscal <= 0) return 0;
  let impot = 0;
  const t1 = Math.min(resultatFiscal, IS_SEUIL_1) * IS_TAUX_1;
  impot += t1;
  if (resultatFiscal > IS_SEUIL_1) {
    const t2 =
      Math.min(resultatFiscal, IS_SEUIL_2) * IS_TAUX_2 -
      IS_SEUIL_1 * IS_TAUX_2;
    impot += t2;
  }
  if (resultatFiscal > IS_SEUIL_2) {
    impot += (resultatFiscal - IS_SEUIL_2) * IS_TAUX_3;
  }
  return impot;
}
