import type { Manifest, Proceso } from "@/lib/data/types";

/** Los seis bloques, en el orden de lectura de la tarjeta y del reporte. */
export interface SignalExplanation {
  finding: string;
  comparison: string;
  importance: string;
  review: string[];
  limitation: string;
  dataUsed: string[];
}

/** El origen y el enlace se reciben del paquete; nunca se inventan en la plantilla. */
export interface ExplanationContext {
  manifest?: Pick<Manifest, "fuente" | "fecha_corte" | "licencia">;
  process?: Pick<Proceso, "url_seace">;
}
