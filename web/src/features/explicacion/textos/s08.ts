import type { Senal } from "@/lib/data/types";

import type { ExplanationContext } from "../types";
import { completeExplanation, sentences } from "./common";

// Claves de `entradas` según docs/datos/catalogo-de-senales.md#entradas-de-cada-señal.
export function explainS08(signal: Senal, context?: ExplanationContext) {
  const samePerson = signal.entradas.misma_persona === true;
  const person = typeof signal.entradas.persona === "string" && signal.entradas.persona.trim()
    ? signal.entradas.persona.trim() : null;
  const paymentWithoutDocumentedApproval = signal.entradas.pago_sin_conformidad_documentada === true;
  return completeExplanation(signal, {
    finding: sentences(
      samePerson
        ? `En el expediente simulado, la misma persona${person ? ` (${person})` : ""} solicitó, evaluó y dio la conformidad.` : null,
      paymentWithoutDocumentedApproval
        ? "El ejemplo registra un pago cuya conformidad no tiene un documento de sustento." : null,
    ) || "El expediente simulado contiene una señal de trazabilidad que amerita revisión.",
    comparison: "Se revisan la separación de funciones y la existencia de documentos de sustento del expediente simulado. No es una comparación estadística con procesos reales.",
    importance: "Separar funciones y documentar cada etapa facilita reconstruir cómo se aprobó una contratación y su pago.",
    review: ["Responsables de solicitar, evaluar y dar conformidad.", "Documento de conformidad y sustento del pago.", "Fechas y autorizaciones de cada etapa."],
    limitation: "Este es un dato simulado para demostrar el flujo de revisión. No describe hechos de personas ni de expedientes reales. La ausencia de un registro tampoco demuestra por sí sola que la actuación no ocurrió.",
    dataUsed: [
      samePerson ? "Misma persona en el requerimiento, la evaluación y la conformidad del ejemplo." : null,
      paymentWithoutDocumentedApproval ? "Pago sin conformidad documentada en el ejemplo." : null,
    ],
  }, context);
}
