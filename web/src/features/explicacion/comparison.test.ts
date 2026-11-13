import { describe, expect, it } from "vitest";

import type { Comparacion, Senal } from "@/lib/data/types";
import { formatPorcentaje } from "@/lib/format";

import { describeComparison } from "./comparison";

function comparison(percentile: number | null, code: Senal["codigo"] = "S02") {
  return { codigo: code, comparacion: {
    descripcion: "Procesos comparables", ambito: "region", n: 100,
    q1: null, mediana: null, q3: null, valla_superior: null,
    percentil_del_caso: percentile, proporcion_referencia: null,
  } satisfies Comparacion };
}

describe("Resumen de comparación", () => {
  it.each([[4, 5], [5, 5], [5.01, 10], [9.7, 10], [10, 10], [0, 5], [50, 50]])(
    "percentil %s de plazo se presenta dentro del %s por ciento más corto", (percentile, band) => {
      expect(describeComparison(comparison(percentile)))
        .toBe(`El plazo está entre el ${formatPorcentaje(band / 100)} más corto de los procesos comparables.`);
    },
  );

  it.each([null, -1, 101, Number.NaN, Number.POSITIVE_INFINITY])("omite percentiles inválidos: %s", (value) => {
    expect(describeComparison(comparison(value))).toBeNull();
  });

  it("omite la frase sin grupo o con un grupo vacío", () => {
    expect(describeComparison({ codigo: "S02", comparacion: null })).toBeNull();
    const signal = comparison(4);
    signal.comparacion.n = 0;
    expect(describeComparison(signal)).toBeNull();
  });

  it("un percentil alto del plazo no se presenta como plazo corto", () => {
    expect(describeComparison(comparison(95))).toBe(`El ${formatPorcentaje(0.95)} de los procesos comparables tiene un plazo igual o menor.`);
  });

  it.each(["S03", "S05"] as const)("%s incluye los empates en el percentil máximo", (code) => {
    const text = describeComparison(comparison(100, code));
    expect(text).toContain(formatPorcentaje(1));
    expect(text).toContain("igual o menor");
    expect(text).not.toMatch(/1%|único|más corto/);
  });
});
