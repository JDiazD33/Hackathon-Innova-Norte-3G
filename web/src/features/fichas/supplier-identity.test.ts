import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { StaticDataSource } from "@/lib/data/static-data-source";
import type { Proveedor } from "@/lib/data/types";

import { getSupplierIdentity } from "./supplier-identity";

const supplier: Proveedor = {
  id: "P0003", alias: "Proveedor 0003", nombre: "Empresa de prueba", ruc: "20999999999",
  tipo: "persona_juridica", url_ficha_unica: "https://apps.oece.gob.pe/perfilprov-ui/ficha/20999999999",
};

describe("Identidad visible del proveedor", () => {
  it.each(["persona_juridica", "persona_natural", "desconocido"] as const)("en público solo expone el seudónimo de %s", (type) => {
    const identity = getSupplierIdentity({ ...supplier, tipo: type }, "publico");
    expect(identity).toEqual({ displayName: "Proveedor 0003", taxId: null, profileUrl: null });
    expect(JSON.stringify(identity)).not.toContain(supplier.nombre);
    expect(JSON.stringify(identity)).not.toContain(supplier.ruc);
  });

  it("en local muestra el nombre, RUC y enlace de una persona jurídica", () => {
    expect(getSupplierIdentity(supplier, "local")).toEqual({
      displayName: supplier.nombre, taxId: supplier.ruc, profileUrl: supplier.url_ficha_unica,
    });
  });

  it("una persona natural nunca muestra su nombre, aunque esté presente en el paquete local", () => {
    const natural = { ...supplier, tipo: "persona_natural", nombre: "Persona de prueba" } satisfies Proveedor;
    expect(getSupplierIdentity(natural, "local")).toEqual({
      displayName: natural.alias, taxId: natural.ruc, profileUrl: natural.url_ficha_unica,
    });
  });

  it("un RUC de persona natural o tipo desconocido tampoco revela el nombre", () => {
    expect(getSupplierIdentity({ ...supplier, ruc: "10999999999" }, "local").displayName).toBe(supplier.alias);
    expect(getSupplierIdentity({ ...supplier, tipo: "desconocido" }, "local").displayName).toBe(supplier.alias);
  });

  it("con datos ausentes usa el seudónimo sin fabricar un RUC o enlace", () => {
    expect(getSupplierIdentity({ ...supplier, nombre: null, ruc: null, url_ficha_unica: null }, "local"))
      .toEqual({ displayName: supplier.alias, taxId: null, profileUrl: null });
  });

  it.each(["javascript:alert(1)", "no-es-un-enlace", "https://usuario:clave@ejemplo.gob.pe"])("no entrega un enlace no apto para la ficha: %s", (url) => {
    expect(getSupplierIdentity({ ...supplier, url_ficha_unica: url }, "local").profileUrl).toBeNull();
  });

  it("no modifica el objeto recibido", () => {
    const before = structuredClone(supplier);
    getSupplierIdentity(supplier, "publico");
    expect(supplier).toEqual(before);
  });

  it("aplica el modo del manifiesto a todos los proveedores del fixture", async () => {
    const source = new StaticDataSource(fileURLToPath(new URL("../../../data/fixture", import.meta.url)));
    const manifest = await source.getManifest();
    for (const entry of await source.listSuppliers()) {
      expect(getSupplierIdentity(entry, manifest.modo)).toEqual({ displayName: entry.alias, taxId: null, profileUrl: null });
    }
  });
});
