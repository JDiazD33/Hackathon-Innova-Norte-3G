import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { StaticDataSource } from "@/lib/data/static-data-source";
import type { Expediente, Proceso } from "@/lib/data/types";

import { buildProcessTimeline } from "./timeline";

const source = new StaticDataSource(fileURLToPath(new URL("../../../data/fixture", import.meta.url)));
let process: Proceso;
let file: Expediente;
beforeAll(async () => {
  process = (await source.getProcess("ocds-fixture-e1-007"))!;
  file = (await source.getExpediente(process.ocid))!;
});

describe("Línea de tiempo del proceso", () => {
  it("mezcla las seis fechas del proceso y las cuatro etapas internas en orden cronológico", () => {
    const timeline = buildProcessTimeline(process, file);
    expect(timeline).toHaveLength(10);
    const dates = timeline.filter((entry) => entry.date !== null).map((entry) => Date.parse(entry.date!));
    expect(dates).toEqual([...dates].sort((a, b) => a - b));
    expect(timeline.filter((entry) => entry.source === "internal")).toHaveLength(4);
    expect(timeline.find((entry) => entry.stage === "conformidad")).toMatchObject({
      label: "Conformidad", responsible: "Área usuaria · Persona A", document: null,
      isSimulated: true, badge: "Dato simulado",
    });
  });

  it("las fechas nulas van al final con Sin dato, incluidas las internas", () => {
    const copy = structuredClone(process);
    copy.fechas.culminacion = null;
    const internal = structuredClone(file);
    internal.etapas[0].fecha = null;
    const timeline = buildProcessTimeline(copy, internal);
    const unknown = timeline.filter((entry) => entry.date === null);
    expect(unknown.length).toBeGreaterThanOrEqual(2);
    expect(unknown.every((entry) => entry.formattedDate === "Sin dato")).toBe(true);
    expect(timeline.slice(-unknown.length)).toEqual(unknown);
  });

  it("ordena instantes con zonas horarias y mantiene el orden de fechas iguales", () => {
    const copy = structuredClone(process);
    copy.fechas = {
      convocatoria: "2026-01-01T08:00:00-05:00", inicio_presentacion: "2026-01-01T12:00:00Z",
      fin_presentacion: "2026-01-01T13:00:00Z", adjudicacion: null, contrato: null, culminacion: null,
    };
    expect(buildProcessTimeline(copy).slice(0, 3).map((entry) => entry.stage))
      .toEqual(["inicio_presentacion", "convocatoria", "fin_presentacion"]);
  });

  it("funciona sin expediente y evita mezclar etapas de otro proceso", () => {
    expect(buildProcessTimeline(process)).toHaveLength(6);
    const otherFile = { ...file, ocid: "otro-proceso" };
    expect(buildProcessTimeline(process, otherFile)).toEqual(buildProcessTimeline(process, null));
  });

  it("conserva las entradas y marca como sintéticas las fechas del fixture que lo sean", () => {
    const beforeProcess = structuredClone(process);
    const beforeFile = structuredClone(file);
    const timeline = buildProcessTimeline(process, file);
    expect(process).toEqual(beforeProcess);
    expect(file).toEqual(beforeFile);
    expect(new Set(timeline.map((entry) => entry.id)).size).toBe(timeline.length);
    expect(timeline.filter((entry) => entry.source === "process").every((entry) => entry.isSimulated === process.simulado)).toBe(true);
    const realProcess = { ...process, simulado: false };
    expect(buildProcessTimeline(realProcess).every((entry) => entry.badge === null)).toBe(true);
  });
});
