import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SinDatos } from "@/components/estado/sin-datos";
import { Skeleton } from "@/components/ui/skeleton";
import { loadSupplierPage } from "@/features/fichas/load-supplier";
import { SupplierView } from "@/features/fichas/ui/supplier-view";
import { getDataSource } from "@/lib/data";
import { cargarEntidades } from "@/lib/data/cached";
import { elegirEntidad, PARAM_ENTIDAD } from "@/lib/entidad";

export const metadata: Metadata = { title: "Ficha del proveedor" };

export async function generateStaticParams() {
  const [supplier] = await getDataSource().listSuppliers();
  return supplier ? [{ id: supplier.id }] : [];
}

export default function SupplierPage(props: PageProps<"/proveedores/[id]">) {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Cargando proveedor">
          <Skeleton className="h-64 rounded-tarjeta" />
        </div>
      }
    >
      <SupplierContent {...props} />
    </Suspense>
  );
}

async function SupplierContent({
  params,
  searchParams,
}: PageProps<"/proveedores/[id]">) {
  const [{ id }, query, entities] = await Promise.all([
    params,
    searchParams,
    cargarEntidades(),
  ]);
  const entity = elegirEntidad(entities, query[PARAM_ENTIDAD]);
  if (!entity)
    return (
      <SinDatos
        titulo="Sin datos de entidades"
        mensaje="El paquete no contiene entidades para consultar este proveedor."
      />
    );
  const detail = await loadSupplierPage(id, entity.id);
  if (!detail) notFound();
  return <SupplierView detail={detail} />;
}
