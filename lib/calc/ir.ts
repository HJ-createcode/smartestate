// Compte de résultat fiscal en régime IR (Revenus fonciers)
// et calcul du différentiel d'impôt par associé

import type {
  InputsProjet,
  LigneAmortEmprunt,
  LigneCompteResultatIR,
  DetailAssocie,
} from "./types";
import { agregerAnnee } from "./loan";
import {
  chargesFixesAnnuelles,
  loyersAnnuels,
  nombreTotalBiens,
} from "./yield";
import {
  CSG_CRDS_TOTAL,
  FORFAIT_COMMUNICATION_PAR_BIEN,
  PLAFOND_DEFICIT_RBG,
  PLAFOND_DEMI_PART,
} from "./constants";
import { impotParPart } from "./tax";

export function compteResultatIR(
  inputs: InputsProjet,
  tableauEmprunt: LigneAmortEmprunt[]
): LigneCompteResultatIR[] {
  const horizon = inputs.horizonAnnees;
  const loyersBase = loyersAnnuels(inputs);
  const chargesBase = chargesFixesAnnuelles(inputs);
  const nbBiens = nombreTotalBiens(inputs);
  const forfaitCommunication = nbBiens * FORFAIT_COMMUNICATION_PAR_BIEN;

  const lignes: LigneCompteResultatIR[] = [];
  let cumule = 0;
  let loyersAnnee = loyersBase;

  for (let n = 1; n <= horizon; n++) {
    const travauxAnnee = inputs.travaux.find((t) => t.annee === n);
    const augmentationLoyer = travauxAnnee?.augmentationLoyerAnnuelle ?? 0;
    if (n > 1) {
      loyersAnnee = loyersAnnee * (1 + inputs.irlAnnuel) + augmentationLoyer;
    } else {
      loyersAnnee = loyersBase + augmentationLoyer;
    }
    const chargesAnnee = chargesBase * Math.pow(1 + inputs.inflationCharges, n);
    const travauxDeductibles = travauxAnnee?.deductibleParticuliers ?? 0;
    const cashFlowAvantImpots = loyersAnnee - chargesAnnee - travauxDeductibles;

    const agr = agregerAnnee(tableauEmprunt, n);

    const baseRevenuFoncier =
      cashFlowAvantImpots -
      agr.interets -
      agr.assurance -
      forfaitCommunication;

    const cashFlowAvantIR = cashFlowAvantImpots - agr.annuite;

    // Différentiel d'impôt agrégé sur tous les associés
    const differentielIR = differentielIRTousAssocies(inputs, baseRevenuFoncier);

    const effort = cashFlowAvantIR - differentielIR;
    cumule += effort;

    lignes.push({
      annee: n,
      loyers: loyersAnnee,
      chargesDeductibles: chargesAnnee,
      travauxDeductibles,
      cashFlowAvantImpots,
      annuite: agr.annuite,
      capitalRestantFinPeriode: agr.capitalRestantFinPeriode,
      capitalRembourse: agr.capitalRembourse,
      interets: agr.interets,
      assurance: agr.assurance,
      forfaitCommunication,
      baseRevenuFoncier,
      cashFlowAvantIR,
      differentielIR,
      effortEpargne: effort,
      cumule,
    });
  }

  return lignes;
}

/**
 * Calcule le supplément d'IR (+ PS) à payer par l'ensemble des associés
 * du fait du revenu foncier (ou du gain fiscal si déficit imputable).
 * On simplifie : on applique à chaque associé sa quote-part du résultat
 * foncier, on traite le déficit foncier selon règles (plafond 10 700 €
 * sur revenu global, le reste en report), et on calcule la différence
 * d'IR + CSG-CRDS pour chaque associé.
 */
export function differentielIRTousAssocies(
  inputs: InputsProjet,
  baseFonciereSCI: number
): number {
  let total = 0;
  for (const assoc of inputs.associes) {
    const quotePart = assoc.pctParts * baseFonciereSCI;
    total += differentielIRAssocie(assoc, quotePart);
  }
  return total;
}

function differentielIRAssocie(
  assoc: {
    revenuNetImposableHorsFoncier: number;
    nbPartsFiscales: number;
    nbPartsEnfants: number;
  },
  quotePartRF: number
): number {
  const nbParts = Math.max(1, assoc.nbPartsFiscales);
  const nbPartsSansEnfants = Math.max(1, nbParts - assoc.nbPartsEnfants);

  // IR sans ce projet
  const refAvecQF =
    impotParPart(assoc.revenuNetImposableHorsFoncier / nbParts) * nbParts;
  const refSansEnfants =
    impotParPart(assoc.revenuNetImposableHorsFoncier / nbPartsSansEnfants) *
      nbPartsSansEnfants -
    PLAFOND_DEMI_PART * assoc.nbPartsEnfants;
  const impotRef = Math.max(refAvecQF, refSansEnfants);

  // Base imposable nouvelle : RBG + RF positif (ou -déficit imputable sur RBG)
  let assietteAvec = assoc.revenuNetImposableHorsFoncier;
  let csgCRDS = 0;

  if (quotePartRF > 0) {
    // Revenu foncier positif : ajout au RBG + PS
    assietteAvec += quotePartRF;
    csgCRDS = quotePartRF * CSG_CRDS_TOTAL;
  } else if (quotePartRF < 0) {
    // Déficit foncier : imputable sur RBG à hauteur de 10 700 €
    const imputable = Math.min(-quotePartRF, PLAFOND_DEFICIT_RBG);
    assietteAvec = Math.max(0, assoc.revenuNetImposableHorsFoncier - imputable);
    // Le surplus de déficit se reporte 10 ans sur les RF futurs (non modélisé ici)
  }

  const avecQF = impotParPart(assietteAvec / nbParts) * nbParts;
  const avecSansEnfants =
    impotParPart(assietteAvec / nbPartsSansEnfants) * nbPartsSansEnfants -
    PLAFOND_DEMI_PART * assoc.nbPartsEnfants;
  const impotAvec = Math.max(avecQF, avecSansEnfants) + csgCRDS;

  return impotAvec - impotRef;
}

/** Retourne le détail par associé pour l'année 1 (pour affichage) */
export function detailsAssociesAnnee(
  inputs: InputsProjet,
  baseFonciereSCI: number
): DetailAssocie[] {
  return inputs.associes.map((assoc) => {
    const quotePart = assoc.pctParts * baseFonciereSCI;
    const differentiel = differentielIRAssocie(assoc, quotePart);
    const ps = quotePart > 0 ? quotePart * CSG_CRDS_TOTAL : 0;
    return {
      prenom: assoc.prenom,
      pctParts: assoc.pctParts,
      impotReference: 0,
      impotAvecProjetIR: differentiel,
      differentielIR: differentiel,
      psSurRevenuFoncier: ps,
      impotAvecProjetISSansPFU: 0,
      impotAvecProjetISAvecPFU: 0,
    };
  });
}
