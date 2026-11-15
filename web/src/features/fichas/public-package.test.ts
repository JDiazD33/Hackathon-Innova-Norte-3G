import path from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { explainSignal } from "@/features/explicacion";
import { StaticDataSource } from "@/lib/data/static-data-source";
import type { Senal } from "@/lib/data/types";
import { formatPorcentaje } from "@/lib/format";

import { loadProcessDetail } from "./process-detail";
import { loadSupplierDetail } from "./supplier-detail";

const source = new StaticDataSource(path.join(process.cwd(), "data/publico"));
let signals: Senal[];
beforeAll(async () => {
  const entities = await source.listEntities();
  signals = (await Promise.all(entities.map((entity) => source.listSignals(entity.id)))).flat();
});

describe("Fichas con el paquete público real", () => {
  it("explica todas las señales publicadas sin datos inventados ni valores ausentes literales", async () => {
    const manifest = await source.getManifest();
    expect(manifest.modo).toBe("publico");
    expect(signals).toHaveLength(manifest.conteos.senales);
    for (const signal of signals) {
      const explanation = explainSignal(signal, { manifest });
      expect(explanation, signal.id).not.toBeNull();
      expect(Object.values(explanation!).flat().every((value) => value.length > 0), signal.id).toBe(true);
      expect(JSON.stringify(explanation), signal.id).not.toMatch(/\b(null|undefined|NaN)\b/);
      expect(explanation!.dataUsed).toContain(`Versión de la regla: ${signal.version_regla}.`);
      expect(explanation!.dataUsed).toContain(`Fuente: ${manifest.fuente.nombre}.`);
    }
  });

  it("conserva los mínimos de calibración de S03 y S05 recibidos del pipeline", () => {
    for (const [code, key, label] of [
      ["S03", "participacion_minima", "Participación"],
      ["S05", "proporcion_minima", "Proporción"],
    ] as const) {
      const matching = signals.filter((signal) => signal.codigo === code);
      expect(matching.length).toBeGreaterThan(0);
      for (const signal of matching) {
        const minimum = signal.entradas[key];
        expect(typeof minimum).toBe("number");
        expect(explainSignal(signal)!.dataUsed).toContain(
          `${label} mínima configurada: ${formatPorcentaje(minimum as number, 1)}.`,
        );
        const changed = { ...signal, entradas: { ...signal.entradas, [key]: 0.125 } };
        expect(explainSignal(changed)!.dataUsed).toContain(`${label} mínima configurada: 12.5%.`);
        const absent = { ...signal, entradas: { ...signal.entradas, [key]: null } };
        expect(explainSignal(absent)!.dataUsed.join(" ")).not.toContain("mínima configurada");
      }
    }
  });

  it("carga una ficha y su proveedor reales manteniendo la atribución y la identidad pública", async () => {
    const signal = signals.find((item) => item.codigo === "S03")!;
    const detail = (await loadProcessDetail(source, signal.ocids[0]))!;
    expect(detail.process.simulado).toBe(false);
    expect(detail.signals.some((item) => item.id === signal.id)).toBe(true);
    expect(detail.process.nomenclatura).toBeTruthy();
    expect(detail.timeline.some((event) => !event.isSimulated)).toBe(true);
    const supplier = (await loadSupplierDetail(source, signal.objeto.id, detail.process.entidad_id))!;
    expect(supplier.signals.some((item) => item.id === signal.id)).toBe(true);
    expect(supplier.wonProcesses.some((item) => item.ocid === detail.process.ocid)).toBe(true);
    expect(supplier.identity.taxId).toBeNull();
    expect(supplier.identity.profileUrl).toBeNull();
    expect(supplier.manifest.atribucion).toBe(detail.manifest.atribucion);
  });
});
