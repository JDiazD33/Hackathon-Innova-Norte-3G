import type { CategoriaSenal, NivelPrioridad } from "@/lib/data/types";

/** Etiquetas de interfaz compartidas por todos los lotes. Dueño: Lote B. */
export const CATEGORIA_LABELS: Record<CategoriaSenal, string> = {
  competencia: "Competencia",
  tiempos: "Tiempos",
  concentracion: "Concentración",
  fraccionamiento: "Fraccionamiento",
  ejecucion: "Ejecución",
  reputacional: "Reputacional",
  trazabilidad: "Trazabilidad",
};

export const NIVEL_PRIORIDAD_LABELS: Record<NivelPrioridad, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

/** De mayor a menor prioridad. */
export const ORDEN_NIVELES: readonly NivelPrioridad[] = ["alta", "media", "baja"];
