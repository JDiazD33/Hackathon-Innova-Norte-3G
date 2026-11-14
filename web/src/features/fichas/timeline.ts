import type { EtapaExpediente, Expediente, FechasProceso, Proceso } from "@/lib/data/types";
import { formatFecha } from "@/lib/format";

export interface TimelineEvent {
  id: string;
  stage: keyof FechasProceso | EtapaExpediente;
  label: string;
  date: string | null;
  formattedDate: string;
  source: "process" | "internal";
  isSimulated: boolean;
  badge: "Dato simulado" | null;
  responsible: string | null;
  document: string | null;
}

const PROCESS_STAGES: Record<keyof FechasProceso, string> = {
  convocatoria: "Convocatoria",
  inicio_presentacion: "Inicio del plazo para presentar ofertas",
  fin_presentacion: "Cierre del plazo para presentar ofertas",
  adjudicacion: "Adjudicación",
  contrato: "Contrato",
  culminacion: "Culminación",
};

const INTERNAL_STAGES: Record<EtapaExpediente, string> = {
  requerimiento: "Requerimiento", evaluacion: "Evaluación", conformidad: "Conformidad", pago: "Pago",
};

function timestamp(date: string | null): number {
  const time = date ? Date.parse(date) : Number.NaN;
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

/** Fechas desconocidas al final, en su orden original, sin inventar su posición. */
export function buildProcessTimeline(process: Proceso, file?: Expediente | null): TimelineEvent[] {
  const events = (Object.entries(PROCESS_STAGES) as [keyof FechasProceso, string][])
    .map(([stage, label]): TimelineEvent => ({
      id: `process-${stage}`, stage, label, date: process.fechas[stage],
      formattedDate: formatFecha(process.fechas[stage]), source: "process",
      isSimulated: process.simulado, badge: process.simulado ? "Dato simulado" : null,
      responsible: null, document: null,
    }));

  if (file?.ocid === process.ocid) {
    events.push(...file.etapas.map((entry, index): TimelineEvent => ({
      id: `internal-${entry.etapa}-${index}`, stage: entry.etapa,
      label: INTERNAL_STAGES[entry.etapa], date: entry.fecha,
      formattedDate: formatFecha(entry.fecha), source: "internal",
      isSimulated: true, badge: "Dato simulado",
      responsible: entry.responsable, document: entry.documento,
    })));
  }

  return events.sort((left, right) => {
    const a = timestamp(left.date);
    const b = timestamp(right.date);
    return a === b ? 0 : a - b;
  });
}
