import type { DataSource } from "@/lib/data/data-source";
import type { Entidad, Manifest, Proceso, Senal } from "@/lib/data/types";

import {
  getSupplierIdentity,
  type SupplierIdentity,
} from "./supplier-identity";

export interface SupplierDetail {
  identity: SupplierIdentity;
  entity: Pick<Entidad, "id" | "nombre">;
  manifest: Manifest;
  wonProcesses: Proceso[];
  awardedProcesses: number;
  participation: number | null;
  amounts: { currency: string; value: number | null; missing: number }[];
  sharedAwards: boolean;
  signals: Senal[];
}

/** La identidad se proyecta en el servidor, antes de devolver los datos de presentación. */
export async function loadSupplierDetail(
  source: DataSource,
  supplierId: string,
  entityId: string,
): Promise<SupplierDetail | null> {
  const supplier = await source.getSupplier(supplierId);
  if (!supplier) return null;
  const [entity, manifest, processes, signals] = await Promise.all([
    source.getEntity(entityId),
    source.getManifest(),
    source.listProcesses(entityId),
    source.listSignals(entityId),
  ]);
  if (!entity) return null;
  const awarded = processes.filter((process) => process.ganadores.length > 0);
  const won = awarded.filter((process) =>
    process.ganadores.includes(supplierId),
  );
  const amounts = new Map<
    string,
    { currency: string; value: number | null; missing: number }
  >();
  for (const process of won) {
    const group = amounts.get(process.moneda) ?? {
      currency: process.moneda,
      value: null,
      missing: 0,
    };
    if (
      process.monto_adjudicado != null &&
      Number.isFinite(process.monto_adjudicado)
    )
      group.value = (group.value ?? 0) + process.monto_adjudicado;
    else group.missing++;
    amounts.set(process.moneda, group);
  }
  return {
    identity: getSupplierIdentity(supplier, manifest.modo),
    entity: { id: entity.id, nombre: entity.nombre },
    manifest,
    wonProcesses: [...won].sort((a, b) =>
      (b.fechas.adjudicacion ?? "").localeCompare(a.fechas.adjudicacion ?? ""),
    ),
    awardedProcesses: awarded.length,
    participation: awarded.length > 0 ? won.length / awarded.length : null,
    amounts: [...amounts.values()],
    sharedAwards: won.some((process) => process.ganadores.length > 1),
    signals: signals.filter(
      (signal) =>
        signal.codigo === "S03" &&
        signal.objeto.tipo === "proveedor" &&
        signal.objeto.id === supplierId,
    ),
  };
}
