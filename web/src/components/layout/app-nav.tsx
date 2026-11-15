"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { conEntidad, PARAM_ENTIDAD } from "@/lib/entidad";
import { cn } from "@/lib/utils";

import { esRutaActiva, GRUPOS_NAVEGACION, NAVEGACION } from "./navegacion";

/**
 * Enlaces de la navegación principal, agrupados con título. El ítem activo lleva el tinte de acento, más
 * peso y su ícono en el color de acento; los demás íconos van en gris, para que el color quede para lo
 * que está seleccionado. Conservan la entidad seleccionada si se conoce.
 */
export function AppNavLinks({ entidad, onNavigate }: { entidad: string | null; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex flex-col gap-5">
      {GRUPOS_NAVEGACION.map((grupo) => (
        <div key={grupo} className="flex flex-col gap-1">
          <h2 className="px-2.5 text-leyenda font-semibold text-muted-foreground">{grupo}</h2>
          <ul className="flex flex-col gap-px">
            {NAVEGACION.filter((item) => item.grupo === grupo).map(({ href, etiqueta, icono: Icono }) => {
              const activa = esRutaActiva(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={conEntidad(href, entidad)}
                    aria-current={activa ? "page" : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "flex h-8 items-center gap-2.5 rounded-item px-2.5 text-sm outline-none transition-colors duration-150 ease-prisma focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11",
                      activa
                        ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                        : "font-medium text-sidebar-foreground hover:bg-muted",
                    )}
                  >
                    <Icono
                      aria-hidden="true"
                      strokeWidth={1.75}
                      className={cn("size-4", activa ? "text-sidebar-primary" : "text-muted-foreground")}
                    />
                    {etiqueta}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Lee la entidad de la URL; va dentro de un <Suspense> (ver docs de Next: useSearchParams). */
export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
  const entidad = useSearchParams().get(PARAM_ENTIDAD);
  return <AppNavLinks entidad={entidad} onNavigate={onNavigate} />;
}
