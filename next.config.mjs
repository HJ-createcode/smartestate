/** @type {import('next').NextConfig} */

/**
 * Security headers appliqués à toutes les routes.
 *
 * - CSP : conservatrice. Next.js injecte du JS inline d'hydratation + styles
 *   inline, donc on autorise 'unsafe-inline' pour script-src et style-src.
 *   En prod on retire 'unsafe-eval' (nécessaire uniquement au HMR de dev).
 *   frame-ancestors 'none' bloque le clickjacking.
 * - X-Content-Type-Options: nosniff — MIME sniffing off.
 * - Referrer-Policy: strict-origin-when-cross-origin — ne fuite pas de paths.
 * - Permissions-Policy — coupe les APIs sensibles qu'on n'utilise pas.
 * - HSTS est déjà injecté par Vercel en prod.
 * - Access-Control-Allow-Origin: on le force à vide ici pour neutraliser
 *   le "ACAO: *" que l'edge Vercel met par défaut sur les pages HTML
 *   statiques (faible risque car cookies SameSite mais autant l'éviter).
 */
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", "),
  },
  // Neutralise l'ACAO:* de l'edge Vercel. Une origin vide = pas de cross-origin.
  { key: "Access-Control-Allow-Origin", value: "" },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};
export default nextConfig;
