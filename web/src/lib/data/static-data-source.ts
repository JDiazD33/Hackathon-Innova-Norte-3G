import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import type { DataSource } from "./data-source";
import {
  esIdSeguro,
  type Entidad,
  type Expediente,
  type Indice,
  type Manifest,
  type Proceso,
  type Proveedor,
  type Senal,
} from "./types";

/**
 * Lee el paquete de datos (contrato v1) desde una carpeta del disco.
 * Solo se usa en el servidor. Los ids que llegan de una URL se validan antes de
 * usarlos en una ruta de archivo.
 */
export class StaticDataSource implements DataSource {
  private readonly cache = new Map<string, Promise<unknown>>();

  constructor(private readonly dataDir: string) {}

  private readJson<T>(relativePath: string, optional: boolean): Promise<T | null> {
    const key = relativePath;
    const cached = this.cache.get(key);
    if (cached) return cached as Promise<T | null>;

    const promise = readFile(path.join(this.dataDir, relativePath), "utf8")
      .then((text) => JSON.parse(text) as T)
      .catch((error: NodeJS.ErrnoException) => {
        if (optional && error.code === "ENOENT") return null;
        throw new Error(`No se pudo leer ${relativePath} del paquete de datos en ${this.dataDir}: ${error.message}`);
      });
    this.cache.set(key, promise);
    return promise;
  }

  private async indice(): Promise<Indice> {
    return (await this.readJson<Indice>("indice.json", false)) as Indice;
  }

  async getManifest(): Promise<Manifest> {
    return (await this.readJson<Manifest>("manifest.json", false)) as Manifest;
  }

  async listEntities(): Promise<Entidad[]> {
    return (await this.readJson<Entidad[]>("entidades.json", false)) ?? [];
  }

  async getEntity(entidadId: string): Promise<Entidad | null> {
    if (!esIdSeguro(entidadId)) return null;
    const entidades = await this.listEntities();
    return entidades.find((entidad) => entidad.id === entidadId) ?? null;
  }

  async listProcesses(entidadId: string): Promise<Proceso[]> {
    if (!esIdSeguro(entidadId)) return [];
    return (await this.readJson<Proceso[]>(`procesos/${entidadId}.json`, true)) ?? [];
  }

  async listSignals(entidadId: string): Promise<Senal[]> {
    if (!esIdSeguro(entidadId)) return [];
    return (await this.readJson<Senal[]>(`senales/${entidadId}.json`, true)) ?? [];
  }

  async getProcess(ocid: string): Promise<Proceso | null> {
    if (!esIdSeguro(ocid)) return null;
    const entidadId = (await this.indice()).procesos[ocid];
    if (!entidadId) return null;
    const procesos = await this.listProcesses(entidadId);
    return procesos.find((proceso) => proceso.ocid === ocid) ?? null;
  }

  async getSignalsForProcess(ocid: string): Promise<Senal[]> {
    const proceso = await this.getProcess(ocid);
    if (!proceso) return [];
    const senales = await this.listSignals(proceso.entidad_id);
    const porId = new Map(senales.map((senal) => [senal.id, senal]));
    return proceso.senales.flatMap((id) => {
      const senal = porId.get(id);
      return senal ? [senal] : [];
    });
  }

  async listSuppliers(): Promise<Proveedor[]> {
    return (await this.readJson<Proveedor[]>("proveedores.json", false)) ?? [];
  }

  async getSupplier(proveedorId: string): Promise<Proveedor | null> {
    if (!esIdSeguro(proveedorId)) return null;
    const proveedores = await this.listSuppliers();
    return proveedores.find((proveedor) => proveedor.id === proveedorId) ?? null;
  }

  async getExpediente(ocid: string): Promise<Expediente | null> {
    if (!esIdSeguro(ocid)) return null;
    const expedientes = (await this.readJson<Expediente[]>("expedientes-simulados.json", true)) ?? [];
    return expedientes.find((expediente) => expediente.ocid === ocid) ?? null;
  }
}
