import { CalendarDays } from "lucide-react";
import { Suspense } from "react";

import { AppNav, AppNavLinks } from "@/components/layout/app-nav";
import { Buscador, BuscadorCargando } from "@/components/layout/buscador";
import { Marca } from "@/components/layout/marca";
import { MenuMovil } from "@/components/layout/menu-movil";
import { ModoDemostracion } from "@/components/layout/modo-demostracion";
import { Pie } from "@/components/layout/pie";
import { SelectorEntidad, SelectorEntidadCargando } from "@/components/layout/selector-entidad";
import { SelectorTema } from "@/components/layout/tema";
import { cargarEntidades, cargarManifest } from "@/lib/data/cached";
import { formatFecha } from "@/lib/format";

/** Estructura común: barra lateral, cabecera, contenido y pie (Lote B). */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [manifest, entidades] = await Promise.all([cargarManifest(), cargarEntidades()]);

  return (
    <div className="flex min-h-screen">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow"
      >
        Saltar al contenido
      </a>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 border-r bg-sidebar px-4 py-6 md:flex">
        <Marca />
        <Suspense fallback={<AppNavLinks entidad={null} />}>
          <AppNav />
        </Suspense>
        <p className="mt-auto px-1 text-xs text-muted-foreground">
          Señales para revisar, no acusaciones: la decisión siempre es de una persona.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-4 py-3 md:px-8">
            <MenuMovil marca={<Marca />} />
            <div className="min-w-0 flex-1 sm:flex-none">
              <Suspense fallback={<SelectorEntidadCargando />}>
                <SelectorEntidad entidades={entidades} />
              </Suspense>
            </div>
            <div className="w-full sm:w-auto">
              <Suspense fallback={<BuscadorCargando />}>
                <Buscador entidades={entidades} />
              </Suspense>
            </div>
            <div className="ms-auto flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-3.5" />
                Datos al {formatFecha(manifest.fecha_corte)}
              </span>
              {manifest.modo === "publico" && <ModoDemostracion />}
              {/* Aquí va el selector de rol del Lote D (tarea 2.1). */}
              <SelectorTema />
            </div>
          </div>
        </header>

        <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 outline-none md:px-8">
          {children}
        </main>

        <Pie atribucion={manifest.atribucion} versionReglas={manifest.version_reglas} />
      </div>
    </div>
  );
}
