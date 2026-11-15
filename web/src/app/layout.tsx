import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { producto } from "@/config/producto";

import "./globals.css";

/**
 * IBM Plex Sans y Mono (SIL OFL). next/font las incluye en el build, así que el navegador no pide nada a
 * servidores externos y la demo funciona sin internet. Se usan en todos los equipos, para que Prisma se
 * vea igual en Windows, Mac y Android. La pila completa está en globals.css.
 */
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  display: "swap",
});

/** Monoespaciada para códigos (S01, ocid, nomenclatura). No es variable: se piden los pesos que se usan. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: producto.nombre, template: `%s · ${producto.nombre}` },
  description: producto.descripcion,
  applicationName: producto.nombre,
};

export const viewport: Viewport = {
  // "cover" deja usar env(safe-area-inset-*) en la barra de pestañas del celular.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
