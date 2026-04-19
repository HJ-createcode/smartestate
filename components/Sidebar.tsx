"use client";
import React from "react";

export type SectionId =
  | "projet"
  | "detention"
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
  description: string;
  group: "inputs" | "resultats";
}

const SECTIONS: Section[] = [
  {
    id: "projet",
    label: "Projet",
    description: "Informations générales",
    group: "inputs",
  },
  {
    id: "detention",
    label: "Détention",
    description: "Structure et régime fiscal",
    group: "inputs",
  },
  {
    id: "financement",
    label: "Financement",
    description: "Emprunt bancaire",
    group: "inputs",
  },
  {
    id: "biens",
    label: "Biens à louer",
    description: "Loyers et vacance",
    group: "inputs",
  },
  {
    id: "charges",
    label: "Charges",
    description: "Récurrentes et fiscales",
    group: "inputs",
  },
  {
    id: "travaux",
    label: "Travaux",
    description: "Par année",
    group: "inputs",
  },
  {
    id: "amortissement",
    label: "Amortissement",
    description: "Pour le régime IS",
    group: "inputs",
  },
  {
    id: "associes",
    label: "Associés",
    description: "Jusqu'à 4 personnes",
    group: "inputs",
  },
  {
    id: "revente",
    label: "Revente",
    description: "Horizon et plus-value",
    group: "inputs",
  },
  {
    id: "resultats",
    label: "Résultats",
    description: "Synthèse et comparatif",
    group: "resultats",
  },
];

export function Sidebar({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <aside className="w-72 shrink-0 border-r border-sun-100 bg-cream-50">
      <nav className="p-4 space-y-6">
        <div>
          <div className="px-3 pb-2 text-[11px] uppercase tracking-wide text-stone-500 font-semibold">
            Paramètres de la simulation
          </div>
          <ul className="space-y-0.5">
            {SECTIONS.filter((s) => s.group === "inputs").map((s, i) => {
              const isActive = active === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-sun-100 text-stone-900"
                        : "text-stone-700 hover:bg-sun-50"
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold w-5 mt-0.5 ${
                        isActive ? "text-sun-700" : "text-stone-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium">{s.label}</span>
                      <span className="block text-[11px] text-stone-500 mt-0.5">
                        {s.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <div className="px-3 pb-2 text-[11px] uppercase tracking-wide text-stone-500 font-semibold">
            Synthèse
          </div>
          <ul className="space-y-0.5">
            {SECTIONS.filter((s) => s.group === "resultats").map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                    active === s.id
                      ? "bg-sun-200 text-stone-900"
                      : "text-stone-700 hover:bg-sun-50"
                  }`}
                >
                  <span className="text-sun-700 mt-0.5">★</span>
                  <span className="flex-1">
                    <span className="block font-medium">{s.label}</span>
                    <span className="block text-[11px] text-stone-500 mt-0.5">
                      {s.description}
                    </span>
                  </span>
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
