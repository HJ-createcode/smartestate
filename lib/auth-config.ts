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
    maxAge: 30 * 24 * 60 * 60, // 30 jours
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
