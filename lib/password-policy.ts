/**
 * Politique de mot de passe unique, partagée entre serveur (validation
 * autoritaire dans /api/auth/signup + scripts/create-admin) et client
 * (checklist live dans /signup).
 *
 * Règles :
 *   - 10 à 30 caractères
 *   - au moins une lettre (a-z / A-Z, accents inclus)
 *   - au moins un chiffre (0-9)
 *   - au moins un symbole (tout ce qui n'est ni lettre ni chiffre)
 */

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 30;

export type PasswordRule = {
  id: "length" | "letter" | "digit" | "symbol";
  label: string;
  ok: boolean;
};

export function evaluatePassword(pwd: string): PasswordRule[] {
  const hasLetter = /\p{L}/u.test(pwd);
  const hasDigit = /\p{N}/u.test(pwd);
  const hasSymbol = /[^\p{L}\p{N}]/u.test(pwd);
  const lenOk = pwd.length >= PASSWORD_MIN && pwd.length <= PASSWORD_MAX;
  return [
    {
      id: "length",
      label: `Entre ${PASSWORD_MIN} et ${PASSWORD_MAX} caractères`,
      ok: lenOk,
    },
    { id: "letter", label: "Au moins une lettre", ok: hasLetter },
    { id: "digit", label: "Au moins un chiffre", ok: hasDigit },
    { id: "symbol", label: "Au moins un symbole (!, @, #, …)", ok: hasSymbol },
  ];
}

export function isValidPassword(pwd: string): boolean {
  return evaluatePassword(pwd).every((r) => r.ok);
}

/**
 * Renvoie un message d'erreur en français si invalide, null si OK.
 * Utilisé côté serveur pour renvoyer une seule erreur ciblée au client.
 */
export function firstPasswordError(pwd: string): string | null {
  const rules = evaluatePassword(pwd);
  const failed = rules.find((r) => !r.ok);
  if (!failed) return null;
  switch (failed.id) {
    case "length":
      return `Mot de passe : entre ${PASSWORD_MIN} et ${PASSWORD_MAX} caractères.`;
    case "letter":
      return "Mot de passe : au moins une lettre.";
    case "digit":
      return "Mot de passe : au moins un chiffre.";
    case "symbol":
      return "Mot de passe : au moins un symbole (!, @, #, …).";
  }
}
