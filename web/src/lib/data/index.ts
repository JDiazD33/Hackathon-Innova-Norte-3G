import "server-only";

import path from "node:path";

import type { DataSource } from "./data-source";
import { StaticDataSource } from "./static-data-source";

export type { DataSource } from "./data-source";
export * from "./types";

/**
 * Paquetes de datos disponibles en `web/data/`:
 * - `fixture` (por defecto): datos ficticios para desarrollar y probar.
 * - `publico`: paquete real seudonimizado (despliegue).
 * - `local`: paquete real con nombres, solo para sesiones de validación. Nunca se sube.
 */
export const PAQUETES = ["fixture", "publico", "local"] as const;
export type NombrePaquete = (typeof PAQUETES)[number];
export const PAQUETE_POR_DEFECTO: NombrePaquete = "fixture";

type Entorno = Record<string, string | undefined>;

/** Lee la variable de entorno `PAQUETE_DATOS` y valida que sea un paquete conocido. */
export function resolvePaquete(env: Entorno = process.env): NombrePaquete {
  const valor = env.PAQUETE_DATOS?.trim() || PAQUETE_POR_DEFECTO;
  if (!(PAQUETES as readonly string[]).includes(valor)) {
    throw new Error(`PAQUETE_DATOS debe ser uno de: ${PAQUETES.join(", ")}. Se recibió: ${valor}`);
  }
  return valor as NombrePaquete;
}

/** Carpeta del paquete. Siempre queda dentro de `web/data/`, para no rastrear todo el proyecto al desplegar. */
export function resolveDataDir(env: Entorno = process.env): string {
  return path.join(process.cwd(), "data", resolvePaquete(env));
}

let instancia: { dir: string; source: DataSource } | null = null;

export function getDataSource(): DataSource {
  const dir = resolveDataDir();
  if (!instancia || instancia.dir !== dir) {
    instancia = { dir, source: new StaticDataSource(dir) };
  }
  return instancia.source;
}
