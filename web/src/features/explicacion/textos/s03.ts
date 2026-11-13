import type { Senal } from "@/lib/data/types";
import { formatEntero, formatPorcentaje } from "@/lib/format";

import type { ExplanationContext } from "../types";
import { comparisonText, completeExplanation, inputNumber, isNumber, sentences } from "./common";

export function explainS03(signal: Senal, context?: ExplanationContext) {
  const share = signal.valor;
  const count = inputNumber(signal, "adjudicaciones_proveedor");
  const total = inputNumber(signal, "adjudicaciones_entidad");
  const fence = signal.comparacion?.valla_superior;
  return completeExplanation(signal, {
    finding: sentences(
      isNumber(share) ? `El proveedor registra una participación de ${formatPorcentaje(share, 1)} en la entidad (${signal.unidad}).` : null,
      count !== null && total !== null
        ? `Obtuvo ${formatEntero(count)} de ${formatEntero(total)} adjudicaciones de la entidad en el periodo analizado.` : null,
    ) || "Falta la participación del proveedor en las adjudicaciones de la entidad.",
    comparison: comparisonText(signal,
      isNumber(fence) ? `El límite superior de comparación de la participación es ${formatPorcentaje(fence, 1)}.` : null),
    importance: "Una participación concentrada permite priorizar la revisión de cómo se distribuyen las adjudicaciones entre proveedores.",
    review: ["Cómo se definieron los requerimientos y qué oferta existe en la zona.", "Quiénes evaluaron las ofertas y cómo sustentaron sus decisiones.", "Posibles vínculos que deban declararse entre el proveedor y quienes deciden."],
    limitation: "La recurrencia no demuestra favoritismo. Puede responder a especialización, disponibilidad local, un contrato marco o un desempeño comprobado.",
    dataUsed: [
      isNumber(share) ? `Participación del proveedor: ${formatPorcentaje(share, 1)} (${signal.unidad}).` : null,
      count !== null ? `Adjudicaciones del proveedor: ${formatEntero(count)}.` : null,
      total !== null ? `Adjudicaciones de la entidad: ${formatEntero(total)}.` : null,
    ],
  }, context);
}
