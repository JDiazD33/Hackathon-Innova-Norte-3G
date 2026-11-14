import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { StaticDataSource } from "@/lib/data/static-data-source";
import type { Prioridad } from "@/lib/data/types";

import { describePriority } from "./priority";

describe("Desglose de prioridad", () => {
  it("muestra cada peso y conserva la prioridad recibida", () => {
    const priority: Prioridad = { nivel: "alta", puntaje: 6, desglose: [{ codigo: "S01", peso: 3 }, { codigo: "S03", peso: 3 }] };
    expect(describePriority(priority)).toBe("Alta · S01 (3) + S03 (3) = 6");
  });

  it("no recalcula el nivel a partir de los umbrales actuales", () => {
    expect(describePriority({ nivel: "baja", puntaje: 6, desglose: [{ codigo: "S01", peso: 6 }] }))
      .toBe("Baja · S01 (6) = 6");
  });

  it("un proceso sin señales no recibe prioridad inventada", () => {
    expect(describePriority(null)).toBe("Sin señales");
  });

  it("describe la prioridad del proceso del fixture", async () => {
    const source = new StaticDataSource(fileURLToPath(new URL("../../../data/fixture", import.meta.url)));
    const process = await source.getProcess("ocds-fixture-e1-003");
    expect(describePriority(process!.prioridad)).toBe("Alta · S01 (3) + S03 (3) + S02 (2) = 8");
  });
});
