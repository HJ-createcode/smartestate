import { z } from "zod";

/**
 * Schéma Zod pour valider les assets en entrée d'API.
 *
 * Les `inputs` eux-mêmes ne sont pas strictement validés (on leur fait
 * confiance car ils proviennent de notre propre UI), mais on contrôle la
 * structure générale pour éviter du JSON arbitraire.
 */
export const assetSnapshotSchema = z.object({
  investissementTotal: z.number(),
  mensualiteAvecAssurance: z.number(),
  loyersAnnuels: z.number(),
  cashFlowMensuelIR: z.number(),
  cashFlowMensuelIS: z.number(),
  regimeFavorable: z.enum(["IR", "IS", "equivalent"]),
  rendementNet: z.number(),
});

export const assetInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: z.enum(["simulation", "bien"]).default("simulation"),
  status: z.enum(["draft", "validated"]).default("draft"),
  inputs: z.unknown(),
  snapshot: assetSnapshotSchema.nullable().optional(),
  realizedAt: z.string().datetime().nullable().optional(),
});

export const assetUpdateSchema = assetInputSchema.partial();

export type AssetInputDTO = z.infer<typeof assetInputSchema>;
export type AssetUpdateDTO = z.infer<typeof assetUpdateSchema>;
