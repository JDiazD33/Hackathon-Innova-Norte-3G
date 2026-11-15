import type { Senal } from "@/lib/data/types";
import { formatEntero, formatFecha, formatPorcentaje, SIN_DATO } from "@/lib/format";

import type { ExplanationContext } from "../types";
import { comparisonText, completeExplanation, inputNumber, inputText, isNumber, sentences } from "./common";

export function explainS03(signal: Senal, context?: ExplanationContext) {
  const share = signal.valor;
  // Claves de `entradas` según docs/datos/catalogo-de-senales.md#entradas-de-cada-señal.
  const count = inputNumber(signal, "procesos_ganados");
  const total = inputNumber(signal, "procesos_entidad");
  const fence = signal.comparacion?.valla_superior;
  const minimum = inputNumber(signal, "participacion_minima");
  const start = formatFecha(inputText(signal, "ventana_inicio"));
  const end = formatFecha(inputText(signal, "ventana_fin"));
  return completeExplanation(signal, {
    finding: sentences(
      isNumber(share) ? `El proveedor registra una participación de ${formatPorcentaje(share, 1)} en la entidad (${signal.unidad}).` : null,
      count !== null && total !== null
        ? `Obtuvo ${formatEntero(count)} de los ${formatEntero(total)} procesos adjudicados por la entidad en el periodo analizado.` : null,
    ) || "Falta la participación del proveedor en las adjudicaciones de la entidad.",
    comparison: comparisonText(signal,
      isNumber(fence) ? `El límite superior de comparación de la participación es ${formatPorcentaje(fence, 1)}.` : null),
    importance: "Una participación concentrada permite priorizar la revisión de cómo se distribuyen las adjudicaciones entre proveedores.",
    review: ["Cómo se definieron los requerimientos y qué oferta existe en la zona.", "Quiénes evaluaron las ofertas y cómo sustentaron sus decisiones.", "Posibles vínculos que deban declararse entre el proveedor y quienes deciden."],
    limitation: "La recurrencia no demuestra favoritismo. Puede responder a especialización, disponibilidad local, un contrato marco o un desempeño comprobado.",
    dataUsed: [
      isNumber(share) ? `Participación del proveedor: ${formatPorcentaje(share, 1)} (${signal.unidad}).` : null,
      count !== null ? `Procesos ganados por el proveedor: ${formatEntero(count)}.` : null,
      total !== null ? `Procesos adjudicados por la entidad: ${formatEntero(total)}.` : null,
      minimum !== null && minimum >= 0 && minimum <= 1
        ? `Participación mínima configurada: ${formatPorcentaje(minimum, 1)}.` : null,
      start !== SIN_DATO && end !== SIN_DATO ? `Periodo de la señal: del ${start} al ${end}.` : null,
    ],
  }, context);
}
