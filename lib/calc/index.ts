// Orchestrateur du calcul global

import type { InputsProjet, ResultatsComplets, Synthese } from "./types";
import { calculerFraisNotaire, calculerCoutGarantie } from "./notaire";
import {
  tableauAmortissement,
  tauxEffectifGlobal,
  agregerAnnee,
} from "./loan";
import {
  chargesFixesAnnuelles,
  coutInitialTotal,
  loyersAnnuels,
} from "./yield";
import { compteResultatIR, detailsAssociesAnnee } from "./ir";
import { compteResultatIS } from "./is";
import { calculerPlusValueIR, calculerPlusValueIS } from "./sale";
import { tableauAmortissementComptable } from "./depreciation";

export function calculerTout(inputs: InputsProjet): ResultatsComplets {
  // 1. Frais de notaire
  const fraisNotaire = calculerFraisNotaire(inputs.prixAchat, inputs.typeBien);

  // 2. Coût initial et investissement total
  const coutInitial = coutInitialTotal(inputs, fraisNotaire.total);
  const loyers = loyersAnnuels(inputs);
  const chargesFixes = chargesFixesAnnuelles(inputs);

  // 3. Tableau d'amortissement du prêt
  const tableau = tableauAmortissement(inputs.financement);

  const coutGarantie = calculerCoutGarantie(
    inputs.financement.montantEmprunt,
    inputs.prixAchat,
    inputs.financement.typeGarantie
  );

  // Mensualité premier mois normal (post-différé)
  const ligneRef = tableau[inputs.financement.differeMois] ?? tableau[0];
  const mensualite = ligneRef?.mensualite ?? 0;
  const mensualiteAvecAssurance =
    mensualite + inputs.financement.assuranceMensuelleFixe;
  const teg = tauxEffectifGlobal(
    inputs.financement.montantEmprunt,
    mensualiteAvecAssurance,
    inputs.financement.dureeAnnees,
    inputs.financement.fraisDossier,
    coutGarantie
  );

  const investissementTotal =
    inputs.prixAchat +
    inputs.fraisAgence +
    inputs.fraisRecherche +
    fraisNotaire.total;

  // 4. Comptes de résultat
  const compteIR = compteResultatIR(inputs, tableau);
  const compteIS = compteResultatIS(inputs, tableau);

  // 5. Autofinancement
  const autofinancementIRMensuel10 =
    compteIR.slice(0, 10).reduce((s, l) => s + l.effortEpargne, 0) /
    (compteIR.length * 12);
  const cashFlowISMoyen =
    compteIS.slice(0, 10).reduce((s, l) => s + l.cashFlowNet, 0) /
    (compteIS.length * 12);

  // 6. Détails associés (année 1 pour affichage)
  const detailsAssociesAn1 = detailsAssociesAnnee(inputs, compteIR[0]?.baseRevenuFoncier ?? 0);

  // 7. Plus-value
  const pvIR = calculerPlusValueIR(inputs, tableau, compteIR);
  const pvIS = calculerPlusValueIS(inputs, tableau, compteIR);

  // 8. Tableau d'amortissement comptable
  const tableauAmortCompta = tableauAmortissementComptable(
    inputs,
    inputs.horizonAnnees
  ).map((l) => ({
    annee: l.annee,
    amortissementAnnuel: l.amortissementAnnuel,
    cumul: l.cumul,
    valeurNetteComptable: l.valeurNetteComptable,
  }));

  // 9. Recommandation
  const cumulIR = compteIR[compteIR.length - 1]?.cumule ?? 0;
  const cumulIS = compteIS[compteIS.length - 1]?.cumule ?? 0;
  const gainIRTotal = cumulIR + pvIR.gainNet;
  const gainISTotal = cumulIS + pvIS.gainNet;
  const diff = gainISTotal - gainIRTotal;
  let regime: "IR" | "IS" | "equivalent" = "equivalent";
  if (Math.abs(diff) < investissementTotal * 0.01) regime = "equivalent";
  else if (diff > 0) regime = "IS";
  else regime = "IR";
  let commentaire = "";
  if (regime === "IR") {
    commentaire =
      "Le régime IR est plus favorable sur l'horizon analysé, principalement parce que l'imposition sur les revenus fonciers reste modeste (éventuels déficits imputables) et que la plus-value bénéficie des abattements pour durée de détention.";
  } else if (regime === "IS") {
    commentaire =
      "Le régime IS est plus favorable car les amortissements du bien neutralisent le résultat imposable durant les premières années. La plus-value professionnelle est cependant plus lourde : le calcul devient moins avantageux sur une longue détention.";
  } else {
    commentaire =
      "Les deux régimes aboutissent à un résultat financier comparable. Le choix peut se faire sur des critères non fiscaux : flexibilité, distribution, transmission.";
  }

  // 10. Prix à négocier pour atteindre un objectif de rendement net
  const rendementNetCible = 0.08;
  const prixObjectif =
    rendementNetCible > 0 ? (loyers - chargesFixes) / rendementNetCible : 0;

  const synthese: Synthese = {
    fraisNotaire,
    coutInitialTotal: coutInitial,
    investissementTotal,
    mensualiteCredit: mensualite,
    mensualiteAvecAssurance,
    tegAnnuel: teg,
    loyersAnnuels: loyers,
    chargesFixesAnnuelles: chargesFixes,
    rendementBrut: investissementTotal > 0 ? loyers / investissementTotal : 0,
    rendementNet:
      investissementTotal > 0
        ? (loyers - chargesFixes) / investissementTotal
        : 0,
    autofinancementSimple: loyers / 12 - mensualite,
    autofinancementNet: (loyers - chargesFixes) / 12 - mensualite,
    autofinancementIRMensuel10ans: autofinancementIRMensuel10,
    autofinancementISMensuel10ans: cashFlowISMoyen,
    prixNegocierObjectifRendement: prixObjectif,
    rendementNetCible,
  };

  // Tableau associés par année (simplifié : on utilise la base de chaque année)
  const associesIR = compteIR.map((ligne) =>
    detailsAssociesAnnee(inputs, ligne.baseRevenuFoncier)
  );

  return {
    synthese,
    amortissementEmprunt: tableau,
    compteResultatIR: compteIR,
    compteResultatIS: compteIS,
    associesIR,
    plusValueIR: pvIR,
    plusValueIS: pvIS,
    tableauAmortComptable: tableauAmortCompta,
    recommandation: {
      regimeFavorable: regime,
      avantageEurosA10Ans: Math.abs(diff),
      commentaire,
    },
  };
}
