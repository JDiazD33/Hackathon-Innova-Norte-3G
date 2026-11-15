import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { StaticDataSource } from "@/lib/data/static-data-source";
import type { Proveedor } from "@/lib/data/types";

import { buscar, construirIndice, normalizarTexto } from "./busqueda";

const fuente = new StaticDataSource(fileURLToPath(new URL("../../../data/fixture", import.meta.url)));

async function indiceDe(entidadId: string, modo: "publico" | "local" = "publico", proveedores?: Proveedor[]) {
  return construirIndice(await fuente.listProcesses(entidadId), proveedores ?? (await fuente.listSuppliers()), modo);
}

describe("normalizarTexto", () => {
  it("quita tildes, mayúsculas y espacios de más", () => {
    expect(normalizarTexto("  ADQUISICIÓN   de Mobiliario ")).toBe("adquisicion de mobiliario");
  });
});

describe("buscar", () => {
  it("encuentra procesos por palabras de su descripción, sin importar tildes ni mayúsculas", async () => {
    const indice = await indiceDe("entidad-0001");
    const resultados = buscar(indice, "ADQUISICIÓN mobiliario");
    expect(resultados.length).toBeGreaterThan(0);
    expect(resultados.every((r) => normalizarTexto(r.titulo).includes("mobiliario"))).toBe(true);
    expect(resultados[0].href).toMatch(/^\/procesos\//);
  });

  it("pone primero la coincidencia exacta de ocid", async () => {
    const indice = await indiceDe("entidad-0001");
    expect(buscar(indice, "ocds-fixture-e1-010")[0].id).toBe("ocds-fixture-e1-010");
  });

  it("encuentra procesos por su nomenclatura del SEACE (contrato 1.1) y la muestra en el detalle", async () => {
    const indice = await indiceDe("entidad-0001");
    const [primero] = buscar(indice, "as-sm-3-2025-upfn-1");
    expect(primero).toMatchObject({ tipo: "proceso", id: "ocds-fixture-e1-003" });
    expect(primero.detalle).toContain("AS-SM-3-2025-UPFN-1");
  });

  it("sigue funcionando con paquetes 1.0, que no traen nomenclatura", async () => {
    const procesos = (await fuente.listProcesses("entidad-0001")).map((p) => {
      const copia = { ...p };
      delete copia.nomenclatura;
      return copia;
    });
    const indice = construirIndice(procesos, await fuente.listSuppliers(), "publico");
    expect(indice.every((e) => !e.detalle.includes("undefined") && !e.texto.includes("undefined"))).toBe(true);
    expect(buscar(indice, "ocds-fixture-e1-010")[0].id).toBe("ocds-fixture-e1-010");
  });

  it("sus enlaces conservan la entidad del índice, para abrir la ficha en esa entidad", async () => {
    const indice = construirIndice(
      await fuente.listProcesses("entidad-0002"),
      await fuente.listSuppliers(),
      "publico",
      "entidad-0002",
    );
    const proveedor = indice.find((e) => e.tipo === "proveedor");
    const proceso = indice.find((e) => e.tipo === "proceso");
    expect(proveedor?.href).toMatch(/^\/proveedores\/P\d+\?entidad=entidad-0002$/);
    expect(proceso?.href).toMatch(/^\/procesos\/[^?]+\?entidad=entidad-0002$/);
  });

  it("encuentra proveedores por su seudónimo", async () => {
    const indice = await indiceDe("entidad-0001");
    const [primero] = buscar(indice, "proveedor 0003");
    expect(primero).toMatchObject({ tipo: "proveedor", id: "P0003", titulo: "Proveedor 0003" });
  });

  it("devuelve una lista vacía con una consulta vacía y respeta el límite", async () => {
    const indice = await indiceDe("entidad-0001");
    expect(buscar(indice, "   ")).toEqual([]);
    expect(buscar(indice, "ocds", 3)).toHaveLength(3);
  });

  it("solo busca por nombre en modo local y nunca a una persona natural", async () => {
    const proveedores = (await fuente.listSuppliers()).map((p) => {
      if (p.id === "P0003") return { ...p, nombre: "Empresa Demostrativa SAC", ruc: "20999999991" };
      if (p.id === "P0007") return { ...p, nombre: "Nombre De Persona Natural", ruc: "10999999991" };
      return p;
    });
    const local = await indiceDe("entidad-0001", "local", proveedores);
    expect(buscar(local, "empresa demostrativa")[0]).toMatchObject({ id: "P0003", titulo: "Empresa Demostrativa SAC" });
    expect(buscar(local, "persona natural")).toEqual([]);
    // El RUC 10 contiene el DNI: tampoco sirve para encontrar a la persona natural.
    expect(buscar(local, "10999999991")).toEqual([]);
    expect(buscar(local, "20999999991")[0]).toMatchObject({ id: "P0003" });
    const publico = await indiceDe("entidad-0001", "publico", proveedores);
    expect(buscar(publico, "empresa demostrativa")).toEqual([]);
    expect(buscar(publico, "20999999991")).toEqual([]);
  });
});
