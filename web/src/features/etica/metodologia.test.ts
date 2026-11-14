import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { StaticDataSource } from "@/lib/data/static-data-source";
import type { Manifest } from "@/lib/data/types";

import { buildMethodology, SIGNAL_METHODOLOGY } from "./metodologia";

let manifest: Manifest;
beforeAll(async () => {
  const source = new StaticDataSource(fileURLToPath(new URL("../../../data/fixture", import.meta.url)));
  manifest = await source.getManifest();
});

describe("Contenido de metodología", () => {
  it("cubre los ocho códigos del catálogo y cada uno incluye regla y referencia", () => {
    const catalog = fs.readFileSync(fileURLToPath(new URL("../../../../docs/datos/catalogo-de-senales.md", import.meta.url)), "utf8");
    const codes = [...new Set([...catalog.matchAll(/^\| (S\d{2}) \|/gm)].map((match) => match[1]))];
    expect(Object.keys(SIGNAL_METHODOLOGY)).toEqual(codes);
    for (const item of Object.values(SIGNAL_METHODOLOGY)) {
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.rule.length).toBeGreaterThan(0);
      expect(item.reference.length).toBeGreaterThan(0);
    }
  });
  it("muestra solo las señales activas del manifiesto y conserva los motivos de desactivación", () => {
    const methodology = buildMethodology(manifest);
    expect(methodology.signals.map((item) => item.code)).toEqual(manifest.senales_activas);
    expect(methodology.signals.find((item) => item.code === "S07")).toBeUndefined();
    expect(methodology.signals.find((item) => item.code === "S08")?.simulated).toBe(true);
    expect(methodology.disabledSignals).toEqual(manifest.senales_desactivadas);
  });
  it("fuente, licencia, corte y versión reflejan el paquete sintético sin atribuirlo a datos reales", () => {
    const methodology = buildMethodology(manifest);
    expect(methodology.source.name).toBe(manifest.fuente.nombre);
    expect(methodology.source.attribution).toBe(manifest.atribucion);
    expect(methodology.source.cutoffDate).toBe(manifest.fecha_corte);
    expect(methodology.source.ruleVersion).toBe("fixture-1");
    expect(methodology.source.license).toBe(manifest.licencia);
    expect(methodology.source.exclusions).toEqual(manifest.exclusiones);
  });
  it("usa los pesos y cortes del paquete y no impone los iniciales del catálogo", () => {
    const copy = structuredClone(manifest);
    copy.prioridad = { pesos: { S01: 7, S08: 1 }, cortes: { alta: 10, media: 6 } };
    const methodology = buildMethodology(copy);
    expect(methodology.priority.weights).toEqual({ S01: 7, S08: 1 });
    expect(methodology.priority.cutoffs).toEqual({ alta: 10, media: 6 });
    expect(methodology.priority.note).toContain("S05");
    methodology.priority.weights.S01 = 20;
    expect(copy.prioridad.pesos.S01).toBe(7);
  });
  it("reconoce las licencias y distingue dependencias previstas de herramientas cerradas", () => {
    const methodology = buildMethodology(manifest);
    expect(methodology.references.find((item) => item.name === "Cardinal")?.license).toBe("MIT");
    expect(methodology.references.find((item) => item.name === "Arachne")?.use).toContain("No se usa su código");
    expect(methodology.references.find((item) => item.name === "Guía de banderas rojas de OCP")?.license).toContain("pendiente confirmar");
    expect(methodology.software.find((item) => item.name === "TypeScript")?.license).toBe("Apache-2.0");
    expect(methodology.limits.join(" ")).toContain("8 UIT");
    expect(methodology.limits.join(" ")).toContain("pagos, hitos ni modificaciones");
    expect(methodology.limits.join(" ")).toContain("datos simulados");
  });
});
