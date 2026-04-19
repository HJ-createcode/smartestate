import { auth } from "@/auth";

/**
 * Liste des emails admin, lue depuis l'env var ADMIN_EMAILS (séparée par
 * virgules). Exemple : ADMIN_EMAILS="hugo.jentile@gmail.com,autre@dom.com"
 *
 * Pas de stockage en base : ça évite une migration et permet d'ajouter/retirer
 * un admin sans toucher aux données.
 */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/**
 * À utiliser dans les routes API admin et les pages server.
 * Renvoie la session si admin, null sinon.
 */
export async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.email) return null;
  if (!isAdminEmail(session.user.email)) return null;
  return session;
}
