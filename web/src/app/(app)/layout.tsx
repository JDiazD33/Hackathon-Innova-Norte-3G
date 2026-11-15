import { CalendarDays } from "lucide-react";
import { Suspense } from "react";

import { BarraLateral, BotonMostrarBarraLateral, ColumnaPrincipal } from "@/components/layout/armazon";
import { BarraDePestanas } from "@/components/layout/barra-de-pestanas";
import { Buscador, BuscadorCargando } from "@/components/layout/buscador";
import { CabeceraFija } from "@/components/layout/cabecera-fija";
import { IconoPrisma, Marca } from "@/components/layout/marca";
import { MenuMovil } from "@/components/layout/menu-movil";
import { ModoDemostracion } from "@/components/layout/modo-demostracion";
import { Pie } from "@/components/layout/pie";
import { SelectorEntidad, SelectorEntidadCargando } from "@/components/layout/selector-entidad";
import { SelectorTema } from "@/components/layout/tema";
import { RoleSelector } from "@/features/revision/ui/role-selector";
import { cargarEntidades, cargarManifest } from "@/lib/data/cached";
import { formatFecha } from "@/lib/format";

/**
 * Estructura común de Prisma (Lote B): un marco fijo y, dentro, el contenido.
 * - Marco: barra lateral pegada al borde (≥ 1024 px), barra superior fija y, en el celular, barra de
 *   pestañas inferior. Todo sólido y separado por bordes finos.
 * - Contenido: paneles con borde sobre un fondo gris claro, con un ancho máximo de 1 440 px.
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
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>

      <BarraLateral
        marca={<Marca />}
        nota="Señales para revisar, no acusaciones: la decisión siempre es de una persona."
      />

      <ColumnaPrincipal>
        <CabeceraFija>
          {/*
           * Primera línea: entidad, buscador, rol y tema. La fecha de corte y el modo entran aquí solo si la
           * cabecera mide al menos 64rem (@5xl); si no, pasan a la segunda línea. El ancho es el de la propia
           * cabecera, que ya descuenta la barra lateral.
           */}
          <div className="mx-auto flex h-14 w-full max-w-contenido items-center gap-2 px-4 md:px-6 lg:px-8">
            <BotonMostrarBarraLateral />
            <MenuMovil marca={<Marca />} />
            {/* En el celular no hay barra lateral: el triángulo identifica a Prisma en la barra superior. */}
            <IconoPrisma className="h-5 w-6 md:hidden" />
            <div className="min-w-0 flex-1 md:flex-none">
              <Suspense fallback={<SelectorEntidadCargando />}>
                <SelectorEntidad entidades={entidades} />
              </Suspense>
            </div>
            <Suspense fallback={<BuscadorCargando />}>
              <Buscador entidades={entidades} />
            </Suspense>
            <div className="ms-auto flex shrink-0 items-center gap-2">
              <span className="hidden @5xl/cabecera:inline-flex">{fechaCorte}</span>
              {manifest.modo === "publico" && (
                <span className="hidden @5xl/cabecera:inline-flex">
                  <ModoDemostracion />
                </span>
              )}
              {/*
               * Selector de rol del Lote D (tarea 2.1), desde tablet y en una sola línea. En el celular no cabe
               * sin una tercera línea; como la decisión se recomienda en escritorio (ADR 0001), ahí el rol se
               * muestra dentro de Revisión y del diálogo de decisión.
               */}
              <span className="hidden md:inline-flex">
                <RoleSelector />
              </span>
              <SelectorTema />
            </div>
          </div>
          {/* Segunda línea: fecha de corte y modo cuando no caben arriba. */}
          <div className="mx-auto flex min-h-7 w-full max-w-contenido flex-wrap items-center gap-2 px-4 pb-2 md:px-6 lg:px-8 @5xl/cabecera:hidden">
            {fechaCorte}
            {manifest.modo === "publico" && <ModoDemostracion />}
          </div>
        </CabeceraFija>

        <main
          id="contenido"
          tabIndex={-1}
          className="mx-auto w-full max-w-contenido flex-1 px-4 pt-6 pb-10 outline-none md:px-6 md:pt-8 lg:px-8"
        >
          {children}
        </main>

        <div className="pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <Pie atribucion={manifest.atribucion} versionReglas={manifest.version_reglas} />
        </div>
      </ColumnaPrincipal>

      <BarraDePestanas />
    </>
  );
}
