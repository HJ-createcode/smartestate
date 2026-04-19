/** @type {import('next').NextConfig} */

/**
 * Security headers appliqués à toutes les routes.
 *
 * - CSP : conservatrice. Next.js injecte du JS inline hydratation + styles
 *   inline, donc on autorise 'unsafe-inline' pour script-src et style-src.
 *   frame-ancestors 'none' bloque le clickjacking (equivalent moderne de
 *   X-Frame-Options: DENY).
 * - X-Content-Type-Options: nosniff — MIME sniffing off.
 * - Referrer-Policy: strict-origin-when-cross-origin — ne fuite pas de paths.
 * - Permissions-Policy — on coupe les APIs sensibles qu'on n'utilise pas.
 * - HSTS est déjà injecté par Vercel en prod.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
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
