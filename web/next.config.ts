import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad para todas las rutas (prueba de seguridad, parte 9 del Lote B).
 * - La CSP solo fija lo que no rompe los scripts que Next.js inyecta: nadie puede mostrar Prisma
 *   dentro de un iframe, ni cambiar la base de los enlaces, ni enviar formularios a otro sitio.
 * - Vercel ya agrega Strict-Transport-Security en el enlace público.
 */
const CABECERAS_DE_SEGURIDAD = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // No anunciar la tecnología del servidor (X-Powered-By: Next.js).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: CABECERAS_DE_SEGURIDAD }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
