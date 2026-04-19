import { z } from "zod";

/**
 * Schéma Zod pour valider les assets en entrée d'API.
 *
 * Les `inputs` suivent la structure `InputsProjet` (lib/calc/types.ts) mais
 * on reste volontairement souple sur le détail des champs — la validation
 * stricte est faite en aval par le moteur de calcul, et verrouiller ici
 * empêcherait d'évoluer les types sans coordonner le schéma.
 *
 * Ce qu'on contrôle par contre strictement :
 *   - la forme générale (objet, pas un tableau ni un scalaire),
 *   - la taille (pour éviter la pollution de la DB par du JSON abusif),
 *   - la profondeur (pour éviter les attaques DoS par JSON imbriqué).
 */

const MAX_INPUTS_SIZE_BYTES = 50_000; // 50 KB largement suffisant
const MAX_SNAPSHOT_SIZE_BYTES = 20_000; // 20 KB
const MAX_DEPTH = 8;

function checkSize(value: unknown, limit: number): boolean {
  try {
    return JSON.stringify(value).length <= limit;
  } catch {
    return false;
  }
}

function checkDepth(value: unknown, max = MAX_DEPTH, current = 0): boolean {
  if (current > max) return false;
  if (value === null || typeof value !== "object") return true;
  if (Array.isArray(value)) {
    return value.every((v) => checkDepth(v, max, current + 1));
  }
  return Object.values(value).every((v) => checkDepth(v, max, current + 1));
}

const jsonObject = z
  .record(z.unknown())
  .refine((v) => !Array.isArray(v), "Doit être un objet, pas un tableau");

const inputsSchema = jsonObject
  .refine((v) => checkSize(v, MAX_INPUTS_SIZE_BYTES), "Inputs trop volumineux")
  .refine(checkDepth, "Structure trop imbriquée");

const snapshotSchema = jsonObject
  .refine(
    (v) => checkSize(v, MAX_SNAPSHOT_SIZE_BYTES),
    "Snapshot trop volumineux"
  )
  .refine(checkDepth, "Structure trop imbriquée");

export const assetSnapshotSchema = snapshotSchema;

export const assetInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: z.enum(["simulation", "bien"]).default("simulation"),
  status: z.enum(["draft", "validated"]).default("draft"),
  inputs: inputsSchema,
  snapshot: snapshotSchema.nullable().optional(),
  realizedAt: z.string().datetime().nullable().optional(),
});

export const assetUpdateSchema = assetInputSchema.partial();

export type AssetInputDTO = z.infer<typeof assetInputSchema>;
export type AssetUpdateDTO = z.infer<typeof assetUpdateSchema>;
