import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { StaticDataSource } from "@/lib/data/static-data-source";

import { loadProcessDetail } from "./process-detail";

const source = new StaticDataSource(
  fileURLToPath(new URL("../../../data/fixture", import.meta.url)),
);

describe("Carga de ficha de proceso", () => {
  it("devuelve null para un identificador inventado o inseguro", async () => {
    expect(await loadProcessDetail(source, "ocid-que-no-existe")).toBeNull();
    expect(await loadProcessDetail(source, "../manifest")).toBeNull();
  });

  it("ordena las señales por los pesos recibidos y combina las fechas del expediente", async () => {
    const entities = await source.listEntities();
    const processes = (
      await Promise.all(
        entities.map((entity) => source.listProcesses(entity.id)),
      )
    ).flat();
    for (const process of processes) {
      const detail = (await loadProcessDetail(source, process.ocid))!;
      expect(detail.entity?.id).toBe(process.entidad_id);
      const weights = detail.signals.map(
        (signal) =>
          process.prioridad?.desglose.find(
            (item) => item.codigo === signal.codigo,
          )?.peso ??
          detail.manifest.prioridad.pesos[signal.codigo] ??
          0,
      );
      expect(weights).toEqual([...weights].sort((a, b) => b - a));
      expect(detail.process.prioridad).toEqual(process.prioridad);
      const file = await source.getExpediente(process.ocid);
      if (file)
        expect(
          detail.timeline.filter((event) => event.source === "internal"),
        ).toHaveLength(file.etapas.length);
    }
  });
});
