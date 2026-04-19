"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar, type SectionId } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { useInputs } from "@/lib/store/inputs";
import { useAccount } from "@/lib/store/account";
import { ProjetForm } from "@/components/forms/ProjetForm";
import { FinancementForm } from "@/components/forms/FinancementForm";
import { BiensForm } from "@/components/forms/BiensForm";
import { ChargesForm } from "@/components/forms/ChargesForm";
import { TravauxForm } from "@/components/forms/TravauxForm";
import { AmortissementForm } from "@/components/forms/AmortissementForm";
import { AssociesForm } from "@/components/forms/AssociesForm";
import { ReventeForm } from "@/components/forms/ReventeForm";
import { DetentionForm } from "@/components/forms/DetentionForm";
import { Results } from "@/components/Results";
import type { CalculateResponse } from "@/lib/calc/types";
import type { AssetSnapshot } from "@/lib/store/account";

const SECTIONS_ORDER: SectionId[] = [
  "projet",
  "detention",
  "financement",
  "biens",
  "charges",
  "travaux",
  "amortissement",
  "associes",
  "revente",
  "resultats",
];

export function SimulationEditor({ assetId }: { assetId: string }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  const asset = useAccount((s) => s.assets[assetId]);
  const updateInputs = useAccount((s) => s.updateInputs);
  const updateSnapshot = useAccount((s) => s.updateSnapshot);
  const validate = useAccount((s) => s.validate);
  const convertToBien = useAccount((s) => s.convertToBien);

  const [section, setSection] = useState<SectionId>("projet");
  const [justSaved, setJustSaved] = useState(false);

  const inputs = useInputs((s) => s.inputs);
  const results = useInputs((s) => s.results);
  const editorAssetId = useInputs((s) => s.assetId);
  const loadAsset = useInputs((s) => s.loadAsset);
  const setResults = useInputs((s) => s.setResults);
  const setLoading = useInputs((s) => s.setLoading);
  const setError = useInputs((s) => s.setError);

  // Hydrate store persisté
  useEffect(() => setHydrated(true), []);

  // Charger les inputs de l'asset dans l'éditeur
  useEffect(() => {
    if (!hydrated) return;
    if (!asset) return;
    if (editorAssetId !== assetId) {
      loadAsset(assetId, asset.inputs);
    }
  }, [hydrated, asset, assetId, editorAssetId, loadAsset]);

  // Recalcul debounced
  const recomputeTimer = useRef<NodeJS.Timeout | null>(null);

  const recompute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs }),
      });
      const body: CalculateResponse = await res.json();
      if (body.ok && body.data) {
        setResults(body.data);
        // Mettre à jour le snapshot dans l'account store
        const snap: AssetSnapshot = {
          investissementTotal: body.data.synthese.investissementTotal,
          mensualiteAvecAssurance:
            body.data.synthese.mensualiteAvecAssurance,
          loyersAnnuels: body.data.synthese.loyersAnnuels,
          cashFlowMensuelIR: body.data.synthese.autofinancementIRMensuel10ans,
          cashFlowMensuelIS: body.data.synthese.autofinancementISMensuel10ans,
          regimeFavorable: body.data.recommandation.regimeFavorable,
          rendementNet: body.data.synthese.rendementNet,
        };
        updateSnapshot(assetId, snap);
      } else {
        setError(body.errors?.join(", ") ?? "Erreur inconnue");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [inputs, assetId, setResults, setLoading, setError, updateSnapshot]);

  // Propager les modifs d'inputs vers l'account store + recalculer
  useEffect(() => {
    if (!hydrated) return;
    if (editorAssetId !== assetId) return;
    updateInputs(assetId, inputs);
    if (recomputeTimer.current) clearTimeout(recomputeTimer.current);
    recomputeTimer.current = setTimeout(() => {
      void recompute();
    }, 300);
    return () => {
      if (recomputeTimer.current) clearTimeout(recomputeTimer.current);
    };
  }, [inputs, hydrated, editorAssetId, assetId, updateInputs, recompute]);

  // Asset disparu (supprimé ailleurs) → retour home
  useEffect(() => {
    if (hydrated && !asset) {
      router.replace("/");
    }
  }, [hydrated, asset, router]);

  if (!hydrated || !asset) {
    return (
      <>
        <TopNav />
        <div className="max-w-5xl mx-auto px-6 py-10 text-stone-400 text-sm">
          Chargement…
        </div>
      </>
    );
  }

  const idx = SECTIONS_ORDER.indexOf(section);
  const next = SECTIONS_ORDER[idx + 1];
  const prev = SECTIONS_ORDER[idx - 1];

  function handleValidate() {
    validate(assetId);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
    setSection("resultats");
  }

  function handleConvert() {
    if (
      window.confirm(
        `Confirmer la transformation de cette simulation en bien détenu ? Le projet "${asset!.name}" apparaîtra dans ton patrimoine.`
      )
    ) {
      convertToBien(assetId);
      router.push("/");
    }
  }

  return (
    <>
      <TopNav
        crumb={
          <span className="flex items-center gap-2">
            <Link href="/" className="hover:text-sun-700">
              Mon espace
            </Link>
            <span className="text-stone-300">›</span>
            <span className="text-stone-900 font-medium truncate max-w-sm">
              {asset.name}
            </span>
            {asset.kind === "bien" ? (
              <span className="badge-emerald ml-1">Bien détenu</span>
            ) : asset.status === "validated" ? (
              <span className="badge-sun ml-1">Validée</span>
            ) : (
              <span className="badge-stone ml-1">Brouillon</span>
            )}
          </span>
        }
        actions={
          <>
            {justSaved && (
              <span className="text-emerald-700 text-xs font-medium">
                ✓ Enregistré
              </span>
            )}
            {asset.kind === "simulation" && (
              <button
                type="button"
                onClick={handleValidate}
                className="btn-primary text-xs"
              >
                {asset.status === "validated"
                  ? "Re-valider"
                  : "Valider la simulation"}
              </button>
            )}
            {asset.kind === "simulation" && asset.status === "validated" && (
              <button
                type="button"
                onClick={handleConvert}
                className="btn-secondary text-xs"
              >
                Transformer en bien
              </button>
            )}
          </>
        }
      />
      <div className="flex">
        <Sidebar active={section} onSelect={setSection} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {section === "projet" && <ProjetForm />}
            {section === "detention" && <DetentionForm />}
            {section === "financement" && <FinancementForm />}
            {section === "biens" && <BiensForm />}
            {section === "charges" && <ChargesForm />}
            {section === "travaux" && <TravauxForm />}
            {section === "amortissement" && <AmortissementForm />}
            {section === "associes" && <AssociesForm />}
            {section === "revente" && <ReventeForm />}
            {section === "resultats" && (
              <Results
                onValidate={
                  asset.kind === "simulation" ? handleValidate : undefined
                }
                onConvert={
                  asset.kind === "simulation" && asset.status === "validated"
                    ? handleConvert
                    : undefined
                }
                status={asset.status}
                kind={asset.kind}
              />
            )}

            {/* Navigation précédent / suivant */}
            <div className="mt-10 pt-6 border-t border-stone-100 flex items-center justify-between">
              {prev ? (
                <button
                  type="button"
                  onClick={() => setSection(prev)}
                  className="btn-secondary"
                >
                  ← {sectionLabel(prev)}
                </button>
              ) : (
                <span />
              )}
              {next && (
                <button
                  type="button"
                  onClick={() => setSection(next)}
                  className="btn-primary"
                >
                  {sectionLabel(next)} →
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function sectionLabel(s: SectionId): string {
  const map: Record<SectionId, string> = {
    projet: "Projet",
    detention: "Détention",
    financement: "Financement",
    biens: "Biens à louer",
    charges: "Charges",
    travaux: "Travaux",
    amortissement: "Amortissement",
    associes: "Associés",
    revente: "Revente",
    resultats: "Résultats",
  };
  return map[s];
}
