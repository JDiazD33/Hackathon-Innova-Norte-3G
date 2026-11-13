import type { Entidad, Expediente, Manifest, Proceso, Proveedor, Senal } from "./types";

/**
 * Única puerta de lectura de datos para las pantallas (Lote B; la usan C y D).
 * En el MVP la implementa StaticDataSource sobre el paquete de datos en disco.
 * Una ApiDataSource futura debe cumplir la misma interfaz.
 */
export interface DataSource {
  getManifest(): Promise<Manifest>;
  listEntities(): Promise<Entidad[]>;
  getEntity(entidadId: string): Promise<Entidad | null>;
  /** Procesos de una entidad. Devuelve [] si la entidad no existe. */
  listProcesses(entidadId: string): Promise<Proceso[]>;
  /** Señales de una entidad, incluidas las de nivel entidad (S05). Devuelve [] si no existe. */
  listSignals(entidadId: string): Promise<Senal[]>;
  getProcess(ocid: string): Promise<Proceso | null>;
  /** Señales que afectan a un proceso, en el orden de su lista `senales`. */
  getSignalsForProcess(ocid: string): Promise<Senal[]>;
  listSuppliers(): Promise<Proveedor[]>;
  getSupplier(proveedorId: string): Promise<Proveedor | null>;
  /** Expediente interno simulado del proceso, si existe. */
  getExpediente(ocid: string): Promise<Expediente | null>;
}
