// Rendements et autofinancement

import type { InputsProjet } from "./types";

export function loyersAnnuels(inputs: InputsProjet): number {
  return inputs.biens.reduce((acc, b) => {
    if (b.nombre <= 0) return acc;
    // Formule : nombre × loyer × (365 - jours non loués)/365 × 12
    return (
      acc +
      b.nombre * b.loyerMensuel * ((365 - b.joursVacancePart) / 365) * 12
    );
  }, 0);
}

export function nombreTotalBiens(inputs: InputsProjet): number {
  return inputs.biens.reduce((s, b) => s + b.nombre, 0);
}

export function chargesFixesAnnuelles(inputs: InputsProjet): number {
  const loyers = loyersAnnuels(inputs);
  const c = inputs.charges;
  const total =
    c.taxeFonciereAnnuelle -
    2 * c.tomAnnuelle + // TOM est incluse dans taxe fonciere ET répercutée locataire, donc -2×
    c.coproprieteAnnuelle +
    c.etatDesLieux +
    c.pnoAnnuelle +
    c.autresAnnuelle +
    c.fraisGestionPctLoyers * loyers +
    c.gliPctLoyers * loyers;
  return total;
}

export function coutInitialTotal(inputs: InputsProjet, fraisNotaire: number): number {
  const travauxAn1 =
    inputs.travaux.find((t) => t.annee === 1)?.deductibleParticuliers ?? 0;
  const travauxSocAn1 =
    inputs.travaux.find((t) => t.annee === 1)?.deductibleSocietes ?? 0;
  return (
    inputs.prixAchat +
    inputs.fraisAgence +
    inputs.fraisRecherche +
    travauxAn1 +
    travauxSocAn1 +
    fraisNotaire
  );
}
