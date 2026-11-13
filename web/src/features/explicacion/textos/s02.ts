import type { Senal } from "@/lib/data/types";
import { formatEntero } from "@/lib/format";

import type { ExplanationContext } from "../types";
import { comparisonText, completeExplanation, inputText, isNumber } from "./common";

export function explainS02(signal: Senal, context?: ExplanationContext) {
  const days = signal.valor;
  const median = signal.comparacion?.mediana;
  const threshold = signal.umbral.valor;
  const method = inputText(signal, "metodo");
  return completeExplanation(signal, {
    finding: isNumber(days)
      ? `El plazo para presentar ofertas fue de ${formatEntero(days)} ${days === 1 ? "día calendario" : "días calendario"}.`
      : "Falta la duración del plazo para presentar ofertas.",
    comparison: comparisonText(signal,
      isNumber(median) ? `La mitad de los procesos comparables tiene un plazo igual o menor a ${formatEntero(median)} días calendario.` : null,
      isNumber(threshold) ? `El umbral configurado para esta señal es de ${formatEntero(threshold)} días calendario.` : null),
    importance: "Un plazo corto puede dificultar que otros proveedores preparen sus ofertas y reducir la participación.",
    review: ["Fechas de inicio y cierre de la presentación de ofertas y posibles prórrogas.", "Plazo aplicable al método y sustento de su duración.", "Número de proveedores que participaron."],
    limitation: "Un plazo corto no demuestra un trato indebido. Una necesidad simple o urgente puede tener una explicación que debe revisarse en sus documentos.",
    dataUsed: [isNumber(days) ? `Plazo para presentar ofertas: ${formatEntero(days)} días calendario.` : null, method ? `Método: ${method}.` : null],
  }, context);
}
