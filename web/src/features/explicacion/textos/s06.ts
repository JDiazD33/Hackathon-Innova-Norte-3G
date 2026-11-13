import type { Senal } from "@/lib/data/types";
import { formatPorcentaje, formatSoles } from "@/lib/format";

import type { ExplanationContext } from "../types";
import { completeExplanation, inputNumber, isNumber, sentences } from "./common";

export function explainS06(signal: Senal, context?: ExplanationContext) {
  const contracted = inputNumber(signal, "monto_contratado");
  const final = inputNumber(signal, "monto_final");
  const ratio = signal.valor;
  const threshold = signal.umbral.valor;
  return completeExplanation(signal, {
    finding: sentences(
      contracted !== null ? `El monto contratado fue ${formatSoles(contracted, { decimales: true })}.` : null,
      final !== null ? `El monto final fue ${formatSoles(final, { decimales: true })}.` : null,
      isNumber(ratio) ? `El monto final equivale al ${formatPorcentaje(ratio, 1)} del contratado.` : null,
    ) || "Faltan los montos para describir la diferencia al cierre del contrato.",
    comparison: isNumber(threshold)
      ? `El umbral configurado es un monto final de al menos el ${formatPorcentaje(threshold, 1)} del contratado.`
      : "No hay un umbral de comparación disponible.",
    importance: "La diferencia entre el monto contratado y el final permite priorizar la revisión de cambios y sus sustentos.",
    review: ["Adicionales aprobados y documentos que los sustentan.", "Fechas y responsables de las aprobaciones.", "Alcance del contrato y condiciones de su culminación."],
    limitation: "Un monto final mayor no demuestra un gasto indebido. Los cambios pueden estar justificados y aprobados. Esta fuente no permite reconstruir todas las modificaciones contractuales.",
    dataUsed: [
      contracted !== null ? `Monto contratado: ${formatSoles(contracted, { decimales: true })}.` : null,
      final !== null ? `Monto final: ${formatSoles(final, { decimales: true })}.` : null,
    ],
  }, context);
}
