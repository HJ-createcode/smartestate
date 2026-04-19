import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth-config";

// Edge-compatible (pas d'import Prisma). Se contente de gérer la session
// JWT et d'exposer auth.user dans les Server Components.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
