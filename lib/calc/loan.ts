// Calcul du tableau d'amortissement d'un prêt à taux fixe, mensualités constantes.
// Reproduit les fonctions Excel PPMT / IPMT avec taux mensuel équivalent (1+r)^(1/12)-1

import type { Financement, LigneAmortEmprunt } from "./types";

function tauxMensuelEquiv(tauxAnnuel: number): number {
  return Math.pow(1 + tauxAnnuel, 1 / 12) - 1;
}

// PMT d'un prêt classique
function pmt(taux: number, n: number, capital: number): number {
  if (taux === 0) return capital / n;
  return (capital * taux) / (1 - Math.pow(1 + taux, -n));
}

// IPMT : part d'intérêts de l'échéance numéro p
function ipmt(taux: number, p: number, n: number, capital: number): number {
  const m = pmt(taux, n, capital);
  // Capital restant dû avant échéance p
  const reste =
    capital * Math.pow(1 + taux, p - 1) -
    m * ((Math.pow(1 + taux, p - 1) - 1) / taux);
  return -reste * taux;
}

function ppmt(taux: number, p: number, n: number, capital: number): number {
  return -pmt(taux, n, capital) - ipmt(taux, p, n, capital);
}

/**
 * Construit le tableau d'amortissement mois par mois.
 * En cas de différé 6 mois : pendant les 6 premiers mois, on ne paie que
 * les intérêts sur le capital total emprunté, puis on entame l'amortissement
 * sur (dureeAnnees*12 - 6) mois.
 */
export function tableauAmortissement(
  f: Financement
): LigneAmortEmprunt[] {
  const taux = tauxMensuelEquiv(f.tauxNominal);
  const capital = f.montantEmprunt;
  const nTotal = f.dureeAnnees * 12;
  const differe = f.differeMois;
  const lignes: LigneAmortEmprunt[] = [];

  if (differe === 0) {
    for (let i = 1; i <= nTotal; i++) {
      const interets = -ipmt(taux, i, nTotal, capital);
      const capitalRembourseM = -ppmt(taux, i, nTotal, capital);
      const mensualite = interets + capitalRembourseM;
      const dejaRembourse = lignes.reduce(
        (s, l) => s + l.capitalRembourse,
        0
      );
      lignes.push({
        numero: i,
        mensualite,
        capitalRestant: capital - dejaRembourse - capitalRembourseM,
        capitalRembourse: capitalRembourseM,
        interets,
        assurance: f.assuranceMensuelleFixe,
      });
    }
  } else {
    // Différé d'amortissement : 6 mois d'intérêts seuls
    const interetsDiffere = capital * taux;
    for (let i = 1; i <= differe; i++) {
      lignes.push({
        numero: i,
        mensualite: interetsDiffere,
        capitalRestant: capital,
        capitalRembourse: 0,
        interets: interetsDiffere,
        assurance: f.assuranceMensuelleFixe,
      });
    }
    const nRest = nTotal - differe;
    for (let i = 1; i <= nRest; i++) {
      const interets = -ipmt(taux, i, nRest, capital);
      const capitalRembourseM = -ppmt(taux, i, nRest, capital);
      const mensualite = interets + capitalRembourseM;
      const dejaRembourse = lignes.reduce(
        (s, l) => s + l.capitalRembourse,
        0
      );
      lignes.push({
        numero: differe + i,
        mensualite,
        capitalRestant: capital - dejaRembourse - capitalRembourseM,
        capitalRembourse: capitalRembourseM,
        interets,
        assurance: f.assuranceMensuelleFixe,
      });
    }
  }

  return lignes;
}

/**
 * TEG annuel : taux effectif global mensuel × 12. On utilise RATE pour
 * résoudre le taux qui, appliqué à la mensualité moyenne, reconstitue
 * le capital disponible (net des frais de dossier et de garantie).
 */
export function tauxEffectifGlobal(
  capital: number,
  mensualiteAvecAssurance: number,
  dureeAnnees: number,
  fraisDossier: number,
  coutGarantie: number
): number {
  const n = dureeAnnees * 12;
  const capitalDispo = capital - fraisDossier - coutGarantie;
  if (capitalDispo <= 0 || mensualiteAvecAssurance <= 0) return 0;
  // Résolution Newton pour PMT(r,n,-capitalDispo) = mensualite
  let r = 0.001;
  for (let iter = 0; iter < 100; iter++) {
    const f = pmt(r, n, capitalDispo) - mensualiteAvecAssurance;
    const fp =
      (pmt(r + 1e-7, n, capitalDispo) - pmt(r - 1e-7, n, capitalDispo)) /
      2e-7;
    if (Math.abs(fp) < 1e-12) break;
    const next = r - f / fp;
    if (Math.abs(next - r) < 1e-10) return next * 12;
    r = Math.max(next, -0.99);
  }
  return r * 12;
}

// Agrégat annuel du tableau d'amortissement : pour l'année N (1-based)
export function agregerAnnee(
  tableau: LigneAmortEmprunt[],
  anneeFiscale: number
): {
  annuite: number;
  capitalRestantFinPeriode: number;
  capitalRembourse: number;
  interets: number;
  assurance: number;
} {
  const debut = (anneeFiscale - 1) * 12;
  const fin = Math.min(anneeFiscale * 12, tableau.length);
  let annuite = 0;
  let capitalRembourse = 0;
  let interets = 0;
  let assurance = 0;
  for (let i = debut; i < fin; i++) {
    const l = tableau[i];
    if (!l) continue;
    annuite += l.mensualite + l.assurance;
    capitalRembourse += l.capitalRembourse;
    interets += l.interets;
    assurance += l.assurance;
  }
  const capitalRestantFinPeriode =
    tableau[Math.min(fin - 1, tableau.length - 1)]?.capitalRestant ?? 0;
  return {
    annuite,
    capitalRestantFinPeriode,
    capitalRembourse,
    interets,
    assurance,
  };
}
