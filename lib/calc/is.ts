// Compte de résultat en régime IS (SCI soumise à l'impôt sur les sociétés)

import type {
  InputsProjet,
  LigneAmortEmprunt,
  LigneCompteResultatIS,
} from "./types";
import { agregerAnnee } from "./loan";
import { chargesFixesAnnuelles, loyersAnnuels } from "./yield";
import { dotationsAmortissementAnnuelle } from "./depreciation";
import { calculerIS } from "./tax";

export function compteResultatIS(
  inputs: InputsProjet,
  tableauEmprunt: LigneAmortEmprunt[]
): LigneCompteResultatIS[] {
  const horizon = inputs.horizonAnnees;
  const loyersBase = loyersAnnuels(inputs);
  const chargesBase = chargesFixesAnnuelles(inputs);

  const lignes: LigneCompteResultatIS[] = [];
  let cumule = 0;
  let loyersAnnee = loyersBase;
  let deficitsReportes = 0;

  for (let n = 1; n <= horizon; n++) {
    const travauxAnnee = inputs.travaux.find((t) => t.annee === n);
    const augmentationLoyer = travauxAnnee?.augmentationLoyerAnnuelle ?? 0;
    if (n > 1) {
      loyersAnnee = loyersAnnee * (1 + inputs.irlAnnuel) + augmentationLoyer;
    } else {
      loyersAnnee = loyersBase + augmentationLoyer;
    }
    const crl = inputs.charges.crl25pct ? loyersAnnee * 0.025 : 0;

    const chargesRecurrentes =
      chargesBase * Math.pow(1 + inputs.inflationCharges, n);
    const travauxDeductibles = travauxAnnee?.deductibleSocietes ?? 0;
    const fraisFixesSociete =
      inputs.charges.fraisComptablesIS + inputs.charges.fraisComptablesIR;

    const fraisAcquisitionIS =
      inputs.charges.traitementFraisAcquisition === "charge" && n === 1
        ? inputs.fraisAgence + inputs.fraisRecherche
        : 0;

    const { dotation } = dotationsAmortissementAnnuelle(inputs, n);

    const agr = agregerAnnee(tableauEmprunt, n);

    const resultatFiscalBrut =
      loyersAnnee -
      crl -
      chargesRecurrentes -
      travauxDeductibles -
      fraisAcquisitionIS -
      fraisFixesSociete -
      dotation -
      agr.interets -
      agr.assurance;

    // Imputation des déficits antérieurs
    let resultatImposable = resultatFiscalBrut;
    let deficitsImpute = 0;
    if (resultatFiscalBrut > 0 && deficitsReportes > 0) {
      deficitsImpute = Math.min(deficitsReportes, resultatFiscalBrut);
      resultatImposable -= deficitsImpute;
      deficitsReportes -= deficitsImpute;
    } else if (resultatFiscalBrut < 0) {
      deficitsReportes += -resultatFiscalBrut;
      resultatImposable = 0;
    }

    const impotIS = calculerIS(resultatImposable);
    const resultatNet = resultatFiscalBrut - impotIS;

    // Cash flow : résultat net + amortissements (pas de sortie cash) - remboursement capital
    const cashFlowNet =
      resultatNet + dotation - agr.capitalRembourse + fraisAcquisitionIS;

    cumule += cashFlowNet;

    lignes.push({
      annee: n,
      loyers: loyersAnnee,
      crl,
      chargesRecurrentes,
      travauxDeductibles,
      fraisAcquisitionIS,
      fraisFixesSociete,
      amortissements: dotation,
      interets: agr.interets,
      assurance: agr.assurance,
      resultatFiscal: resultatFiscalBrut,
      deficitsReportes,
      impotIS,
      resultatNet,
      cashFlowNet,
      cumule,
    });
  }

  return lignes;
}
