import type { Senal } from "@/lib/data/types";
import { formatEntero, formatFecha, SIN_DATO } from "@/lib/format";

import { describeComparison } from "../comparison";
import type { ExplanationContext, SignalExplanation } from "../types";

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function inputNumber(signal: Senal, key: string): number | null {
  const value = signal.entradas[key];
  return isNumber(value) ? value : null;
}

export function inputText(signal: Senal, key: string): string | null {
  const value = signal.entradas[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function sentences(...parts: (string | null | undefined)[]): string {
  return parts.filter((part) => typeof part === "string" && part.length > 0).join(" ");
}

export function comparisonText(signal: Senal, ...details: (string | null)[]): string {
  const group = signal.comparacion;
  if (!group || (group.n != null && group.n <= 0)) {
    return sentences(...details) || "No hay datos de comparación disponibles para esta señal.";
  }
  return sentences(
    group.descripcion ? `Grupo de comparación: ${group.descripcion}.` : null,
    group.ambito === "nacional" ? "Se usa una referencia de alcance nacional." : null,
    isNumber(group.n) ? `El grupo reúne ${formatEntero(group.n)} casos.` : null,
    ...details,
    describeComparison(signal),
  ) || "No hay datos de comparación disponibles para esta señal.";
}

export function completeExplanation(
  signal: Senal,
  content: Omit<SignalExplanation, "dataUsed"> & { dataUsed: (string | null)[] },
  context: ExplanationContext = {},
): SignalExplanation {
  const dataUsed = content.dataUsed.filter((item): item is string => item !== null);
  if (signal.version_regla) dataUsed.push(`Versión de la regla: ${signal.version_regla}.`);
  if (signal.simulado || signal.codigo === "S08") {
    dataUsed.push("Dato simulado: la información de este ejemplo no acredita hechos de un expediente real.");
  }
  if (context.manifest) {
    const { fuente, fecha_corte, licencia } = context.manifest;
    if (fuente.nombre) dataUsed.push(`Fuente: ${fuente.nombre}.`);
    if (licencia) dataUsed.push(`Licencia: ${licencia}.`);
    const date = formatFecha(fecha_corte);
    if (date !== SIN_DATO) dataUsed.push(`Datos al ${date}.`);
  }
  if (context.process) {
    dataUsed.push(context.process.url_seace
      ? `Ver en el SEACE: ${context.process.url_seace}`
      : "La fuente no publica un enlace para este proceso.");
  }
  return { ...content, dataUsed };
}
