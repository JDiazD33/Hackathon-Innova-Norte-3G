/** Solo se permiten explicaciones generales en metodología; nunca etiquetas de casos. */
export const ALLOWED_PHRASES = [
  {
    phrase: "Una señal no prueba corrupción.",
    files: ["features/etica/metodologia.ts"],
    reason: "Aclara el límite de las señales según el ADR 0007.",
  },
  {
    phrase: "La prioridad de revisión no es una probabilidad de corrupción.",
    files: ["features/etica/metodologia.ts"],
    reason: "Explica qué representa la fórmula de prioridad, sin atribuir hechos a nadie.",
  },
] as const;

// Incluye variaciones de género y plural para evitar etiquetas equivalentes.
export const FORBIDDEN_PATTERN = /\b(?:corrupcion(?:es)?|corrupt[oa]s?|fraudes?|irregular(?:es|idad(?:es)?)?|sospechos[oa]s?|culpables?)\b/g;

export function normalizeVocabulary(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
