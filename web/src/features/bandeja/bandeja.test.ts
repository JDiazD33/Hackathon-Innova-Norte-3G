import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { ReviewState } from "@/features/revision";
import { StaticDataSource } from "@/lib/data/static-data-source";

import {
  construirFilas,
  FILTROS_VACIOS,
  filtrarFilas,
  hayFiltrosActivos,
  opcionesDeFiltro,
  ordenarFilas,
  type FiltrosBandeja,
} from "./bandeja";

const fuente = new StaticDataSource(fileURLToPath(new URL("../../../data/fixture", import.meta.url)));
const sinRevisar = (): ReviewState => "sin_revisar";

async function filasDe(entidadId: string) {
  return ordenarFilas(construirFilas(await fuente.listProcesses(entidadId), await fuente.listSignals(entidadId)));
}

const filtros = (cambios: Partial<FiltrosBandeja>): FiltrosBandeja => ({ ...FILTROS_VACIOS, ...cambios });

describe("construirFilas y ordenarFilas", () => {
  it("solo incluye procesos con prioridad y resuelve sus señales", async () => {
    const filas = await filasDe("entidad-0001");
    expect(filas).toHaveLength(12);
    const fila = filas.find((f) => f.ocid === "ocds-fixture-e1-003")!;
    expect(fila.senales.map((s) => s.codigo)).toEqual(["S01", "S02", "S03"]);
    expect(filas.every((f) => f.senales.length > 0)).toBe(true);
  });

  it("ordena por puntaje y, si empatan, por la convocatoria más reciente", async () => {
    const filas = await filasDe("entidad-0001");
    expect(filas[0].ocid).toBe("ocds-fixture-e1-003");
    for (let i = 1; i < filas.length; i++) {
      const [antes, despues] = [filas[i - 1], filas[i]];
      expect(antes.prioridad.puntaje).toBeGreaterThanOrEqual(despues.prioridad.puntaje);
      if (antes.prioridad.puntaje === despues.prioridad.puntaje) {
        expect(antes.fechaConvocatoria! >= despues.fechaConvocatoria!).toBe(true);
      }
    }
  });

  it("deja al final los procesos sin fecha de convocatoria", async () => {
    const filas = await filasDe("entidad-0001");
    const sinFecha = { ...filas[1], ocid: "sin-fecha", fechaConvocatoria: null };
    const ordenadas = ordenarFilas([sinFecha, filas[1]]);
    expect(ordenadas.at(-1)!.ocid).toBe("sin-fecha");
  });
});

describe("filtrarFilas", () => {
  it("filtra por prioridad", async () => {
    const altas = filtrarFilas(await filasDe("entidad-0001"), filtros({ prioridades: ["alta"] }), sinRevisar);
    expect(altas).toHaveLength(5);
    expect(altas.every((f) => f.prioridad.nivel === "alta")).toBe(true);
  });

  it("filtra por categoría de señal", async () => {
    const filas = await filasDe("entidad-0001");
    const fraccionamiento = filtrarFilas(filas, filtros({ categorias: ["fraccionamiento"] }), sinRevisar);
    expect(fraccionamiento.map((f) => f.ocid).sort()).toEqual(["ocds-fixture-e1-010", "ocds-fixture-e1-011"]);
    const trazabilidad = filtrarFilas(filas, filtros({ categorias: ["trazabilidad"] }), sinRevisar);
    expect(trazabilidad.map((f) => f.ocid)).toEqual(["ocds-fixture-e1-007"]);
  });

  it("filtra por método y por rango de fechas inclusivo", async () => {
    const filas = await filasDe("entidad-0001");
    const metodo = filas[0].metodo;
    expect(filtrarFilas(filas, filtros({ metodos: [metodo] }), sinRevisar).every((f) => f.metodo === metodo)).toBe(true);
    const fila = filas.find((f) => f.ocid === "ocds-fixture-e1-010")!;
    const enRango = filtrarFilas(
      filas,
      filtros({ desde: fila.fechaConvocatoria, hasta: fila.fechaConvocatoria }),
      sinRevisar,
    );
    expect(enRango.map((f) => f.ocid)).toContain("ocds-fixture-e1-010");
    expect(enRango.every((f) => f.fechaConvocatoria === fila.fechaConvocatoria)).toBe(true);
  });

  it("filtra por estado de revisión y combina filtros", async () => {
    const filas = await filasDe("entidad-0001");
    const estados: Record<string, ReviewState> = { "ocds-fixture-e1-003": "justificada" };
    const estadoDe = (ocid: string) => estados[ocid] ?? "sin_revisar";
    expect(filtrarFilas(filas, filtros({ estados: ["justificada"] }), estadoDe).map((f) => f.ocid)).toEqual([
      "ocds-fixture-e1-003",
    ]);
    expect(filtrarFilas(filas, filtros({ estados: ["justificada"], prioridades: ["baja"] }), estadoDe)).toEqual([]);
  });

  it("sin filtros devuelve todas las filas", async () => {
    const filas = await filasDe("entidad-0001");
    expect(hayFiltrosActivos(FILTROS_VACIOS)).toBe(false);
    expect(hayFiltrosActivos(filtros({ desde: "2025-01-01" }))).toBe(true);
    expect(filtrarFilas(filas, FILTROS_VACIOS, sinRevisar)).toHaveLength(filas.length);
  });
});

describe("opcionesDeFiltro", () => {
  it("ofrece solo opciones presentes, en orden", async () => {
    const opciones = opcionesDeFiltro(await filasDe("entidad-0001"));
    expect(opciones.prioridades).toEqual(["alta", "media", "baja"]);
    expect(opciones.categorias.map((c) => c.categoria)).toContain("fraccionamiento");
    expect(opciones.metodos).toEqual([...opciones.metodos].sort((a, b) => a.localeCompare(b, "es")));
    const opcionesE2 = opcionesDeFiltro(await filasDe("entidad-0002"));
    expect(opcionesE2.categorias.map((c) => c.categoria)).not.toContain("trazabilidad");
  });
});
