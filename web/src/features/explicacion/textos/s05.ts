import type { Senal } from "@/lib/data/types";
import { formatEntero, formatPorcentaje } from "@/lib/format";

import type { ExplanationContext } from "../types";
import { comparisonText, completeExplanation, inputNumber, isNumber, sentences } from "./common";

export function explainS05(signal: Senal, context?: ExplanationContext) {
  const share = signal.valor;
  const direct = inputNumber(signal, "procesos_directos");
  const total = inputNumber(signal, "procesos_totales");
  const fence = signal.comparacion?.valla_superior;
  return completeExplanation(signal, {
    finding: sentences(
      isNumber(share) ? `La proporción de contratación directa de la entidad es ${formatPorcentaje(share, 1)} (${signal.unidad}).` : null,
      direct !== null && total !== null ? `Se registraron ${formatEntero(direct)} procesos por contratación directa de un total de ${formatEntero(total)}.` : null,
    ) || "Falta la proporción de contratación directa de la entidad.",
    comparison: comparisonText(signal,
      isNumber(fence) ? `El límite superior de comparación es ${formatPorcentaje(fence, 1)}.` : null),
    importance: "Una proporción alta de contratación directa amerita revisar el sustento de los métodos elegidos. Esta señal corresponde a la entidad y no suma a la prioridad de un proceso.",
    review: ["Motivo y sustento de cada contratación directa.", "Disponibilidad de proveedores alternativos.", "Tipo de entidad y periodo del grupo de comparación."],
    limitation: "La contratación directa puede estar justificada por emergencias o por la existencia de un único proveedor. La proporción por sí sola no demuestra un uso indebido.",
    dataUsed: [
      isNumber(share) ? `Proporción de contratación directa: ${formatPorcentaje(share, 1)} (${signal.unidad}).` : null,
      direct !== null ? `Procesos por contratación directa: ${formatEntero(direct)}.` : null,
      total !== null ? `Procesos de la entidad: ${formatEntero(total)}.` : null,
    ],
  }, context);
}
