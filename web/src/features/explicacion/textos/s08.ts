import type { Senal } from "@/lib/data/types";
import { formatEntero } from "@/lib/format";

import type { ExplanationContext } from "../types";
import { completeExplanation, sentences } from "./common";

export function explainS08(signal: Senal, context?: ExplanationContext) {
  const stages = Array.isArray(signal.entradas.etapas)
    ? signal.entradas.etapas.filter((stage) => typeof stage === "string") : [];
  const missingDocument = signal.entradas.conformidad_sin_documento === true;
  const missingApproval = signal.entradas.pago_sin_conformidad === true;
  return completeExplanation(signal, {
    finding: sentences(
      stages.length >= 2 ? `En el expediente simulado, ${formatEntero(stages.length)} etapas están a cargo de la misma persona.` : null,
      missingDocument ? "La conformidad no tiene un documento de sustento registrado en el ejemplo." : null,
      missingApproval ? "El ejemplo incluye un pago sin conformidad registrada." : null,
    ) || "El expediente simulado contiene una señal de trazabilidad que amerita revisión.",
    comparison: "Se revisan la separación de funciones y la existencia de documentos de sustento del expediente simulado. No es una comparación estadística con procesos reales.",
    importance: "Separar funciones y documentar cada etapa facilita reconstruir cómo se aprobó una contratación y su pago.",
    review: ["Responsables de solicitar, evaluar y dar conformidad.", "Documento de conformidad y sustento del pago.", "Fechas y autorizaciones de cada etapa."],
    limitation: "Este es un dato simulado para demostrar el flujo de revisión. No describe hechos de personas ni de expedientes reales. La ausencia de un registro tampoco demuestra por sí sola que la actuación no ocurrió.",
    dataUsed: [
      stages.length > 0 ? `Etapas registradas a cargo de la misma persona: ${formatEntero(stages.length)}.` : null,
      missingDocument ? "Conformidad sin documento registrado en el ejemplo." : null,
      missingApproval ? "Pago sin conformidad registrada en el ejemplo." : null,
    ],
  }, context);
}
