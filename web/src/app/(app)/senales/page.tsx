import type { Metadata } from "next";
import { Suspense } from "react";

import { SinDatos } from "@/components/estado/sin-datos";
import { cargarBandeja } from "@/features/bandeja/cargar";
import { BandejaCargando } from "@/features/bandeja/ui/bandeja-cargando";
import { BandejaVista } from "@/features/bandeja/ui/bandeja-vista";
import { cargarEntidades } from "@/lib/data/cached";
import { elegirEntidad, PARAM_ENTIDAD } from "@/lib/entidad";

export const metadata: Metadata = { title: "Señales" };

export default function PaginaSenales({ searchParams }: PageProps<"/senales">) {
  return (
    <Suspense fallback={<BandejaCargando />}>
      <Bandeja searchParams={searchParams} />
    </Suspense>
  );
}

async function Bandeja({ searchParams }: Pick<PageProps<"/senales">, "searchParams">) {
  const [parametros, entidades] = await Promise.all([searchParams, cargarEntidades()]);
  const entidad = elegirEntidad(entidades, parametros[PARAM_ENTIDAD]);
  if (!entidad) return <SinDatos mensaje="El paquete de datos no tiene entidades para mostrar." />;
  const datos = await cargarBandeja(entidad.id);
  return <BandejaVista entidad={{ id: entidad.id, nombre: entidad.nombre }} datos={datos} />;
}
