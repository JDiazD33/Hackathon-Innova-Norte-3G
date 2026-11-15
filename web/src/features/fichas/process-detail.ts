import type { DataSource } from "@/lib/data/data-source";
import type { Entidad, Manifest, Proceso, Senal } from "@/lib/data/types";

import { buildProcessTimeline, type TimelineEvent } from "./timeline";

export interface ProcessDetail {
  process: Proceso;
  entity: Pick<Entidad, "id" | "nombre"> | null;
  manifest: Manifest;
  signals: Senal[];
  timeline: TimelineEvent[];
}

/** La ficha pertenece a la entidad del proceso, independientemente del filtro de la bandeja. */
export async function loadProcessDetail(
  source: DataSource,
  ocid: string,
): Promise<ProcessDetail | null> {
  const process = await source.getProcess(ocid);
  if (!process) return null;
  const [entity, manifest, signals, file] = await Promise.all([
    source.getEntity(process.entidad_id),
    source.getManifest(),
    source.getSignalsForProcess(ocid),
    source.getExpediente(ocid),
  ]);
  const weight = (signal: Senal) =>
    process.prioridad?.desglose.find((item) => item.codigo === signal.codigo)
      ?.peso ??
    manifest.prioridad.pesos[signal.codigo] ??
    0;
  return {
    process,
    entity: entity ? { id: entity.id, nombre: entity.nombre } : null,
    manifest,
    signals: [...signals].sort((a, b) => weight(b) - weight(a)),
    timeline: buildProcessTimeline(process, file),
  };
}
