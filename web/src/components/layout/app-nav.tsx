"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { conEntidad, PARAM_ENTIDAD } from "@/lib/entidad";
import { cn } from "@/lib/utils";

import { esRutaActiva, GRUPOS_NAVEGACION, NAVEGACION } from "./navegacion";

/**
 * Enlaces de la navegación principal, agrupados con título (HIG · Sidebars). El ítem activo se marca con un
 * gris neutro y su ícono con el acento; los demás íconos van en gris, para que el color quede para las acciones. Conservan la entidad seleccionada si se conoce.
 */
export function AppNavLinks({ entidad, onNavigate }: { entidad: string | null; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex flex-col gap-5">
      {GRUPOS_NAVEGACION.map((grupo) => (
        <div key={grupo} className="flex flex-col gap-0.5">
          <h2 className="px-3 pb-1 text-xs font-semibold text-muted-foreground">{grupo}</h2>
          <ul className="flex flex-col gap-0.5">
            {NAVEGACION.filter((item) => item.grupo === grupo).map(({ href, etiqueta, icono: Icono }) => {
              const activa = esRutaActiva(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={conEntidad(href, entidad)}
                    aria-current={activa ? "page" : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "flex h-9 items-center gap-3 rounded-item px-3 text-sm font-medium outline-none transition-colors duration-150 ease-prisma focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11",
                      activa
                        ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]",
                    )}
                  >
                    <Icono
                      aria-hidden="true"
                      strokeWidth={2}
                      className={cn("size-[1.125rem]", activa ? "text-sidebar-primary" : "text-muted-foreground")}
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
