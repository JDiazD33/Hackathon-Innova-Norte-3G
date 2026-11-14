import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { producto } from "@/config/producto";

import "./globals.css";

/**
 * Inter (SIL OFL) es la alternativa a la fuente del sistema. next/font la incluye en el build, así que el
 * navegador no pide nada a servidores externos y la demo funciona sin internet. La pila completa está en
 * globals.css: en los dispositivos Apple se ve la fuente del sistema, sin descargarla (ADR 0008).
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
