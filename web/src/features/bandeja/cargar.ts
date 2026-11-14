import "server-only";

import { cacheLife } from "next/cache";

import { getDataSource } from "@/lib/data";

import { construirFilas, opcionesDeFiltro, ordenarFilas, type FilaBandeja, type OpcionesFiltro } from "./bandeja";
import { construirIndice, type EntradaBusqueda } from "./busqueda";

export interface DatosBandeja {
  filas: FilaBandeja[];
  opciones: OpcionesFiltro;
}

/** Filas de la bandeja de una entidad, ya ordenadas por prioridad. */
export async function cargarBandeja(entidadId: string): Promise<DatosBandeja> {
  "use cache";
  cacheLife("max");
  const fuente = getDataSource();
  const [procesos, senales] = await Promise.all([fuente.listProcesses(entidadId), fuente.listSignals(entidadId)]);
  const filas = ordenarFilas(construirFilas(procesos, senales));
  return { filas, opciones: opcionesDeFiltro(filas) };
}

/** Índice del buscador de una entidad (procesos y proveedores que ganaron en ella). */
export async function cargarIndiceBusqueda(entidadId: string): Promise<EntradaBusqueda[]> {
  "use cache";
  cacheLife("max");
  const fuente = getDataSource();
  const [procesos, proveedores, manifest] = await Promise.all([
    fuente.listProcesses(entidadId),
    fuente.listSuppliers(),
    fuente.getManifest(),
  ]);
  return construirIndice(procesos, proveedores, manifest.modo);
}
