// Amortissement comptable pour la SCI à l'IS

import type { AmortissementComposant, InputsProjet } from "./types";

/**
 * Génère la dotation annuelle d'amortissement et le tableau du bien amorti.
 * Le terrain (proportion × prix) n'est jamais amorti.
 * Les frais d'acquisition peuvent être amortis sur 10 ans si l'utilisateur choisit.
 * Les travaux IS-déductibles s'ajoutent aux immobilisations mais on les passe
 * en charge immédiate dans notre modèle simplifié (conforme à Excel source où
 * la valeur travaux est sommée dans "C124" comme charge et non comme
 * immobilisation amortie — donc ici on ne les immobilise pas).
 */
export function dotationsAmortissementAnnuelle(
  inputs: InputsProjet,
  annee: number // 1-based
): { dotation: number; detail: Record<string, number> } {
  const { prixAchat, amortComposants, charges, fraisAgence, fraisRecherche } =
    inputs;
  const detail: Record<string, number> = {};
  let dotation = 0;

  for (const comp of amortComposants) {
    if (comp.dureeAnnees <= 0) continue;
    if (annee > comp.dureeAnnees) continue;
    const valeurImmo = prixAchat * comp.proportion;
    const annuelle = valeurImmo / comp.dureeAnnees;
    detail[comp.nom] = annuelle;
    dotation += annuelle;
  }

  if (
    charges.traitementFraisAcquisition === "amortissement10" &&
    annee <= 10
  ) {
    // Amortissement des frais d'acquisition (agence + recherche + frais de notaire approximés)
    const fraisAcq =
      fraisAgence + fraisRecherche + prixAchat * 0.08; // approx frais notaire moyens
    const dotFraisAcq = fraisAcq / 10;
    detail["Frais acquisition"] = dotFraisAcq;
    dotation += dotFraisAcq;
  }

  return { dotation, detail };
}

export interface LigneAmortComptable {
  annee: number;
  amortissementAnnuel: number;
  cumul: number;
  valeurBrute: number;
  valeurNetteComptable: number;
}

export function tableauAmortissementComptable(
  inputs: InputsProjet,
  horizon: number
): LigneAmortComptable[] {
  const { prixAchat } = inputs;
  const lignes: LigneAmortComptable[] = [];
  let cumul = 0;
  for (let annee = 1; annee <= horizon; annee++) {
    const { dotation } = dotationsAmortissementAnnuelle(inputs, annee);
    cumul += dotation;
    const valeurNetteComptable = Math.max(0, prixAchat - cumul);
    lignes.push({
      annee,
      amortissementAnnuel: dotation,
      cumul,
      valeurBrute: prixAchat,
      valeurNetteComptable,
    });
  }
  return lignes;
}
