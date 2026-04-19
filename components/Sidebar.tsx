"use client";
import React from "react";

export type SectionId =
  | "projet"
  | "financement"
  | "biens"
  | "charges"
  | "travaux"
  | "amortissement"
  | "associes"
  | "revente"
  | "resultats";

interface Section {
  id: SectionId;
  label: string;
  group: "inputs" | "resultats";
}

const SECTIONS: Section[] = [
  { id: "projet", label: "Projet", group: "inputs" },
  { id: "financement", label: "Financement", group: "inputs" },
  { id: "biens", label: "Biens à louer", group: "inputs" },
  { id: "charges", label: "Charges", group: "inputs" },
  { id: "travaux", label: "Travaux", group: "inputs" },
  { id: "amortissement", label: "Amortissement (IS)", group: "inputs" },
  { id: "associes", label: "Associés", group: "inputs" },
  { id: "revente", label: "Revente", group: "inputs" },
  { id: "resultats", label: "Résultats", group: "resultats" },
];

export function Sidebar({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white">
      <div className="p-5 border-b border-slate-200">
        <div className="text-base font-bold tracking-tight text-slate-900">
          SmartEstate
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Analyse SCI IR / IS
        </div>
      </div>
      <nav className="p-3 space-y-6">
        <div>
          <div className="px-3 pb-2 text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
            Paramètres
          </div>
          <ul className="space-y-0.5">
            {SECTIONS.filter((s) => s.group === "inputs").map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    active === s.id
                      ? "bg-brand-50 text-brand-700 font-medium"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-xs text-slate-400 w-5">{i + 1}.</span>
                  <span>{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="px-3 pb-2 text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
            Synthèse
          </div>
          <ul className="space-y-0.5">
            {SECTIONS.filter((s) => s.group === "resultats").map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    active === s.id
                      ? "bg-brand-50 text-brand-700 font-medium"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-brand-500">★</span>
                  <span>{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}

export const SECTIONS_LIST = SECTIONS;
