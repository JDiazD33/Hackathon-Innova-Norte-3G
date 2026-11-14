import type { Senal } from "@/lib/data/types";
import { formatEntero, formatSoles } from "@/lib/format";

import type { ExplanationContext } from "../types";
import { completeExplanation, inputNumber, inputText, isNumber, sentences } from "./common";

export function explainS04(signal: Senal, context?: ExplanationContext) {
  const amount = signal.valor;
  const threshold = signal.umbral.valor;
  const days = inputNumber(signal, "dias_entre_convocatorias");
  const window = inputNumber(signal, "ventana_dias");
  const category = inputText(signal, "clase_item");
  return completeExplanation(signal, {
    finding: sentences(
      signal.ocids.length > 0 ? `Se agruparon ${formatEntero(signal.ocids.length)} procesos de compras similares de la entidad.` : null,
      isNumber(amount) ? `El monto conjunto es ${formatSoles(amount)}.` : null,
      days !== null ? `Las convocatorias están separadas por ${formatEntero(days)} días.` : null,
    ) || "Se identificó un grupo de compras similares que amerita revisión.",
    comparison: sentences(
      isNumber(threshold) ? `El umbral configurado del método de mayor alcance es ${formatSoles(threshold)}.` : null,
      window !== null ? `La ventana configurada para agrupar compras es de ${formatEntero(window)} días.` : null,
    ) || "No hay datos del umbral ni de la ventana de comparación.",
    importance: "Revisar compras similares cercanas en el tiempo ayuda a comprobar si una necesidad podía planificarse y contratarse de forma conjunta.",
    review: ["Plan Anual de Contrataciones y previsibilidad de la necesidad.", "Área que solicitó las compras y sustento de cada requerimiento.", "Clasificación de los bienes o servicios y método empleado."],
    limitation: "La agrupación no demuestra que se haya dividido una compra indebidamente. Puede haber necesidades nuevas o compras previstas por etapas. La fuente no incluye compras por debajo de 8 UIT.",
    dataUsed: [
      category ? `Clase de los bienes o servicios: ${category}.` : null,
      isNumber(amount) ? `Monto conjunto: ${formatSoles(amount)}.` : null,
      days !== null ? `Separación entre convocatorias: ${formatEntero(days)} días.` : null,
    ],
  }, context);
}
