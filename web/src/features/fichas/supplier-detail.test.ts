import path from "node:path";

import { describe, expect, it } from "vitest";

import type { DataSource } from "@/lib/data/data-source";
import { StaticDataSource } from "@/lib/data/static-data-source";
import type { Manifest, Proveedor } from "@/lib/data/types";

import { loadSupplierDetail } from "./supplier-detail";

const source = new StaticDataSource(path.join(process.cwd(), "data/fixture"));

describe("Datos de ficha del proveedor", () => {
  it("usa solo las adjudicaciones y S03 de la entidad seleccionada", async () => {
    const detail = (await loadSupplierDetail(source, "P0003", "entidad-0001"))!;
    expect(detail.wonProcesses).toHaveLength(9);
    expect(detail.participation).toBeCloseTo(9 / 22);
    expect(detail.signals).toHaveLength(1);
    expect(
      detail.wonProcesses.every(
        (process) => process.entidad_id === detail.entity.id,
      ),
    ).toBe(true);
    const other = (await loadSupplierDetail(source, "P0003", "entidad-0002"))!;
    expect(other.signals).toHaveLength(0);
    expect(
      other.wonProcesses.every(
        (process) => process.entidad_id === other.entity.id,
      ),
    ).toBe(true);
  });

  it("devuelve null para proveedores o entidades desconocidos", async () => {
    expect(
      await loadSupplierDetail(source, "no-existe", "entidad-0001"),
    ).toBeNull();
    expect(await loadSupplierDetail(source, "P0003", "no-existe")).toBeNull();
  });

  it.each(["publico", "local"] as const)(
    "proyecta la identidad antes de devolver la ficha en modo %s",
    async (mode) => {
      const manifest = await source.getManifest();
      const original = (await source.getSupplier("P0003"))!;
      const privateSupplier: Proveedor = {
        ...original,
        tipo: "persona_natural",
        nombre: "Nombre privado de prueba",
        ruc: "10999999999",
        url_ficha_unica: "https://ejemplo.gob.pe/proveedor/10999999999",
      };
      const customized = Object.create(source) as DataSource;
      customized.getSupplier = async () => privateSupplier;
      customized.getManifest = async () =>
        ({ ...manifest, modo: mode }) satisfies Manifest;
      const detail = (await loadSupplierDetail(
        customized,
        "P0003",
        "entidad-0001",
      ))!;
      expect(detail.identity.displayName).toBe(original.alias);
      expect(JSON.stringify(detail)).not.toContain(privateSupplier.nombre);
      if (mode === "publico") {
        expect(JSON.stringify(detail)).not.toContain(privateSupplier.ruc);
        expect(detail.identity.profileUrl).toBeNull();
      }
    },
  );

  it("separa monedas, conserva montos ausentes y advierte adjudicaciones compartidas", async () => {
    const customized = Object.create(source) as DataSource;
    const [process] = await source.listProcesses("entidad-0001");
    customized.listProcesses = async () => [
      {
        ...process,
        ocid: "a",
        ganadores: ["P0003", "P0001"],
        moneda: "PEN",
        monto_adjudicado: 100,
      },
      {
        ...process,
        ocid: "b",
        ganadores: ["P0003"],
        moneda: "USD",
        monto_adjudicado: 20,
      },
      {
        ...process,
        ocid: "c",
        ganadores: ["P0003"],
        moneda: "PEN",
        monto_adjudicado: null,
      },
    ];
    const detail = (await loadSupplierDetail(
      customized,
      "P0003",
      "entidad-0001",
    ))!;
    expect(detail.amounts).toEqual([
      { currency: "PEN", value: 100, missing: 1 },
      { currency: "USD", value: 20, missing: 0 },
    ]);
    expect(detail.sharedAwards).toBe(true);
    customized.listProcesses = async () => [];
    const empty = (await loadSupplierDetail(
      customized,
      "P0003",
      "entidad-0001",
    ))!;
    expect(empty.participation).toBeNull();
    expect(empty.amounts).toEqual([]);
  });
});
