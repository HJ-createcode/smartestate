// Calcul de la plus-value à la revente, régime IR (SCI transparente) et IS

import type {
  InputsProjet,
  LigneAmortEmprunt,
  ResultatPlusValueIR,
  ResultatPlusValueIS,
  LigneCompteResultatIR,
} from "./types";
import {
  abattementIR,
  abattementPS,
  CSG_CRDS_TOTAL,
  FORFAIT_TRAVAUX_PV_SI_SUP_5ANS,
  surtaxePV,
  TAUX_IR_PV_IMMO,
} from "./constants";
import { agregerAnnee } from "./loan";
import { tableauAmortissementComptable } from "./depreciation";
import { calculerIS } from "./tax";

function prixReventeEstime(
  inputs: InputsProjet,
  compteIR: LigneCompteResultatIR[]
): number {
  const r = inputs.revente;
  const n = r.anneeRevente;
  if (r.choix === "fixe") return r.prixFixe;
  if (r.choix === "inflation") {
    return inputs.prixAchat * Math.pow(1 + r.inflationAnnuelle, n - 1);
  }
  // rendement cible : prix = (loyers - charges) / taux cible
  const ligne = compteIR[n - 1];
  if (!ligne || r.rendementCibleAcheteur <= 0) return inputs.prixAchat;
  return (ligne.loyers - ligne.chargesDeductibles) / r.rendementCibleAcheteur;
}

export function calculerPlusValueIR(
  inputs: InputsProjet,
  tableauEmprunt: LigneAmortEmprunt[],
  compteIR: LigneCompteResultatIR[]
): ResultatPlusValueIR {
  const n = inputs.revente.anneeRevente;
  const prixVente = prixReventeEstime(inputs, compteIR);
  const fraisVente = prixVente * inputs.revente.fraisRevente;

  // Assiette = prix vente - prix achat - frais notaire - forfait travaux si >5 ans
  const fraisAcquisitionForfait = 0.075 * inputs.prixAchat; // forfait 7.5% frais acquisition
  const forfaitTravaux =
    n > 5 ? FORFAIT_TRAVAUX_PV_SI_SUP_5ANS * inputs.prixAchat : 0;
  const baseBrute = Math.max(
    0,
    prixVente - fraisVente - inputs.prixAchat - fraisAcquisitionForfait - forfaitTravaux
  );

  const abatIR = abattementIR(n);
  const abatPS = abattementPS(n);
  const assietteIR = baseBrute * (1 - abatIR);
  const assiettePS = baseBrute * (1 - abatPS);

  const impotIR = assietteIR * TAUX_IR_PV_IMMO;
  const prelevementsSociaux = assiettePS * CSG_CRDS_TOTAL;
  const surtaxe = surtaxePV(assietteIR);

  const crd =
    n * 12 <= tableauEmprunt.length
      ? tableauEmprunt[n * 12 - 1]?.capitalRestant ?? 0
      : 0;

  const gainNet =
    prixVente - fraisVente - impotIR - prelevementsSociaux - surtaxe - crd;

  return {
    prixVente,
    fraisVente,
    anneeDetention: n,
    abattementIR: abatIR,
    abattementPS: abatPS,
    assietteIR,
    assiettePS,
    impotIR,
    prelevementsSociaux,
    surtaxe,
    capitalRestantDu: crd,
    gainNet,
  };
}

export function calculerPlusValueIS(
  inputs: InputsProjet,
  tableauEmprunt: LigneAmortEmprunt[],
  compteIR: LigneCompteResultatIR[]
): ResultatPlusValueIS {
  const n = inputs.revente.anneeRevente;
  const prixVente = prixReventeEstime(inputs, compteIR);
  const fraisVente = prixVente * inputs.revente.fraisRevente;
  const tableauAmort = tableauAmortissementComptable(inputs, n);
  const valeurNetteComptable =
    tableauAmort[tableauAmort.length - 1]?.valeurNetteComptable ?? inputs.prixAchat;

  const plusValueProfessionnelle = prixVente - fraisVente - valeurNetteComptable;
  const impotISSupplementaire = calculerIS(Math.max(0, plusValueProfessionnelle));

  const crd =
    n * 12 <= tableauEmprunt.length
      ? tableauEmprunt[n * 12 - 1]?.capitalRestant ?? 0
      : 0;

  const gainNet = prixVente - fraisVente - crd - impotISSupplementaire;

  return {
    prixVente,
    fraisVente,
    valeurNetteComptable,
    plusValueProfessionnelle,
    impotISSupplementaire,
    capitalRestantDu: crd,
    gainNet,
  };
}
