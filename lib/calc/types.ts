// Types partagés entre client et serveur

export type TypeBien = "ancien" | "neuf";
export type TypeGarantie = "hypotheque" | "ippd" | "cautionnement";
export type FraisAcquisition = "charge" | "amortissement10";
export type ChoixRevente = "inflation" | "rendement" | "fixe";

export type ModeDetention =
  | "direct"
  | "sci_ir"
  | "sci_is"
  | "sarl_familiale"
  | "indivision";

export type RegimeFiscal =
  | "ir_foncier_reel"
  | "ir_micro_foncier"
  | "ir_bic_lmnp"
  | "is";

export interface Detention {
  mode: ModeDetention;
  regimeFiscal: RegimeFiscal;
}

export interface BienLoue {
  nombre: number;
  loyerMensuel: number;
  joursVacancePart: number; // jours non loués / impayés par an
}

export interface Charges {
  taxeFonciereAnnuelle: number;
  tomAnnuelle: number; // taxe ordures ménagères incluse dans taxe foncière
  coproprieteAnnuelle: number;
  fraisGestionPctLoyers: number;
  etatDesLieux: number;
  gliPctLoyers: number;
  pnoAnnuelle: number;
  autresAnnuelle: number;
  fraisComptablesIR: number;
  fraisComptablesIS: number;
  traitementFraisAcquisition: FraisAcquisition;
  crl25pct: boolean; // Contribution sur Revenus Locatifs
}

export interface TravauxAnnee {
  annee: number;
  deductibleParticuliers: number; // IR seulement
  deductibleSocietes: number; // IR+IS
  augmentationLoyerAnnuelle: number;
}

export interface Financement {
  montantEmprunt: number;
  tauxNominal: number; // ex: 0.0125
  dureeAnnees: number;
  assuranceMensuelleFixe: number;
  fraisDossier: number;
  typeGarantie: TypeGarantie;
  differeMois: 0 | 6;
}

export interface AmortissementComposant {
  nom: string;
  proportion: number; // 0..1 de la valeur du bien
  dureeAnnees: number; // 0 = pas d'amortissement (ex. terrain)
}

export interface Associe {
  prenom: string;
  apportCapital: number;
  apportCompteCourant: number;
  pctParts: number; // 0..1
  revenuNetImposableHorsFoncier: number;
  deficitsFonciersPrealables: number;
  nbPartsFiscales: number; // quotient familial
  nbPartsEnfants: number; // pour plafond demi-part
}

export interface Revente {
  choix: ChoixRevente;
  anneeRevente: number;
  inflationAnnuelle: number;
  rendementCibleAcheteur: number; // pour le choix "rendement"
  prixFixe: number; // pour le choix "fixe"
  fraisRevente: number; // ex: 0.015
}

export interface InputsProjet {
  nomProjet: string;
  typeBien: TypeBien;
  prixAchat: number;
  fraisAgence: number;
  fraisRecherche: number;
  anneeAcquisition: number;
  detention: Detention;
  financement: Financement;
  biens: BienLoue[];
  charges: Charges;
  travaux: TravauxAnnee[];
  amortComposants: AmortissementComposant[];
  associes: Associe[];
  revente: Revente;
  irlAnnuel: number; // revalorisation loyers
  inflationCharges: number; // revalorisation charges
  horizonAnnees: number; // généralement 10
}

// --- OUTPUTS ---

export interface LigneAmortEmprunt {
  numero: number;
  mensualite: number;
  capitalRestant: number;
  capitalRembourse: number;
  interets: number;
  assurance: number;
}

export interface FraisNotaireDetail {
  emolumentsHT: number;
  emolumentsFormalite: number;
  emolumentsPlafond10: number;
  tva: number;
  emolumentsFinal: number;
  fraisDivers: number;
  droitsMutation: number;
  contributionSecuriteImmo: number;
  total: number;
  pctDuPrix: number;
}

export interface LigneCompteResultatIR {
  annee: number;
  loyers: number;
  chargesDeductibles: number;
  travauxDeductibles: number;
  cashFlowAvantImpots: number;
  annuite: number;
  capitalRestantFinPeriode: number;
  capitalRembourse: number;
  interets: number;
  assurance: number;
  forfaitCommunication: number; // 20€/bien
  baseRevenuFoncier: number; // base IR
  cashFlowAvantIR: number;
  differentielIR: number; // sur l'ensemble des associés, positif = surcroît d'impôt (affecte négativement le cash flow)
  effortEpargne: number;
  cumule: number;
}

export interface LigneCompteResultatIS {
  annee: number;
  loyers: number;
  crl: number;
  chargesRecurrentes: number;
  travauxDeductibles: number;
  fraisAcquisitionIS: number;
  fraisFixesSociete: number;
  amortissements: number;
  interets: number;
  assurance: number;
  resultatFiscal: number;
  deficitsReportes: number; // imputables
  impotIS: number;
  resultatNet: number;
  cashFlowNet: number;
  cumule: number;
}

export interface DetailAssocie {
  prenom: string;
  pctParts: number;
  // Sans le projet
  impotReference: number;
  // Avec le projet - régime IR
  impotAvecProjetIR: number;
  differentielIR: number; // supplément annuel
  psSurRevenuFoncier: number;
  // Avec le projet - régime IS + dividendes
  impotAvecProjetISSansPFU: number;
  impotAvecProjetISAvecPFU: number;
}

export interface ResultatPlusValueIR {
  prixVente: number;
  fraisVente: number;
  anneeDetention: number;
  abattementIR: number;
  abattementPS: number;
  assietteIR: number;
  assiettePS: number;
  impotIR: number;
  prelevementsSociaux: number;
  surtaxe: number;
  capitalRestantDu: number;
  gainNet: number;
}

export interface ResultatPlusValueIS {
  prixVente: number;
  fraisVente: number;
  valeurNetteComptable: number;
  plusValueProfessionnelle: number;
  impotISSupplementaire: number;
  capitalRestantDu: number;
  gainNet: number;
}

export interface Synthese {
  fraisNotaire: FraisNotaireDetail;
  coutInitialTotal: number;
  investissementTotal: number;
  mensualiteCredit: number;
  mensualiteAvecAssurance: number;
  tegAnnuel: number;
  loyersAnnuels: number;
  chargesFixesAnnuelles: number;
  rendementBrut: number;
  rendementNet: number;
  autofinancementSimple: number; // mensuel
  autofinancementNet: number; // mensuel
  autofinancementIRMensuel10ans: number;
  autofinancementISMensuel10ans: number;
  prixNegocierObjectifRendement: number; // pour rendement net cible
  rendementNetCible: number;
}

export interface ResultatsComplets {
  synthese: Synthese;
  amortissementEmprunt: LigneAmortEmprunt[];
  compteResultatIR: LigneCompteResultatIR[];
  compteResultatIS: LigneCompteResultatIS[];
  associesIR: DetailAssocie[][]; // [annee][associe]
  plusValueIR: ResultatPlusValueIR;
  plusValueIS: ResultatPlusValueIS;
  tableauAmortComptable: {
    annee: number;
    amortissementAnnuel: number;
    cumul: number;
    valeurNetteComptable: number;
  }[];
  recommandation: {
    regimeFavorable: "IR" | "IS" | "equivalent";
    avantageEurosA10Ans: number;
    commentaire: string;
  };
}

export interface CalculateRequest {
  inputs: InputsProjet;
}

export interface CalculateResponse {
  ok: boolean;
  data?: ResultatsComplets;
  errors?: string[];
}
