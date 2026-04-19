import type { FraisNotaireDetail, TypeBien } from "./types";
import {
  EMOLUMENTS_NOTAIRE_TRANCHES,
  EMOLUMENTS_FORMALITE,
  FRAIS_DIVERS_NOTAIRE,
  TVA_NOTAIRE,
  DMTO_ANCIEN_TAXE_DEP,
  DMTO_ANCIEN_TAXE_COM,
  DMTO_ANCIEN_TAXE_ETAT_SUR_DEP,
  DMTO_CSI,
  DMTO_NEUF_TAUX,
} from "./constants";

export function calculerFraisNotaire(
  prixAchat: number,
  type: TypeBien
): FraisNotaireDetail {
  // Émoluments par tranches
  let emolumentsHT = 0;
  let borneInf = 0;
  for (const t of EMOLUMENTS_NOTAIRE_TRANCHES) {
    const borneSup = t.seuil;
    if (prixAchat > borneInf) {
      const tranche = Math.max(0, Math.min(prixAchat, borneSup) - borneInf);
      emolumentsHT += tranche * t.taux;
    }
    borneInf = borneSup;
    if (prixAchat <= borneSup) break;
  }

  const emolumentsFormalite = EMOLUMENTS_FORMALITE;
  const emolumentsPlafond10 = Math.min(
    emolumentsHT + emolumentsFormalite,
    0.1 * prixAchat
  );
  const tva = emolumentsPlafond10 * TVA_NOTAIRE;
  const emolumentsFinal = emolumentsPlafond10 + tva;

  let droitsMutation = 0;
  if (type === "ancien") {
    const taxeDep = prixAchat * DMTO_ANCIEN_TAXE_DEP;
    const taxeCom = prixAchat * DMTO_ANCIEN_TAXE_COM;
    const taxeEtat = taxeDep * DMTO_ANCIEN_TAXE_ETAT_SUR_DEP;
    droitsMutation = taxeDep + taxeCom + taxeEtat;
  } else {
    // Neuf : taxe de publicité foncière réduite appliquée sur prix HT
    droitsMutation = (prixAchat / 1.2) * DMTO_ANCIEN_TAXE_ETAT_SUR_DEP;
    // Approximation utilisée dans le modèle source : DMTO remplacée par TPF réduite
    // Le neuf est principalement taxé à travers la TVA immobilière (déjà dans le prix)
  }

  const contributionSecuriteImmo = Math.max(15, prixAchat * DMTO_CSI);
  const total =
    emolumentsFinal +
    FRAIS_DIVERS_NOTAIRE +
    droitsMutation +
    contributionSecuriteImmo;

  return {
    emolumentsHT,
    emolumentsFormalite,
    emolumentsPlafond10,
    tva,
    emolumentsFinal,
    fraisDivers: FRAIS_DIVERS_NOTAIRE,
    droitsMutation,
    contributionSecuriteImmo,
    total,
    pctDuPrix: prixAchat > 0 ? total / prixAchat : 0,
  };
}

// Coût garantie prêt
export function calculerCoutGarantie(
  montantEmprunt: number,
  prixAchat: number,
  type: "hypotheque" | "ippd" | "cautionnement"
): number {
  if (montantEmprunt <= 1) return 0;
  if (type === "hypotheque") {
    // Taxe publicité foncière 0.71498% (majoré 20%) + CSI 0.1% + émoluments/TVA estimés
    const tpf = 0.0071498 * prixAchat * 1.2;
    const csi = prixAchat * 0.001;
    const emol = calculerFraisNotaire(prixAchat, "ancien").emolumentsHT / 3;
    const tva = emol * 0.2;
    return tpf + csi + emol + 250 + tva;
  }
  if (type === "ippd") {
    const csi = prixAchat * 0.0005;
    const emol = calculerFraisNotaire(prixAchat, "ancien").emolumentsHT / 3;
    const tva = emol * 0.2;
    return csi + emol + 250 + tva;
  }
  // Cautionnement
  const assiette = prixAchat;
  const commission =
    assiette <= 50_000 ? 250 : assiette < 100_000 ? assiette * 0.005 : 490;
  const fondsMutuel = 230 + commission * 0.0089;
  // Restitution 69.73% en fin d'emprunt - on ne l'intègre pas au coût initial
  return commission + fondsMutuel;
}
