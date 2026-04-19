import { NextResponse } from "next/server";

/**
 * Vérifie que la taille déclarée par Content-Length ne dépasse pas `limit`.
 * Renvoie une réponse 413 si trop grand, null sinon.
 *
 * Next.js accepte par défaut 1 MB de body avant validation Zod ; sur une
 * route qui attend au maximum 50 KB, autant couper au plus tôt pour éviter
 * l'amplification CPU (JSON.parse d'un MB qui sera rejeté ensuite).
 *
 * Un client qui ne déclare pas Content-Length passe inaperçu — c'est
 * acceptable car Zod/Next tronqueront dans tous les cas.
 */
export function guardBodySize(
  req: Request,
  limitBytes: number
): NextResponse | null {
  const raw = req.headers.get("content-length");
  if (!raw) return null;
  const size = Number(raw);
  if (!Number.isFinite(size) || size < 0) return null;
  if (size > limitBytes) {
    return NextResponse.json(
      { ok: false, error: "Requête trop volumineuse." },
      { status: 413 }
    );
  }
  return null;
}
