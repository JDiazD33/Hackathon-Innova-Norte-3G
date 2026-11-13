import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

import type { Entidad, Expediente, Indice, Manifest, Proceso, Proveedor, Senal } from "./types";

/**
 * Prueba de contrato del paquete de datos (v1). Por defecto revisa el fixture.
 * El Lote A la usa para validar el paquete real antes de entregarlo:
 *   PAQUETE_DIR=data/publico npm test -- paquete
 */
const WEB_DIR = fileURLToPath(new URL("../../../", import.meta.url));
const PAQUETE_DIR = path.resolve(WEB_DIR, process.env.PAQUETE_DIR ?? "data/fixture");
const SCHEMA_PATH = path.resolve(WEB_DIR, "../contracts/paquete-de-datos.schema.json");

function leer<T>(relativo: string): T {
  return JSON.parse(readFileSync(path.join(PAQUETE_DIR, relativo), "utf8")) as T;
}

function listar(carpeta: string): string[] {
  return readdirSync(path.join(PAQUETE_DIR, carpeta))
    .filter((archivo) => archivo.endsWith(".json"))
    .sort()
    .map((archivo) => `${carpeta}/${archivo}`);
}

const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8")) as { $id: string };
const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
addFormats(ajv);
ajv.addSchema(schema);

function erroresDe(definicion: string, datos: unknown): string[] {
  const validate = ajv.getSchema(`${schema.$id}#/$defs/${definicion}`);
  if (!validate) throw new Error(`El schema no define ${definicion}`);
  return validate(datos) ? [] : (validate.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);
}

describe(`contrato del paquete de datos (${path.relative(WEB_DIR, PAQUETE_DIR)})`, () => {
  const manifest = leer<Manifest>("manifest.json");
  const entidades = leer<Entidad[]>("entidades.json");
  const archivosProcesos = listar("procesos");
  const archivosSenales = listar("senales");
  const procesos = archivosProcesos.flatMap((archivo) => leer<Proceso[]>(archivo));
  const senales = archivosSenales.flatMap((archivo) => leer<Senal[]>(archivo));
  const proveedores = leer<Proveedor[]>("proveedores.json");
  const expedientes = leer<Expediente[]>("expedientes-simulados.json");
  const indice = leer<Indice>("indice.json");
  const senalPorId = new Map(senales.map((senal) => [senal.id, senal]));

  it("cada archivo valida contra el JSON Schema", () => {
    expect(erroresDe("manifest", manifest)).toEqual([]);
    expect(erroresDe("entidades", entidades)).toEqual([]);
    for (const archivo of archivosProcesos) expect(erroresDe("procesos", leer(archivo)), archivo).toEqual([]);
    for (const archivo of archivosSenales) expect(erroresDe("senales", leer(archivo)), archivo).toEqual([]);
    expect(erroresDe("proveedores", proveedores)).toEqual([]);
    expect(erroresDe("expedientes", expedientes)).toEqual([]);
    expect(erroresDe("indice", indice)).toEqual([]);
  });

  it("los conteos del manifiesto coinciden con los archivos", () => {
    expect(manifest.conteos).toEqual({
      procesos: procesos.length,
      senales: senales.length,
      proveedores: proveedores.length,
      entidades: entidades.length,
    });
  });

  it("cada proceso pertenece a la entidad de su archivo y figura en el índice", () => {
    for (const archivo of archivosProcesos) {
      const entidadId = path.basename(archivo, ".json");
      expect(entidades.some((entidad) => entidad.id === entidadId), archivo).toBe(true);
      for (const proceso of leer<Proceso[]>(archivo)) {
        expect(proceso.entidad_id, proceso.ocid).toBe(entidadId);
        expect(indice.procesos[proceso.ocid], proceso.ocid).toBe(entidadId);
      }
    }
  });

  it("las señales que cita un proceso existen y lo incluyen", () => {
    for (const proceso of procesos) {
      for (const id of proceso.senales) {
        const senal = senalPorId.get(id);
        expect(senal, `${proceso.ocid} cita ${id}`).toBeDefined();
        expect(senal?.ocids, id).toContain(proceso.ocid);
      }
    }
  });

  it("la prioridad es la suma de los pesos del manifiesto y respeta los cortes", () => {
    const { pesos, cortes } = manifest.prioridad;
    for (const proceso of procesos) {
      if (proceso.senales.length === 0) {
        expect(proceso.prioridad, proceso.ocid).toBeNull();
        continue;
      }
      const esperado = proceso.senales.reduce((total, id) => total + (pesos[senalPorId.get(id)!.codigo] ?? 0), 0);
      const nivel = esperado >= cortes.alta ? "alta" : esperado >= cortes.media ? "media" : "baja";
      expect(proceso.prioridad?.puntaje, proceso.ocid).toBe(esperado);
      expect(proceso.prioridad?.desglose.reduce((total, d) => total + d.peso, 0), proceso.ocid).toBe(esperado);
      expect(proceso.prioridad?.nivel, proceso.ocid).toBe(nivel);
    }
  });

  it("las señales de nivel entidad figuran en su entidad y no suman a ningún proceso", () => {
    for (const senal of senales.filter((s) => s.nivel === "entidad")) {
      const entidad = entidades.find((e) => e.id === senal.objeto.id);
      expect(entidad?.senales_entidad, senal.id).toContain(senal.id);
      expect(procesos.some((p) => p.senales.includes(senal.id)), senal.id).toBe(false);
    }
  });

  it("en modo público ningún proveedor se puede identificar", () => {
    if (manifest.modo !== "publico") return;
    for (const proveedor of proveedores) {
      expect(proveedor.nombre, proveedor.id).toBeNull();
      expect(proveedor.ruc, proveedor.id).toBeNull();
      expect(proveedor.url_ficha_unica, proveedor.id).toBeNull();
    }
    const todo = [
      "manifest.json",
      "entidades.json",
      "proveedores.json",
      "expedientes-simulados.json",
      "indice.json",
      ...archivosProcesos,
      ...archivosSenales,
    ]
      .map((archivo) => readFileSync(path.join(PAQUETE_DIR, archivo), "utf8"))
      .join("\n");
    expect(todo, "el paquete público contiene algo con forma de RUC").not.toMatch(/\b(10|15|17|20)\d{9}\b/);
  });

  it("las personas naturales nunca muestran su nombre", () => {
    for (const proveedor of proveedores.filter((p) => p.tipo === "persona_natural")) {
      expect(proveedor.nombre, proveedor.id).toBeNull();
    }
  });

  it("los expedientes y las señales S08 están marcados como simulados", () => {
    for (const expediente of expedientes) expect(expediente.simulado, expediente.ocid).toBe(true);
    for (const senal of senales.filter((s) => s.codigo === "S08")) expect(senal.simulado, senal.id).toBe(true);
  });

  it("todas las señales presentes figuran como activas en el manifiesto", () => {
    for (const codigo of new Set(senales.map((s) => s.codigo))) {
      expect(manifest.senales_activas, codigo).toContain(codigo);
    }
  });
});
