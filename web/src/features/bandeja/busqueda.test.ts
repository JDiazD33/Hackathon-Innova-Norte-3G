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
    const publico = await indiceDe("entidad-0001", "publico", proveedores);
    expect(buscar(publico, "empresa demostrativa")).toEqual([]);
    expect(buscar(publico, "20999999991")).toEqual([]);
  });
});
