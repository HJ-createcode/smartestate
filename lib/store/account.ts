"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InputsProjet } from "@/lib/calc/types";
import { INPUTS_INITIAUX } from "@/lib/calc/defaults";

/**
 * Store d'assets — dual backend (local et remote).
 *
 * - `mode === "local"` : tout est dans le localStorage (persist middleware).
 *   Utilisé tant que l'utilisateur n'est pas connecté. Les données seront
 *   migrées vers la DB à la création de compte / connexion.
 *
 * - `mode === "remote"` : source de vérité = serveur. Les mutations
 *   appellent l'API et n'écrivent en local qu'après succès pour
 *   refléter l'état distant.
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

type Mode = "local" | "remote";

interface AccountStore {
  mode: Mode;
  hydrated: boolean; // true après le fetch initial côté remote
  assets: Record<string, Asset>;
  order: string[]; // ordre d'affichage

  list: () => Asset[];
  get: (id: string) => Asset | undefined;

  setMode: (mode: Mode) => void;
  loadFromRemote: () => Promise<void>;
  clearLocal: () => void;

  createSimulation: (patch?: Partial<InputsProjet>) => Promise<Asset>;
  updateInputs: (id: string, inputs: InputsProjet) => void;
  updateSnapshot: (id: string, snapshot: AssetSnapshot) => void;
  rename: (id: string, name: string) => void;
  validate: (id: string) => void;
  convertToBien: (id: string) => void;
  revertToSimulation: (id: string) => void;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<Asset | null>;
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

function fromRemoteAsset(a: {
  id: string;
  kind: AssetKind;
  status: AssetStatus;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  realizedAt?: string | Date | null;
  inputs: unknown;
  snapshot: unknown;
}): Asset {
  return {
    id: a.id,
    kind: a.kind,
    status: a.status,
    name: a.name,
    inputs: a.inputs as InputsProjet,
    snapshot: (a.snapshot as AssetSnapshot | null) ?? null,
    createdAt: new Date(a.createdAt).getTime(),
    updatedAt: new Date(a.updatedAt).getTime(),
    realizedAt: a.realizedAt ? new Date(a.realizedAt).getTime() : undefined,
  };
}

function toPayload(a: Asset) {
  return {
    name: a.name,
    kind: a.kind,
    status: a.status,
    inputs: a.inputs,
    snapshot: a.snapshot,
    realizedAt: a.realizedAt ? new Date(a.realizedAt).toISOString() : null,
  };
}

// Debounce utility par asset id : évite de bombarder l'API sur chaque keystroke
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
function debouncePush(id: string, fn: () => void, ms = 600) {
  const prev = debounceTimers.get(id);
  if (prev) clearTimeout(prev);
  const t = setTimeout(() => {
    debounceTimers.delete(id);
    fn();
  }, ms);
  debounceTimers.set(id, t);
}

async function pushToRemote(asset: Asset): Promise<Asset | null> {
  try {
    const res = await fetch(`/api/assets/${asset.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(asset)),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.ok && body.asset ? fromRemoteAsset(body.asset) : null;
  } catch {
    return null;
  }
}

export const useAccount = create<AccountStore>()(
  persist(
    (set, get) => ({
      mode: "local",
      hydrated: false,
      assets: {},
      order: [],

      list: () =>
        get()
          .order.map((id) => get().assets[id])
          .filter((a): a is Asset => !!a),
      get: (id) => get().assets[id],

      setMode: (mode) => set({ mode }),

      clearLocal: () => set({ assets: {}, order: [] }),

      loadFromRemote: async () => {
        try {
          const res = await fetch("/api/assets", { cache: "no-store" });
          if (!res.ok) {
            set({ hydrated: true });
            return;
          }
          const body = await res.json();
          if (!body.ok) {
            set({ hydrated: true });
            return;
          }
          const assets: Record<string, Asset> = {};
          const order: string[] = [];
          for (const raw of body.assets) {
            const a = fromRemoteAsset(raw);
            assets[a.id] = a;
            order.push(a.id);
          }
          set({ assets, order, hydrated: true });
        } catch (e) {
          console.warn("loadFromRemote error", e);
          set({ hydrated: true });
        }
      },

      createSimulation: async (patch) => {
        const mode = get().mode;
        const now = Date.now();
        const inputs: InputsProjet = { ...INPUTS_INITIAUX, ...(patch ?? {}) };
        const name = inputs.nomProjet || "Nouvelle simulation";

        if (mode === "remote") {
          const res = await fetch("/api/assets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              kind: "simulation",
              status: "draft",
              inputs,
              snapshot: null,
            }),
          });
          if (res.ok) {
            const body = await res.json();
            if (body.ok && body.asset) {
              const a = fromRemoteAsset(body.asset);
              set((s) => ({
                assets: { ...s.assets, [a.id]: a },
                order: [a.id, ...s.order],
              }));
              return a;
            }
          }
          // Fallback : on retombe sur un asset local si l'API échoue.
        }

        const id = newId();
        const asset: Asset = {
          id,
          kind: "simulation",
          status: "draft",
          name,
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
          const updated: Asset = {
            ...a,
            inputs,
            name: inputs.nomProjet || a.name,
            updatedAt: Date.now(),
          };
          return { assets: { ...s.assets, [id]: updated } };
        });
        if (get().mode === "remote") {
          debouncePush(id, () => {
            const a = get().assets[id];
            if (a) void pushToRemote(a);
          });
        }
      },

      updateSnapshot: (id, snapshot) => {
        set((s) => {
          const a = s.assets[id];
          if (!a) return s;
          return {
            assets: { ...s.assets, [id]: { ...a, snapshot } },
          };
        });
        if (get().mode === "remote") {
          debouncePush(
            `${id}:snap`,
            () => {
              const a = get().assets[id];
              if (a) void pushToRemote(a);
            },
            800
          );
        }
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
        if (get().mode === "remote") {
          debouncePush(id, () => {
            const a = get().assets[id];
            if (a) void pushToRemote(a);
          });
        }
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
        if (get().mode === "remote") {
          const a = get().assets[id];
          if (a) void pushToRemote(a);
        }
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
        if (get().mode === "remote") {
          const a = get().assets[id];
          if (a) void pushToRemote(a);
        }
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
        if (get().mode === "remote") {
          const a = get().assets[id];
          if (a) void pushToRemote(a);
        }
      },

      remove: async (id) => {
        if (get().mode === "remote") {
          try {
            await fetch(`/api/assets/${id}`, { method: "DELETE" });
          } catch {}
        }
        set((s) => {
          const { [id]: _removed, ...rest } = s.assets;
          return {
            assets: rest,
            order: s.order.filter((x) => x !== id),
          };
        });
      },

      duplicate: async (id) => {
        const src = get().assets[id];
        if (!src) return null;
        const copy = await get().createSimulation(src.inputs);
        get().rename(copy.id, `${src.name} (copie)`);
        return get().assets[copy.id] ?? null;
      },
    }),
    {
      name: "smartestate-account",
      partialize: (s) =>
        // En mode local on persiste tout ; en mode remote on ne persiste rien
        // (les données sont sur le serveur, pas de cache local pour éviter
        // les confusions entre comptes).
        s.mode === "local"
          ? { assets: s.assets, order: s.order, mode: s.mode }
          : { mode: s.mode },
    }
  )
);
