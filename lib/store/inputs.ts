"use client";
import { create } from "zustand";
import type { InputsProjet, ResultatsComplets } from "@/lib/calc/types";
import { INPUTS_INITIAUX } from "@/lib/calc/defaults";

/**
 * Store "éditeur" : tient l'état de la simulation en cours d'édition.
 * Rattaché à un asset par `assetId`. Les modifications sont propagées
 * au store `account` qui persiste localement.
 */
interface InputsStore {
  assetId: string | null;
  inputs: InputsProjet;
  results: ResultatsComplets | null;
  loading: boolean;
  error: string | null;
  loadAsset: (id: string, inputs: InputsProjet) => void;
  clear: () => void;
  setInputs: (patch: Partial<InputsProjet>) => void;
  setNested: <K extends keyof InputsProjet>(
    key: K,
    patch: Partial<InputsProjet[K]>
  ) => void;
  replaceInputs: (inputs: InputsProjet) => void;
  setResults: (r: ResultatsComplets | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useInputs = create<InputsStore>((set) => ({
  assetId: null,
  inputs: INPUTS_INITIAUX,
  results: null,
  loading: false,
  error: null,
  loadAsset: (id, inputs) =>
    set({ assetId: id, inputs, results: null, error: null }),
  clear: () =>
    set({ assetId: null, inputs: INPUTS_INITIAUX, results: null, error: null }),
  setInputs: (patch) => set((s) => ({ inputs: { ...s.inputs, ...patch } })),
  setNested: (key, patch) =>
    set((s) => ({
      inputs: {
        ...s.inputs,
        [key]: { ...(s.inputs[key] as object), ...patch },
      },
    })),
  replaceInputs: (inputs) => set({ inputs }),
  setResults: (r) => set({ results: r }),
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e }),
}));
