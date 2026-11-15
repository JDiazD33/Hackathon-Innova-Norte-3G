import type { Senal } from "@/lib/data/types";
import { formatEntero, formatPorcentaje } from "@/lib/format";

import type { ExplanationContext } from "../types";
import { comparisonText, completeExplanation, inputText, isNumber } from "./common";

/**
 * S01 · Un solo participante registrado (decisión 1 del Lote A). La fuente no publica las ofertas (`bids`):
 * `numero_postores` cuenta participantes registrados, así que el texto nunca habla de "ofertas recibidas".
 */
export function explainS01(signal: Senal, context?: ExplanationContext) {
  const count = signal.valor;
  const share = signal.comparacion?.proporcion_referencia;
  const method = inputText(signal, "metodo");
  return completeExplanation(signal, {
    finding: isNumber(count)
      ? `Este proceso tuvo ${formatEntero(count)} ${count === 1 ? "participante registrado" : "participantes registrados"}.`
      : "Falta el número de participantes registrados en este proceso.",
    comparison: comparisonText(signal,
      isNumber(share) && share >= 0 && share <= 1
        ? `El ${formatPorcentaje(share, 1)} de los procesos del grupo tuvo dos o más participantes registrados.` : null),
    importance: "Con un solo participante registrado, la entidad tiene menos opciones para comparar precios y calidad. Es una señal de baja competencia que amerita revisión.",
    review: ["Requisitos de calificación.", "Plazo y difusión de la convocatoria.", "Especificaciones técnicas y oferta disponible en el mercado."],
    limitation: "Un solo participante registrado no demuestra un trato indebido. Puede haber pocos proveedores capaces de atender una necesidad especializada.",
    dataUsed: [
      isNumber(count) ? `Participantes registrados: ${formatEntero(count)}. La fuente no publica el número de ofertas.` : null,
      method ? `Método: ${method}.` : null,
    ],
  }, context);
}
