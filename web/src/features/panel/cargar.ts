import "server-only";

import { cacheLife } from "next/cache";

import { getSupplierIdentity } from "@/features/fichas";
import { getDataSource } from "@/lib/data";

import { resumirPanel, type DatosPanel } from "./panel";

/** Datos del panel de una entidad, con los nombres de proveedores según el modo del paquete. */
export async function cargarDatosPanel(entidadId: string): Promise<DatosPanel | null> {
  "use cache";
  cacheLife("max");
  const fuente = getDataSource();
  const entidad = await fuente.getEntity(entidadId);
  if (!entidad) return null;
  const [procesos, senales, proveedores, manifest] = await Promise.all([
    fuente.listProcesses(entidadId),
    fuente.listSignals(entidadId),
    fuente.listSuppliers(),
    fuente.getManifest(),
  ]);
  const porId = new Map(proveedores.map((p) => [p.id, p]));
  return resumirPanel(entidad, procesos, senales, (id) => {
    const proveedor = porId.get(id);
    return proveedor ? getSupplierIdentity(proveedor, manifest.modo).displayName : id;
  });
}
