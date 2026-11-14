import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { StaticDataSource } from "@/lib/data/static-data-source";
import type { CodigoSenal, Senal } from "@/lib/data/types";
import { formatEntero, formatPorcentaje, formatSoles } from "@/lib/format";

import { explainSignal } from "./index";

const source = new StaticDataSource(fileURLToPath(new URL("../../../data/fixture", import.meta.url)));
const codes = ["S01", "S02", "S03", "S04", "S05", "S06", "S08"] as const;
let signals: Senal[];
function sample(code: CodigoSenal): Senal {
  return structuredClone(signals.find((signal) => signal.codigo === code)!);
}

beforeAll(async () => {
  const entities = await source.listEntities();
  signals = (await Promise.all(entities.map((entity) => source.listSignals(entity.id)))).flat();
});

describe("Explicaciones sobre el paquete de prueba", () => {
  it.each(codes)("%s devuelve los seis bloques completos en orden", (code) => {
    const explanation = explainSignal(sample(code))!;
    expect(Object.keys(explanation)).toEqual(["finding", "comparison", "importance", "review", "limitation", "dataUsed"]);
    expect(explanation.finding.length).toBeGreaterThan(0);
    expect(explanation.comparison.length).toBeGreaterThan(0);
    expect(explanation.importance.length).toBeGreaterThan(0);
    expect(explanation.review.length).toBeGreaterThan(0);
    expect(explanation.limitation.length).toBeGreaterThan(0);
    expect(explanation.dataUsed.length).toBeGreaterThan(0);
  });

  it("todas las señales usan lenguaje claro, sin valores ausentes ni palabras acusatorias", () => {
    for (const signal of signals) {
      const text = JSON.stringify(explainSignal(signal));
      expect(text).not.toMatch(/null|undefined|NaN/);
      expect(text).not.toMatch(/corrupci[oó]n|fraude|irregular|sospechos|culpable/i);
      expect(text).not.toMatch(/tenderPeriod|buyer\.id|awards\.|tender\./);
    }
  });

  it.each(codes)("%s omite estadísticas y entradas ausentes sin cambiar los datos", (code) => {
    const signal = sample(code);
    signal.comparacion = null;
    signal.entradas = {};
    const before = structuredClone(signal);
    const explanation = explainSignal(signal)!;
    expect(JSON.stringify(explanation)).not.toMatch(/null|undefined|NaN/);
    expect(explanation.comparison).not.toMatch(/mediana|mitad de|límite superior|valla|grupo reúne/i);
    expect(signal).toEqual(before);
  });

  it("S01 usa la proporción del grupo y la cantidad recibida, sin cifras de ejemplo", () => {
    const signal = sample("S01");
    signal.valor = 2;
    signal.comparacion!.proporcion_referencia = 0.42;
    const explanation = explainSignal(signal)!;
    expect(explanation.finding).toBe("Este proceso recibió 2 ofertas.");
    expect(explanation.comparison).toContain(formatPorcentaje(0.42));
    expect(explanation.comparison).not.toContain("62");
  });

  it("S01 no inventa una proporción cuando esta es nula", () => {
    const signal = sample("S01");
    signal.comparacion!.proporcion_referencia = null;
    expect(explainSignal(signal)!.comparison).not.toContain("dos o más ofertas");
  });

  it("S02 explica el plazo, el grupo nacional y el umbral recibido", () => {
    const signal = sample("S02");
    signal.comparacion!.ambito = "nacional";
    const explanation = explainSignal(signal)!;
    expect(explanation.finding).toContain(`${formatEntero(signal.valor)} días calendario`);
    expect(explanation.comparison).toContain("alcance nacional");
    expect(explanation.comparison).toContain(`${formatEntero(signal.umbral.valor)} días calendario`);
    expect(explanation.comparison).toContain(formatPorcentaje(0.1));
  });

  it("S02 omite la frase de la mediana si falta ese dato", () => {
    const signal = sample("S02");
    signal.comparacion!.mediana = null;
    expect(explainSignal(signal)!.comparison).not.toContain("La mitad");
  });

  it.each(["S03", "S05"] as const)("%s no confunde una valla ausente con el umbral", (code) => {
    const signal = sample(code);
    expect(explainSignal(signal)!.comparison).toContain("límite superior");
    signal.comparacion!.valla_superior = null;
    expect(explainSignal(signal)!.comparison).not.toContain("límite superior");
  });

  it("S03 explica la participación y el número de adjudicaciones sin asumir montos", () => {
    const explanation = explainSignal(sample("S03"))!;
    expect(explanation.finding).toContain("9 de 22 adjudicaciones");
    expect(explanation.finding).toContain(formatPorcentaje(0.4091, 1));
    expect(explanation.finding).not.toContain("monto");
  });

  it("S04 usa montos, ventana y separación del paquete", () => {
    const signal = sample("S04");
    const explanation = explainSignal(signal)!;
    expect(explanation.finding).toContain("2 procesos");
    expect(explanation.finding).toContain(formatSoles(signal.valor));
    expect(explanation.finding).toContain("20 días");
    expect(explanation.comparison).toContain(formatSoles(signal.umbral.valor));
    expect(explanation.comparison).toContain("60 días");
    expect(explanation.limitation).toContain("8 UIT");
  });

  it("S05 permanece en el nivel de entidad y explica el denominador", () => {
    const explanation = explainSignal(sample("S05"))!;
    expect(explanation.finding).toContain("7 procesos por contratación directa de un total de 18");
    expect(explanation.importance).toContain("no suma a la prioridad de un proceso");
  });

  it("S06 usa montos con decimales y distingue razón de incremento", () => {
    const signal = sample("S06");
    const explanation = explainSignal(signal)!;
    expect(explanation.finding).toContain(formatSoles(214797.31, { decimales: true }));
    expect(explanation.finding).toContain(formatSoles(262052.72, { decimales: true }));
    expect(explanation.finding).toContain(`equivale al ${formatPorcentaje(1.22, 1)}`);
    expect(explanation.comparison).toContain(formatPorcentaje(1.15, 1));
    signal.entradas.monto_final = null;
    expect(explainSignal(signal)!.finding).not.toContain("El monto final fue");
    signal.entradas.monto_contratado = 0;
    expect(JSON.stringify(explainSignal(signal))).not.toMatch(/NaN|Infinity/);
  });

  it("S08 distingue condiciones demostradas y no afirma que hubo un pago sin conformidad", () => {
    const signal = sample("S08");
    const explanation = explainSignal(signal)!;
    expect(explanation.finding).toContain("3 etapas");
    expect(explanation.finding).toContain("no tiene un documento");
    expect(explanation.finding).not.toContain("pago sin conformidad");
    expect(explanation.limitation).toContain("dato simulado");
    signal.entradas = { pago_sin_conformidad: true };
    expect(explainSignal(signal)!.finding).toContain("pago sin conformidad registrada");
    expect(explainSignal(signal)!.finding).not.toContain("misma persona");
  });

  it("los ceros se conservan y las entradas no numéricas se omiten", () => {
    const signal = sample("S04");
    signal.entradas.dias_entre_convocatorias = 0;
    expect(explainSignal(signal)!.finding).toContain("0 días");
    signal.entradas.dias_entre_convocatorias = "20";
    expect(explainSignal(signal)!.finding).not.toContain("separadas");
  });

  it("usa el origen real del paquete y el enlace del proceso al recibir contexto", async () => {
    const signal = sample("S01");
    const manifest = await source.getManifest();
    const process = await source.getProcess(signal.ocids[0]);
    const explanation = explainSignal(signal, { manifest, process: process! })!;
    expect(explanation.dataUsed.join(" ")).toContain(manifest.fuente.nombre);
    expect(explanation.dataUsed.join(" ")).toContain("4 oct 2026");
    expect(explanation.dataUsed.join(" ")).toContain(manifest.licencia);
    expect(explanation.dataUsed.join(" ")).not.toContain("Datos: OECE");
    const withoutLink = explainSignal(signal, { process: { url_seace: null } })!;
    expect(withoutLink.dataUsed).toContain("La fuente no publica un enlace para este proceso.");
    const withLink = explainSignal(signal, { process: { url_seace: "https://ejemplo.gob.pe/proceso/1" } })!;
    expect(withLink.dataUsed).toContain("Ver en el SEACE: https://ejemplo.gob.pe/proceso/1");
  });

  it("S07 no recibe una plantilla inventada mientras siga desactivada", () => {
    const signal = sample("S01");
    signal.codigo = "S07";
    expect(explainSignal(signal)).toBeNull();
  });
});
