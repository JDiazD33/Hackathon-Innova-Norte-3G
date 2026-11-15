import path from "node:path";

import { describe, expect, it } from "vitest";

import { StaticDataSource } from "@/lib/data/static-data-source";
import type { CodigoSenal } from "@/lib/data/types";

import { buildComparisonChart } from "./comparison-chart";

const source = new StaticDataSource(path.join(process.cwd(), "data/fixture"));
const entities = await source.listEntities();
const signals = (
  await Promise.all(entities.map((entity) => source.listSignals(entity.id)))
).flat();
const sample = (code: CodigoSenal) =>
  structuredClone(signals.find((signal) => signal.codigo === code)!);

describe("Datos de comparación visual", () => {
  it.each(["S01", "S02", "S03", "S04", "S06"] as const)(
    "%s tiene una frase equivalente y no modifica el paquete",
    (code) => {
      const signal = sample(code);
      const before = structuredClone(signal);
      const model = buildComparisonChart(signal, signal.ocids[0])!;
      expect(model.summary.length).toBeGreaterThan(0);
      expect(JSON.stringify(model)).not.toMatch(/NaN|Infinity|undefined/);
      expect(signal).toEqual(before);
    },
  );

  it("S01 no confunde el complemento de dos o más con exactamente uno", () => {
    const signal = sample("S01");
    signal.comparacion!.proporcion_referencia = 0.7;
    const model = buildComparisonChart(signal)!;
    expect(model.points[0].label).toBe("Hasta 1");
    expect(model.points[0].value).toBeCloseTo(0.3);
    expect(model.points[0].isCase).toBe(true);
    expect(model.summary).toContain("hasta un participante");
  });

  it("S02 conserva el percentil exacto y S03 solo muestra estadísticas publicadas", () => {
    const signal = sample("S02");
    signal.comparacion!.percentil_del_caso = 4;
    expect(buildComparisonChart(signal)!.percentile).toBe(4);
    const concentration = sample("S03");
    concentration.comparacion!.valla_superior = null;
    const model = buildComparisonChart(concentration)!;
    expect(model.points.map((point) => point.label)).toEqual([
      "Este proveedor",
      "Mediana",
      "Cuartil superior",
    ]);
    expect(model.threshold).toBeUndefined();
    expect(model.summary).not.toContain("Límite superior");
    expect(model.summary).toContain("no representan proveedores individuales");
  });

  it("S04 ordena fechas, acumula los montos y conserva el marcador del proceso", () => {
    const signal = sample("S04");
    signal.entradas.fechas = ["2025-09-28", "2025-09-08"];
    signal.entradas.montos = [210000, 230000];
    const model = buildComparisonChart(signal, signal.ocids[0])!;
    expect(model.points.map((point) => point.value)).toEqual([230000, 440000]);
    expect(model.points[1].isCase).toBe(true);
    expect(model.threshold).toBe(signal.umbral.valor);
  });

  it.each(["S01", "S02", "S03"] as const)(
    "%s omite la gráfica sin datos de grupo",
    (code) => {
      const signal = sample(code);
      signal.comparacion = null;
      expect(buildComparisonChart(signal)).toBeNull();
    },
  );

  it("no inventa compras ni montos finales ausentes", () => {
    const grouping = sample("S04");
    grouping.entradas.montos = [230000];
    expect(buildComparisonChart(grouping)).toBeNull();
    const execution = sample("S06");
    execution.entradas.monto_final = null;
    expect(buildComparisonChart(execution)).toBeNull();
  });
});
