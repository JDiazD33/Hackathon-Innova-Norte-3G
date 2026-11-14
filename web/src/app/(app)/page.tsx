import type { Metadata } from "next";
import { Suspense } from "react";

import { SinDatos } from "@/components/estado/sin-datos";
import { cargarDatosPanel } from "@/features/panel/cargar";
import { PanelCargando } from "@/features/panel/ui/panel-cargando";
import { PanelVista } from "@/features/panel/ui/panel-vista";
import { cargarEntidades } from "@/lib/data/cached";
import { elegirEntidad, PARAM_ENTIDAD } from "@/lib/entidad";

export const metadata: Metadata = { title: "Panel" };

/** La entidad viene en la URL; esa parte se resuelve dentro de <Suspense> (Cache Components). */
export default function PaginaPanel({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<PanelCargando />}>
      <Panel searchParams={searchParams} />
    </Suspense>
  );
}

async function Panel({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const [parametros, entidades] = await Promise.all([searchParams, cargarEntidades()]);
  const entidad = elegirEntidad(entidades, parametros[PARAM_ENTIDAD]);
  const datos = entidad ? await cargarDatosPanel(entidad.id) : null;
  if (!datos) return <SinDatos mensaje="El paquete de datos no tiene entidades para mostrar." />;
  return <PanelVista datos={datos} />;
}
