/** Datos mínimos de una entidad para la cabecera y la navegación (se envían al navegador). */
export interface EntidadResumen {
  id: string;
  nombre: string;
  tipo: string;
  procesos: number;
  procesosConSenales: number;
}

/** La entidad seleccionada viaja en la URL: `?entidad=entidad-0001`. */
export const PARAM_ENTIDAD = "entidad";

/** Si no se elige una entidad, se muestra la que tiene más procesos con señales. */
export function entidadPorDefecto<T extends EntidadResumen>(entidades: readonly T[]): T | null {
  return (
    [...entidades].sort(
      (a, b) => b.procesosConSenales - a.procesosConSenales || a.nombre.localeCompare(b.nombre, "es"),
    )[0] ?? null
  );
}

/** Entidad pedida en la URL o, si no existe, la entidad por defecto. */
export function elegirEntidad<T extends EntidadResumen>(
  entidades: readonly T[],
  solicitada?: string | string[] | null,
): T | null {
  const id = Array.isArray(solicitada) ? solicitada[0] : solicitada;
  return (id ? entidades.find((entidad) => entidad.id === id) : undefined) ?? entidadPorDefecto(entidades);
}

/** Ruta interna que conserva la entidad seleccionada. */
export function conEntidad(ruta: string, entidadId: string | null | undefined): string {
  return entidadId ? `${ruta}?${PARAM_ENTIDAD}=${encodeURIComponent(entidadId)}` : ruta;
}
