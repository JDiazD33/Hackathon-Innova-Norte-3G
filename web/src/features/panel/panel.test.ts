import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { ReviewState } from "@/features/revision";
import { StaticDataSource } from "@/lib/data/static-data-source";

import {
  contarRevisionesPendientes,
  describirCategorias,
  describirTendencia,
  describirTopProveedores,
  resumirPanel,
} from "./panel";

const fuente = new StaticDataSource(fileURLToPath(new URL("../../../data/fixture", import.meta.url)));

async function panelDe(entidadId: string) {
  const entidad = (await fuente.getEntity(entidadId))!;
  const procesos = await fuente.listProcesses(entidadId);
  const senales = await fuente.listSignals(entidadId);
  const proveedores = new Map((await fuente.listSuppliers()).map((p) => [p.id, p]));
  return resumirPanel(entidad, procesos, senales, (id) => proveedores.get(id)?.alias ?? id);
}

describe("resumirPanel", () => {
  it("toma las cifras del resumen de la entidad", async () => {
    const entidad = (await fuente.getEntity("entidad-0001"))!;
    const panel = await panelDe("entidad-0001");
    expect(panel.procesos).toBe(22);
    expect(panel.procesosConSenales).toBe(12);
    expect(panel.ocidsConSenales).toHaveLength(12);
    expect(panel.montoTotal).toBe(entidad.resumen.monto_total);
  });

  it("ordena las categorías de mayor a menor y la tendencia por mes", async () => {
    const panel = await panelDe("entidad-0001");
    const cantidades = panel.porCategoria.map((c) => c.cantidad);
    expect(cantidades).toEqual([...cantidades].sort((a, b) => b - a));
    expect(panel.porCategoria.every((c) => c.etiqueta.length > 0)).toBe(true);
    const meses = panel.tendencia.map((m) => m.mes);
    expect(meses).toEqual([...meses].sort());
    expect(panel.tendencia[0].etiqueta).toMatch(/^[a-z]{3,4} \d{4}$/);
  });

  it("marca al proveedor con S03 entre los de mayor participación", async () => {
    const panel = await panelDe("entidad-0001");
    expect(panel.topProveedores[0]).toMatchObject({
      proveedorId: "P0003",
      nombre: "Proveedor 0003",
      adjudicaciones: 9,
      recurrenteAtipico: true,
    });
    expect(panel.topProveedores.slice(1).every((p) => !p.recurrenteAtipico)).toBe(true);
  });

  it("incluye las señales de nivel entidad (S05)", async () => {
    expect((await panelDe("entidad-0002")).senalesEntidad.map((s) => s.codigo)).toEqual(["S05"]);
    expect((await panelDe("entidad-0001")).senalesEntidad).toEqual([]);
  });
});

describe("contarRevisionesPendientes", () => {
  it("cuenta como pendientes los casos sin revisar o en revisión", async () => {
    const { ocidsConSenales } = await panelDe("entidad-0001");
    expect(contarRevisionesPendientes(ocidsConSenales, () => "sin_revisar")).toBe(12);
    const decididos: Record<string, ReviewState> = {
      [ocidsConSenales[0]]: "justificada",
      [ocidsConSenales[1]]: "requiere_atencion",
      [ocidsConSenales[2]]: "en_revision",
    };
    expect(contarRevisionesPendientes(ocidsConSenales, (ocid) => decididos[ocid] ?? "sin_revisar")).toBe(10);
  });
});

describe("resúmenes en texto de los gráficos", () => {
  it("describen los datos sin valores vacíos", async () => {
    const panel = await panelDe("entidad-0001");
    const textos = [
      describirCategorias(panel.porCategoria),
      describirTendencia(panel.tendencia),
      describirTopProveedores(panel.topProveedores),
    ];
    for (const texto of textos) expect(texto).not.toMatch(/undefined|null|NaN/);
    expect(textos[1]).toContain("22 procesos");
    expect(textos[1]).toContain("12 tienen señales");
    expect(textos[2]).toContain("Proveedor 0003");
  });

  it("explican cuando no hay datos", () => {
    expect(describirCategorias([])).toContain("no tiene señales");
    expect(describirTendencia([])).toContain("No hay procesos");
    expect(describirTopProveedores([])).toContain("No hay adjudicaciones");
  });
});
