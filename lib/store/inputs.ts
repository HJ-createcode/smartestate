"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InputsProjet, ResultatsComplets } from "@/lib/calc/types";
import { INPUTS_INITIAUX } from "@/lib/calc/defaults";

interface InputsStore {
  inputs: InputsProjet;
  results: ResultatsComplets | null;
  loading: boolean;
  error: string | null;
  setInputs: (patch: Partial<InputsProjet>) => void;
  setNested: <K extends keyof InputsProjet>(
    key: K,
    patch: Partial<InputsProjet[K]>
  ) => void;
  replaceInputs: (inputs: InputsProjet) => void;
  reset: () => void;
  setResults: (r: ResultatsComplets | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useInputs = create<InputsStore>()(
  persist(
    (set) => ({
      inputs: INPUTS_INITIAUX,
      results: null,
      loading: false,
      error: null,
      setInputs: (patch) =>
        set((s) => ({ inputs: { ...s.inputs, ...patch } })),
      setNested: (key, patch) =>
        set((s) => ({
          inputs: {
            ...s.inputs,
            [key]: { ...(s.inputs[key] as object), ...patch },
          },
        })),
      replaceInputs: (inputs) => set({ inputs }),
      reset: () => set({ inputs: INPUTS_INITIAUX, results: null }),
      setResults: (r) => set({ results: r }),
      setLoading: (v) => set({ loading: v }),
      setError: (e) => set({ error: e }),
    }),
    {
      name: "sim-sci-inputs",
      partialize: (s) => ({ inputs: s.inputs }),
    }
  )
);
