"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { conEntidad, PARAM_ENTIDAD } from "@/lib/entidad";
import { cn } from "@/lib/utils";

import { esRutaActiva, NAVEGACION } from "./navegacion";

/**
 * Barra de pestañas del celular (< 768 px), flotante y en vidrio, en lugar del menú lateral. Respeta el
 * área segura del dispositivo y cada pestaña mide al menos 44 px de alto (HIG · Tab bars y Accessibility).
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
      className="fixed inset-x-3 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 rounded-full p-1 material-barra md:hidden"
    >
      <ul className="grid grid-cols-4 gap-1">
        {NAVEGACION.map(({ href, etiqueta, icono: Icono }) => {
          const activa = esRutaActiva(pathname, href);
          return (
            <li key={href}>
              <Link
                href={conEntidad(href, entidad)}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 rounded-full text-leyenda font-medium outline-none transition-colors duration-150 ease-prisma focus-visible:ring-2 focus-visible:ring-ring",
                  activa ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <Icono aria-hidden="true" className="size-[1.375rem]" strokeWidth={activa ? 2.25 : 1.75} />
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
