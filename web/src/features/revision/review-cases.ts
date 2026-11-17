import type { Proceso } from "@/lib/data/types";
import { formatFecha, SIN_DATO } from "@/lib/format";

/** Parámetro de `/revision` que elige el proceso inicial (`?proceso=<ocid>`). */
export const PARAM_PROCESO = "proceso";

export interface ReviewCase {
  ocid: string;
  description: string;
  /** Nomenclatura del SEACE; distingue versiones de un mismo procedimiento junto con el estado. */
  nomenclatura: string | null;
  estado: string | null;
  date: string | null;
  signals: number;
  priority: number | null;
  simulated: boolean;
}

/**
 * Casos del selector de Revisión: primero los que tienen señales, por prioridad
 * y número de señales; los empates conservan el orden del paquete.
 */
export function toReviewCases(processes: readonly Proceso[]): ReviewCase[] {
  return processes
    .map((process) => ({
      ocid: process.ocid,
      description: process.descripcion,
      nomenclatura: process.nomenclatura?.trim() || null,
      estado: process.estado?.trim() || null,
      date: process.fechas.convocatoria,
      signals: process.senales.length,
      priority: process.prioridad?.puntaje ?? null,
      simulated: process.simulado,
    }))
    .sort(
      (a, b) =>
        (b.priority ?? -1) - (a.priority ?? -1) || b.signals - a.signals,
    );
}

/** Texto de cada opción: nomenclatura (o descripción), estado y fecha de convocatoria. */
export function reviewCaseLabel(process: ReviewCase): string {
  return [
    process.nomenclatura ?? process.description,
    process.estado ?? SIN_DATO,
    formatFecha(process.date),
  ].join(" · ");
}

/**
 * Textos de todas las opciones. Si dos procesos quedan con el mismo texto (copias
 * de un procedimiento que la fuente no actualizó), se agrega su `ocid` sin el prefijo OCDS.
 */
export function reviewCaseLabels(
  cases: readonly ReviewCase[],
): Map<string, string> {
  const base = cases.map((process) => reviewCaseLabel(process));
  const repeated = new Set(base.filter((label, i) => base.indexOf(label) !== i));
  return new Map(
    cases.map((process, i) => [
      process.ocid,
      repeated.has(base[i])
        ? `${base[i]} · ${process.ocid.replace(/^ocds-[^-]+-/, "")}`
        : base[i],
    ]),
  );
}

/** Proceso inicial: el pedido en la URL si está en la entidad; si no, el primero. */
export function initialReviewCase(
  cases: readonly ReviewCase[],
  requested?: string | string[] | null,
): string {
  const ocid = Array.isArray(requested) ? requested[0] : requested;
  return (
    (ocid && cases.find((process) => process.ocid === ocid)?.ocid) ||
    cases[0]?.ocid ||
    ""
  );
}
