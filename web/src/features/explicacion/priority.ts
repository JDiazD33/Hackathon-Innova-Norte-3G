import type { Proceso } from "@/lib/data/types";
import { formatEntero } from "@/lib/format";

const LEVEL_LABELS = { alta: "Alta", media: "Media", baja: "Baja" } as const;

/** Presenta el cálculo del pipeline sin volver a calcular su nivel o puntaje. */
export function describePriority(priority: Proceso["prioridad"]): string {
  if (!priority) return "Sin señales";
  const breakdown = priority.desglose
    .map(({ codigo, peso }) => `${codigo} (${formatEntero(peso)})`)
    .join(" + ");
  return `${LEVEL_LABELS[priority.nivel]} · ${breakdown ? `${breakdown} = ` : ""}${formatEntero(priority.puntaje)}`;
}
