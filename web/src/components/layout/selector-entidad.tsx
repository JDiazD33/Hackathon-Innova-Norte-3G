"use client";

import { Building2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { conEntidad, elegirEntidad, PARAM_ENTIDAD, type EntidadResumen } from "@/lib/entidad";

/** Rutas que muestran datos de una entidad; desde otras (una ficha, por ejemplo) se vuelve al panel. */
const RUTAS_POR_ENTIDAD = new Set(["/", "/senales", "/revision"]);

const CLASE_SELECTOR = "h-9 w-full min-w-0 sm:w-80";

export function SelectorEntidad({ entidades }: { entidades: EntidadResumen[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const actual = elegirEntidad(entidades, useSearchParams().get(PARAM_ENTIDAD));
  if (!actual) return null;

  return (
    <Select
      value={actual.id}
      onValueChange={(id) => router.push(conEntidad(RUTAS_POR_ENTIDAD.has(pathname) ? pathname : "/", id))}
    >
      <SelectTrigger aria-label="Entidad" className={CLASE_SELECTOR}>
        <Building2 aria-hidden="true" className="size-4 text-muted-foreground" />
        {/* El nombre va explícito para que se vea desde el primer render, antes de hidratar. */}
        <SelectValue>{actual.nombre}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {entidades.map((entidad) => (
          <SelectItem key={entidad.id} value={entidad.id}>
            {entidad.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Mientras se lee la URL. */
export function SelectorEntidadCargando() {
  return (
    <div aria-hidden="true" className={`${CLASE_SELECTOR} animate-pulse rounded-md border bg-muted`} />
  );
}
