import "server-only";

import { cacheLife } from "next/cache";

import { getDataSource } from "@/lib/data";
import type { CodigoSenal } from "@/lib/data/types";

export async function loadReport(ocid: string) {
  "use cache";
  cacheLife("max");
  const source = getDataSource();
  const process = await source.getProcess(ocid);
  if (!process) return null;
  const [manifest, entity, signals, file] = await Promise.all([
    source.getManifest(),
    source.getEntity(process.entidad_id),
    source.getSignalsForProcess(ocid),
    source.getExpediente(ocid),
  ]);
  const weight = (code: CodigoSenal) =>
    process.prioridad?.desglose.find((item) => item.codigo === code)?.peso ??
    manifest.prioridad.pesos[code] ??
    0;
  return {
    process,
    manifest,
    entityName: entity?.nombre ?? "Sin dato",
    signals: [...signals].sort((a, b) => weight(b.codigo) - weight(a.codigo)),
    file,
  };
}
