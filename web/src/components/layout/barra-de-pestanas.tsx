"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { conEntidad, PARAM_ENTIDAD } from "@/lib/entidad";
import { cn } from "@/lib/utils";

import { esRutaActiva, NAVEGACION } from "./navegacion";

/**
 * Barra de pestañas del celular (< 768 px), pegada al borde inferior, en lugar del menú lateral. Respeta
 * el área segura del dispositivo y cada pestaña mide al menos 44 px de alto. La pestaña activa se marca
 * con el color de acento y una línea arriba, no solo con el color.
 */
export function BarraDePestanas() {
  return (
    <Suspense fallback={<Pestanas entidad={null} />}>
      <PestanasConEntidad />
    </Suspense>
  );
}

function PestanasConEntidad() {
  const entidad = useSearchParams().get(PARAM_ENTIDAD);
  return <Pestanas entidad={entidad} />;
}

function Pestanas({ entidad }: { entidad: string | null }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden contrast-more:border-borde-contraste"
    >
      <ul className="grid grid-cols-4">
        {NAVEGACION.map(({ href, etiqueta, icono: Icono }) => {
          const activa = esRutaActiva(pathname, href);
          return (
            <li key={href}>
              <Link
                href={conEntidad(href, entidad)}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-0.5 text-leyenda font-medium outline-none transition-colors duration-150 ease-prisma focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  activa
                    ? "font-semibold text-primary before:absolute before:inset-x-5 before:top-0 before:h-0.5 before:bg-primary"
                    : "text-muted-foreground",
                )}
              >
                <Icono aria-hidden="true" className="size-5" strokeWidth={activa ? 2 : 1.75} />
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
