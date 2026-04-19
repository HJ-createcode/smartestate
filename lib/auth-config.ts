import type { NextAuthConfig } from "next-auth";

/**
 * Configuration commune — édge-compatible. Pas d'import de Prisma ici,
 * car le middleware Next.js s'exécute dans un runtime Edge qui ne
 * supporte pas le client Prisma.
 *
 * Les providers (qui ont besoin de la DB) sont ajoutés dans auth.ts
 * qui est importé uniquement depuis des routes Node.js.
 */
export const authConfig = {
  // Faire confiance à l'hôte courant — requis pour les domaines custom et
  // utile sur Vercel quand l'URL publique diffère de celle auto-détectée.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 jours
    updateAge: 24 * 60 * 60, // prolonge la session tant qu'elle est active
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      // Détermine le flag admin à partir de l'env var ADMIN_EMAILS.
      // Edge-compatible : pas d'import Prisma ici.
      //
      // ⚠️ SÉCURITÉ : `session.user.isAdmin` est un flag pratique pour
      // l'affichage côté client (afficher/cacher le bouton Admin dans la
      // TopNav). Il ne DOIT JAMAIS servir seul à autoriser une action
      // côté serveur. Toutes les routes admin doivent re-vérifier via
      // `getAdminSession()` / `isAdminEmail()` qui relisent l'env var
      // au moment de la requête. Voir lib/admin.ts.
      if (session.user?.email) {
        const admins = (process.env.ADMIN_EMAILS ?? "")
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        session.user.isAdmin = admins.includes(session.user.email.toLowerCase());
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isAuthed = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname === "/login" ||
        nextUrl.pathname === "/signup" ||
        nextUrl.pathname.startsWith("/api/auth");

      if (isAuthPage) return true;

      // Pour les autres routes, ne pas forcer la connexion : on laisse
      // l'app fonctionner en mode localStorage pour les non-connectés.
      // Le middleware ne bloque rien, la séparation se fait côté UI/API.
      return true;
    },
  },
  providers: [], // les providers réels sont dans auth.ts
} satisfies NextAuthConfig;
