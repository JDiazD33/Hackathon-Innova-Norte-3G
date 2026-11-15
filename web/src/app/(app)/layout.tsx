import { CalendarDays } from "lucide-react";
import { Suspense } from "react";

import { BarraLateral, BotonMostrarBarraLateral, ColumnaPrincipal } from "@/components/layout/armazon";
import { BarraDePestanas } from "@/components/layout/barra-de-pestanas";
import { Buscador, BuscadorCargando } from "@/components/layout/buscador";
import { Marca } from "@/components/layout/marca";
import { MenuMovil } from "@/components/layout/menu-movil";
import { ModoDemostracion } from "@/components/layout/modo-demostracion";
import { Pie } from "@/components/layout/pie";
import { SelectorEntidad, SelectorEntidadCargando } from "@/components/layout/selector-entidad";
import { SelectorTema } from "@/components/layout/tema";
import { RoleSelector } from "@/features/revision/ui/role-selector";
import { cargarEntidades, cargarManifest } from "@/lib/data/cached";
import { formatFecha } from "@/lib/format";

/**
 * Estructura común de Prisma (Lote B · ADR 0008): dos capas.
 * - Controles y navegación en vidrio: barra lateral flotante (≥ 1024 px), barra superior fija y, en el
 *   celular, barra de pestañas inferior.
 * - Contenido en superficies sólidas, con un ancho máximo de 1 200 px.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [manifest, entidades] = await Promise.all([cargarManifest(), cargarEntidades()]);
  const fechaCorte = (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
      <CalendarDays aria-hidden="true" className="size-3.5" />
      Datos al {formatFecha(manifest.fecha_corte)}
    </span>
  );

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>

      <BarraLateral
        marca={<Marca />}
        nota="Señales para revisar, no acusaciones: la decisión siempre es de una persona."
      />

      <ColumnaPrincipal>
        <header className="sticky top-0 z-30 material-cabecera">
          <div className="mx-auto flex min-h-14 w-full max-w-contenido flex-wrap items-center gap-2 px-4 py-2 md:px-6 lg:px-8">
            <BotonMostrarBarraLateral />
            <MenuMovil marca={<Marca />} />
            <div className="min-w-0 flex-1 md:flex-none">
              <Suspense fallback={<SelectorEntidadCargando />}>
                <SelectorEntidad entidades={entidades} />
              </Suspense>
            </div>
            <Suspense fallback={<BuscadorCargando />}>
              <Buscador entidades={entidades} />
            </Suspense>
            <div className="ms-auto flex items-center gap-2">
              <span className="hidden lg:inline-flex">{fechaCorte}</span>
              {manifest.modo === "publico" && (
                <span className="hidden md:inline-flex">
                  <ModoDemostracion />
                </span>
              )}
              <RoleSelector />
              <SelectorTema />
            </div>
          </div>
          {/* En celular y tablet, la fecha de corte y el modo siguen a la vista en una segunda línea. */}
          <div className="mx-auto flex w-full max-w-contenido items-center gap-2 px-4 pb-2 md:px-6 lg:hidden">
            {fechaCorte}
            {manifest.modo === "publico" && (
              <span className="md:hidden">
                <ModoDemostracion />
              </span>
            )}
          </div>
        </header>

        <main
          id="contenido"
          tabIndex={-1}
          className="mx-auto w-full max-w-contenido flex-1 px-4 pt-6 pb-10 outline-none md:px-6 md:pt-8 lg:px-8"
        >
          {children}
        </main>

        <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <Pie atribucion={manifest.atribucion} versionReglas={manifest.version_reglas} />
        </div>
      </ColumnaPrincipal>

      <BarraDePestanas />
    </>
  );
}
