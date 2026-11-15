import { describe, expect, it } from "vitest";

import type { Proceso } from "@/lib/data/types";

import {
  initialReviewCase,
  reviewCaseLabel,
  reviewCaseLabels,
  toReviewCases,
} from "./review-cases";

function proceso(ocid: string, extra: Partial<Proceso> = {}): Proceso {
  return {
    ocid,
    entidad_id: "entidad-0001",
    descripcion: `Descripción ${ocid}`,
    nomenclatura: null,
    metodo: "Licitación Pública",
    objeto: "bienes",
    moneda: "PEN",
    monto_referencial: null,
    monto_adjudicado: null,
    monto_final: null,
    fechas: {
      convocatoria: "2026-03-10",
      inicio_presentacion: null,
      fin_presentacion: null,
      adjudicacion: null,
      contrato: null,
      culminacion: null,
    },
    numero_postores: null,
    estado: null,
    ganadores: [],
    documentos: [],
    url_seace: null,
    senales: [],
    prioridad: null,
    simulado: false,
    ...extra,
  };
}

describe("casos del selector de Revisión", () => {
  it("pone primero los procesos con señales, por prioridad, y conserva el orden en los empates", () => {
    const cases = toReviewCases([
      proceso("sin-1"),
      proceso("baja", {
        senales: ["s-1"],
        prioridad: { puntaje: 2, nivel: "baja", desglose: [] },
      }),
      proceso("sin-2"),
      proceso("alta", {
        senales: ["s-2", "s-3"],
        prioridad: { puntaje: 6, nivel: "alta", desglose: [] },
      }),
    ]);
    expect(cases.map((c) => c.ocid)).toEqual(["alta", "baja", "sin-1", "sin-2"]);
    expect(cases[0].signals).toBe(2);
  });

  it("distingue dos versiones de un mismo procedimiento por su estado", () => {
    const [a, b] = toReviewCases([
      proceso("v1", { nomenclatura: "LP-SM-1-2026-IRO/COMITE-1", estado: "CONVOCADO" }),
      proceso("v2", { nomenclatura: "LP-SM-1-2026-IRO/COMITE-1", estado: "CONSENTIDO" }),
    ]);
    expect(reviewCaseLabel(a)).toMatch(/^LP-SM-1-2026-IRO\/COMITE-1 · CONVOCADO · /);
    expect(reviewCaseLabel(b)).toMatch(/^LP-SM-1-2026-IRO\/COMITE-1 · CONSENTIDO · /);
    expect(reviewCaseLabel(a)).not.toBe(reviewCaseLabel(b));
  });

  it("agrega el ocid solo a las opciones que siguen repetidas", () => {
    const copia = { nomenclatura: "LP-ABR-3-2025-IRO/COMITE-1", estado: "CONVOCADO" };
    const labels = reviewCaseLabels(
      toReviewCases([
        proceso("ocds-dgv273-seacev3-1148345", copia),
        proceso("ocds-dgv273-seacev3-2025-10046-27", copia),
        proceso("ocds-dgv273-seacev3-1184468", { ...copia, estado: "CONTRATADO" }),
      ]),
    );
    expect(labels.get("ocds-dgv273-seacev3-1148345")).toMatch(/ · seacev3-1148345$/);
    expect(labels.get("ocds-dgv273-seacev3-2025-10046-27")).toMatch(/ · seacev3-2025-10046-27$/);
    expect(labels.get("ocds-dgv273-seacev3-1184468")).toMatch(/CONTRATADO · 10 mar 2026$/);
  });

  it("usa la descripción si el paquete no trae nomenclatura", () => {
    const [c] = toReviewCases([proceso("p1")]);
    expect(reviewCaseLabel(c)).toMatch(/^Descripción p1 · Sin dato · /);
  });

  it("abre el proceso pedido en la URL solo si está en la entidad", () => {
    const cases = toReviewCases([proceso("a"), proceso("b")]);
    expect(initialReviewCase(cases, "b")).toBe("b");
    expect(initialReviewCase(cases, ["b", "a"])).toBe("b");
    expect(initialReviewCase(cases, "otro")).toBe("a");
    expect(initialReviewCase(cases)).toBe("a");
    expect(initialReviewCase([], "a")).toBe("");
  });
});
