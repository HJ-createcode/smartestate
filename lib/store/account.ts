"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InputsProjet } from "@/lib/calc/types";
import { INPUTS_INITIAUX } from "@/lib/calc/defaults";

/**
 * Un "asset" est l'entité centrale du tableau de bord : soit une simulation
 * (projet à l'étude), soit un bien (investissement réalisé).
 *
 * snapshot = résultats-clés du dernier calcul, stockés pour afficher le
 * tableau de bord sans recalculer à chaque visite.
 */
export type AssetKind = "simulation" | "bien";
export type AssetStatus = "draft" | "validated";

export interface AssetSnapshot {
  investissementTotal: number;
  mensualiteAvecAssurance: number;
  loyersAnnuels: number;
  cashFlowMensuelIR: number;
  cashFlowMensuelIS: number;
  regimeFavorable: "IR" | "IS" | "equivalent";
  rendementNet: number;
}

export interface Asset {
  id: string;
  kind: AssetKind;
  status: AssetStatus;
  name: string;
  createdAt: number;
  updatedAt: number;
  realizedAt?: number;
  inputs: InputsProjet;
  snapshot: AssetSnapshot | null;
}

interface AccountStore {
  assets: Record<string, Asset>;
  // Ordre d'affichage
  order: string[];

  // Sélecteurs
  list: () => Asset[];
  get: (id: string) => Asset | undefined;

  // Mutations
  createSimulation: (patch?: Partial<InputsProjet>) => Asset;
  updateInputs: (id: string, inputs: InputsProjet) => void;
  updateSnapshot: (id: string, snapshot: AssetSnapshot) => void;
  rename: (id: string, name: string) => void;
  validate: (id: string) => void;
  convertToBien: (id: string) => void;
  revertToSimulation: (id: string) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => Asset | null;
}

function newId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof (crypto as Crypto).randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const useAccount = create<AccountStore>()(
  persist(
    (set, get) => ({
      assets: {},
      order: [],

      list: () => get().order.map((id) => get().assets[id]).filter(Boolean),
      get: (id) => get().assets[id],

      createSimulation: (patch) => {
        const id = newId();
        const now = Date.now();
        const inputs: InputsProjet = { ...INPUTS_INITIAUX, ...(patch ?? {}) };
        const asset: Asset = {
          id,
          kind: "simulation",
          status: "draft",
          name: inputs.nomProjet || "Nouvelle simulation",
          createdAt: now,
          updatedAt: now,
          inputs,
          snapshot: null,
        };
        set((s) => ({
          assets: { ...s.assets, [id]: asset },
          order: [id, ...s.order],
        }));
        return asset;
      },

      updateInputs: (id, inputs) => {
        set((s) => {
          const a = s.assets[id];
          if (!a) return s;
          return {
            assets: {
              ...s.assets,
              [id]: {
                ...a,
                inputs,
                name: inputs.nomProjet || a.name,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      updateSnapshot: (id, snapshot) => {
        set((s) => {
          const a = s.assets[id];
          if (!a) return s;
          return {
            assets: { ...s.assets, [id]: { ...a, snapshot } },
          };
        });
      },

      rename: (id, name) => {
        set((s) => {
          const a = s.assets[id];
          if (!a) return s;
          return {
            assets: {
              ...s.assets,
              [id]: {
                ...a,
                name,
                inputs: { ...a.inputs, nomProjet: name },
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      validate: (id) => {
        set((s) => {
          const a = s.assets[id];
          if (!a) return s;
          return {
            assets: {
              ...s.assets,
              [id]: { ...a, status: "validated", updatedAt: Date.now() },
            },
          };
        });
      },

      convertToBien: (id) => {
        set((s) => {
          const a = s.assets[id];
          if (!a) return s;
          return {
            assets: {
              ...s.assets,
              [id]: {
                ...a,
                kind: "bien",
                status: "validated",
                realizedAt: Date.now(),
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      revertToSimulation: (id) => {
        set((s) => {
          const a = s.assets[id];
          if (!a) return s;
          return {
            assets: {
              ...s.assets,
              [id]: {
                ...a,
                kind: "simulation",
                status: "draft",
                realizedAt: undefined,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      remove: (id) => {
        set((s) => {
          const { [id]: _removed, ...rest } = s.assets;
          return {
            assets: rest,
            order: s.order.filter((x) => x !== id),
          };
        });
      },

      duplicate: (id) => {
        const src = get().assets[id];
        if (!src) return null;
        const newAsset = get().createSimulation(src.inputs);
        get().rename(newAsset.id, `${src.name} (copie)`);
        return get().assets[newAsset.id];
      },
    }),
    { name: "smartestate-account" }
  )
);
