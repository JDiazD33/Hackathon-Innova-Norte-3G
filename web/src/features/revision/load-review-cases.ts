import "server-only";

import { cacheLife } from "next/cache";

import { getDataSource } from "@/lib/data";

export async function loadReviewCases(entityId: string) {
  "use cache";
  cacheLife("max");
  const source = getDataSource();
  const processes = await source.listProcesses(entityId);
  return processes.map((process) => ({
    ocid: process.ocid,
    description: process.descripcion,
    date: process.fechas.convocatoria,
    simulated: process.simulado,
  }));
}
