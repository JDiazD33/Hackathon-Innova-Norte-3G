import type { Senal } from "@/lib/data/types";
import { formatEntero, formatPorcentaje } from "@/lib/format";

import type { ExplanationContext } from "../types";
import { comparisonText, completeExplanation, inputText, isNumber } from "./common";

export function explainS01(signal: Senal, context?: ExplanationContext) {
  const count = signal.valor;
  const share = signal.comparacion?.proporcion_referencia;
  const method = inputText(signal, "metodo");
  return completeExplanation(signal, {
    finding: isNumber(count)
      ? `Este proceso recibió ${formatEntero(count)} ${count === 1 ? "oferta" : "ofertas"}.`
      : "Falta el número de ofertas recibidas en este proceso.",
    comparison: comparisonText(signal,
      isNumber(share) && share >= 0 && share <= 1
        ? `El ${formatPorcentaje(share, 1)} de los procesos del grupo recibió dos o más ofertas.` : null),
    importance: "Con una sola oferta, la entidad tiene menos opciones para comparar precios y calidad. Es una señal de baja competencia que amerita revisión.",
    review: ["Requisitos de calificación.", "Plazo y difusión de la convocatoria.", "Especificaciones técnicas y oferta disponible en el mercado."],
    limitation: "Una sola oferta no demuestra un trato indebido. Puede haber pocos proveedores capaces de atender una necesidad especializada.",
    dataUsed: [isNumber(count) ? `Número de ofertas: ${formatEntero(count)}.` : null, method ? `Método: ${method}.` : null],
  }, context);
}
