import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { resolveDataDir } from "./index";
import { StaticDataSource } from "./static-data-source";

const FIXTURE_DIR = fileURLToPath(new URL("../../../data/fixture", import.meta.url));
const fuente = new StaticDataSource(FIXTURE_DIR);

describe("StaticDataSource sobre el fixture", () => {
  it("lee el manifiesto", async () => {
    const manifest = await fuente.getManifest();
    expect(manifest.version_contrato).toBe("1.0");
    expect(manifest.modo).toBe("publico");
  });

  it("lista las entidades y busca una por id", async () => {
    expect(await fuente.listEntities()).toHaveLength(2);
    expect((await fuente.getEntity("entidad-0001"))?.nombre).toBe("Universidad Pública Ficticia del Norte");
    expect(await fuente.getEntity("entidad-9999")).toBeNull();
  });

  it("lista procesos y señales por entidad", async () => {
    expect(await fuente.listProcesses("entidad-0001")).toHaveLength(22);
    expect(await fuente.listProcesses("entidad-0002")).toHaveLength(18);
    expect(await fuente.listProcesses("entidad-9999")).toEqual([]);
    expect((await fuente.listSignals("entidad-0002")).some((s) => s.codigo === "S05")).toBe(true);
  });

  it("encuentra un proceso por ocid, con sus señales en orden y su prioridad", async () => {
    const proceso = await fuente.getProcess("ocds-fixture-e1-003");
    expect(proceso?.entidad_id).toBe("entidad-0001");
    expect(proceso?.prioridad).toMatchObject({ puntaje: 8, nivel: "alta" });
    const senales = await fuente.getSignalsForProcess("ocds-fixture-e1-003");
    expect(senales.map((s) => s.codigo)).toEqual(["S01", "S02", "S03"]);
  });

  it("devuelve null o listas vacías ante ids desconocidos o inseguros", async () => {
    expect(await fuente.getProcess("ocds-no-existe")).toBeNull();
    expect(await fuente.getProcess("../manifest")).toBeNull();
    expect(await fuente.listProcesses("../entidades")).toEqual([]);
    expect(await fuente.getSignalsForProcess("ocds-no-existe")).toEqual([]);
    expect(await fuente.getSupplier("../proveedores")).toBeNull();
  });

  it("lee proveedores y expedientes simulados", async () => {
    expect((await fuente.getSupplier("P0003"))?.alias).toBe("Proveedor 0003");
    expect((await fuente.getSupplier("P0007"))?.tipo).toBe("persona_natural");
    const expediente = await fuente.getExpediente("ocds-fixture-e1-007");
    expect(expediente?.simulado).toBe(true);
    expect(expediente?.etapas).toHaveLength(4);
    expect(await fuente.getExpediente("ocds-fixture-e1-002")).toBeNull();
  });

  it("falla con un mensaje claro si falta un archivo obligatorio", async () => {
    const sinPaquete = new StaticDataSource(path.join(FIXTURE_DIR, "no-existe"));
    await expect(sinPaquete.getManifest()).rejects.toThrow(/manifest\.json/);
  });
});

describe("resolveDataDir", () => {
  it("usa el fixture por defecto y respeta PAQUETE_DATOS", () => {
    expect(resolveDataDir({})).toBe(path.join(process.cwd(), "data", "fixture"));
    expect(resolveDataDir({ PAQUETE_DATOS: "publico" })).toBe(path.join(process.cwd(), "data", "publico"));
  });

  it("rechaza paquetes desconocidos o rutas", () => {
    expect(() => resolveDataDir({ PAQUETE_DATOS: "../secretos" })).toThrow(/PAQUETE_DATOS/);
    expect(() => resolveDataDir({ PAQUETE_DATOS: "otro" })).toThrow(/fixture, publico, local/);
  });
});
