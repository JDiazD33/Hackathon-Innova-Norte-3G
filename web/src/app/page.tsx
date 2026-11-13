import { cacheLife } from "next/cache";

import { producto } from "@/config/producto";
import { getDataSource } from "@/lib/data";
import { formatEntero, formatFecha } from "@/lib/format";

/**
 * Página provisional de la Fase 0: comprueba que el paquete de datos se lee dentro de
 * Next.js. El Lote B la reemplaza por el panel de la entidad en la fase de interfaz.
 */
async function resumenDelPaquete() {
  "use cache";
  // El paquete solo cambia cuando se regenera; ver docs de Next: cacheLife.
  cacheLife("max");
  const fuente = getDataSource();
  const [manifest, entidades] = await Promise.all([fuente.getManifest(), fuente.listEntities()]);
  return { manifest, entidades };
}

export default async function Home() {
  const { manifest, entidades } = await resumenDelPaquete();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">{producto.nombre}</h1>
        <p className="text-lg">{producto.descripcion}</p>
        <p>
          Base técnica lista. Las pantallas se construyen en la fase de interfaz (lotes B, C y D).
        </p>
      </header>

      <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
        <dt className="font-medium">Paquete de datos</dt>
        <dd>{manifest.fuente.nombre}</dd>
        <dt className="font-medium">Datos al</dt>
        <dd>{formatFecha(manifest.fecha_corte)}</dd>
        <dt className="font-medium">Procesos</dt>
        <dd>{formatEntero(manifest.conteos.procesos)}</dd>
        <dt className="font-medium">Señales</dt>
        <dd>{formatEntero(manifest.conteos.senales)}</dd>
        <dt className="font-medium">Entidades</dt>
        <dd>{entidades.map((entidad) => entidad.nombre).join(" · ")}</dd>
      </dl>

      <p className="text-sm">{manifest.atribucion}</p>
    </main>
  );
}
