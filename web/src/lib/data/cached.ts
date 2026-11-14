import "server-only";

import { cacheLife } from "next/cache";

import type { EntidadResumen } from "@/lib/entidad";

import { getDataSource } from "./index";

/*
 * Lecturas cacheadas del paquete de datos para las pantallas. El paquete solo cambia
 * cuando se regenera, por eso usan cacheLife("max") (ver la guía de Cache Components
 * en node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md).
 */

export async function cargarManifest() {
  "use cache";
  cacheLife("max");
  return getDataSource().getManifest();
}

export async function cargarEntidades(): Promise<EntidadResumen[]> {
  "use cache";
  cacheLife("max");
  const entidades = await getDataSource().listEntities();
  return entidades
    .map((e) => ({
      id: e.id,
      nombre: e.nombre,
      tipo: e.tipo,
      procesos: e.resumen.procesos,
      procesosConSenales: e.resumen.procesos_con_senales,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
