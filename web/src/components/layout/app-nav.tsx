"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { conEntidad, PARAM_ENTIDAD } from "@/lib/entidad";
import { cn } from "@/lib/utils";

import { esRutaActiva, NAVEGACION } from "./navegacion";

/** Enlaces de la navegación principal. Conservan la entidad seleccionada si se conoce. */
export function AppNavLinks({ entidad, onNavigate }: { entidad: string | null; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {NAVEGACION.map(({ href, etiqueta, icono: Icono }) => {
        const activa = esRutaActiva(pathname, href);
        return (
          <Link
            key={href}
            href={conEntidad(href, entidad)}
            aria-current={activa ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activa
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icono aria-hidden="true" className="size-4" />
            {etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}

/** Lee la entidad de la URL; va dentro de un <Suspense> (ver docs de Next: useSearchParams). */
export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
  const entidad = useSearchParams().get(PARAM_ENTIDAD);
  return <AppNavLinks entidad={entidad} onNavigate={onNavigate} />;
}
