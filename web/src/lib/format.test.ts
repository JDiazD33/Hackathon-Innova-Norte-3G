import { describe, expect, it } from "vitest";

import { formatEntero, formatFecha, formatPorcentaje, formatSoles, SIN_DATO } from "./format";

/** Intl puede usar espacios no separables; las pruebas comparan con espacios normales. */
const normalizar = (texto: string) => texto.replace(/[  ]/g, " ");

describe("formatSoles", () => {
  it("formatea montos en soles con el estilo es-PE", () => {
    expect(normalizar(formatSoles(1250000))).toBe("S/ 1,250,000");
    expect(normalizar(formatSoles(1250000.5, { decimales: true }))).toBe("S/ 1,250,000.50");
  });

  it("devuelve Sin dato si falta el valor", () => {
    expect(formatSoles(null)).toBe(SIN_DATO);
    expect(formatSoles(Number.NaN)).toBe(SIN_DATO);
  });
});

describe("formatFecha", () => {
  it("muestra las fechas sin hora tal cual", () => {
    expect(normalizar(formatFecha("2026-10-04"))).toBe("4 oct 2026");
    expect(normalizar(formatFecha("2025-01-31"))).toBe("31 ene 2025");
  });

  it("convierte las fechas con hora a la hora de Lima", () => {
    expect(normalizar(formatFecha("2026-11-15T03:00:00Z"))).toBe("14 nov 2026");
  });

  it("devuelve Sin dato ante valores vacíos o inválidos", () => {
    expect(formatFecha(null)).toBe(SIN_DATO);
    expect(formatFecha("no es una fecha")).toBe(SIN_DATO);
  });
});

describe("formatPorcentaje y formatEntero", () => {
  it("formatean con el estilo es-PE", () => {
    expect(normalizar(formatPorcentaje(0.312))).toBe("31%");
    expect(normalizar(formatPorcentaje(0.312, 1))).toBe("31.2%");
    expect(formatEntero(1240)).toBe("1,240");
    expect(formatPorcentaje(undefined)).toBe(SIN_DATO);
  });
});
