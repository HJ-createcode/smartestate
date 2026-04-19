"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Sidebar, type SectionId } from "@/components/Sidebar";
import { useInputs } from "@/lib/store/inputs";
import { ProjetForm } from "@/components/forms/ProjetForm";
import { FinancementForm } from "@/components/forms/FinancementForm";
import { BiensForm } from "@/components/forms/BiensForm";
import { ChargesForm } from "@/components/forms/ChargesForm";
import { TravauxForm } from "@/components/forms/TravauxForm";
import { AmortissementForm } from "@/components/forms/AmortissementForm";
import { AssociesForm } from "@/components/forms/AssociesForm";
import { ReventeForm } from "@/components/forms/ReventeForm";
import { Results } from "@/components/Results";
import type { CalculateResponse } from "@/lib/calc/types";

export default function Home() {
  const [section, setSection] = useState<SectionId>("projet");
  const inputs = useInputs((s) => s.inputs);
  const setResults = useInputs((s) => s.setResults);
  const setLoading = useInputs((s) => s.setLoading);
  const setError = useInputs((s) => s.setError);

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
      } else {
        setError(body.errors?.join(", ") ?? "Erreur inconnue");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [inputs, setResults, setLoading, setError]);

  // Recalcul debounced à chaque changement d'inputs
  useEffect(() => {
    if (recomputeTimer.current) clearTimeout(recomputeTimer.current);
    recomputeTimer.current = setTimeout(() => {
      void recompute();
    }, 300);
    return () => {
      if (recomputeTimer.current) clearTimeout(recomputeTimer.current);
    };
  }, [inputs, recompute]);

  return (
    <div className="flex min-h-screen">
      <Sidebar active={section} onSelect={setSection} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {section === "projet" && <ProjetForm />}
          {section === "financement" && <FinancementForm />}
          {section === "biens" && <BiensForm />}
          {section === "charges" && <ChargesForm />}
          {section === "travaux" && <TravauxForm />}
          {section === "amortissement" && <AmortissementForm />}
          {section === "associes" && <AssociesForm />}
          {section === "revente" && <ReventeForm />}
          {section === "resultats" && <Results />}
        </div>
      </main>
    </div>
  );
}
