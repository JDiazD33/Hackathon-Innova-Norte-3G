"use client";

import { ChevronRight, Download, Inbox, SearchX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EstadoRevisionBadge } from "@/components/estado/estado-revision-badge";
import { PrioridadBadge } from "@/components/estado/prioridad-badge";
import { SinDatos } from "@/components/estado/sin-datos";
import { TituloDePagina } from "@/components/layout/titulo-de-pagina";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SIGNAL_METHODOLOGY } from "@/features/etica/metodologia";
import type { ReviewState } from "@/features/revision";
import { formatEntero, formatFecha, formatSoles } from "@/lib/format";
import { useRevisiones } from "@/lib/revisiones";

import { FILTROS_VACIOS, filtrarFilas, hayFiltrosActivos, type FilaBandeja, type FiltrosBandeja } from "../bandeja";
import type { DatosBandeja } from "../cargar";
import { filasACsv, nombreArchivoCsv } from "../exportar";
import { FiltrosDeBandeja } from "./filtros";

const hrefProceso = (ocid: string) => `/procesos/${encodeURIComponent(ocid)}`;

/**
 * Bandeja de señales (Lote B): un solo panel, como una grilla de trabajo. Arriba, la barra de filtros con
 * el conteo de resultados; debajo, los procesos. El panel es un contenedor (`@container/bandeja`): la forma
 * de mostrar los procesos depende de su ancho real, no del de la ventana.
 * - Desde 64rem: tabla completa, con las señales en su propia columna.
 * - Desde 42rem: la misma tabla, con las señales (y, hasta 56rem, la convocatoria) debajo del proceso.
 * - Más angosto (celular): filas apiladas.
 */
export function BandejaVista({ entidad, datos }: { entidad: { id: string; nombre: string }; datos: DatosBandeja }) {
  const { estadoDe } = useRevisiones();
  const [filtros, setFiltros] = useState<FiltrosBandeja>(FILTROS_VACIOS);
  const visibles = useMemo(() => filtrarFilas(datos.filas, filtros, estadoDe), [datos.filas, filtros, estadoDe]);
  const total = datos.filas.length;

  return (
    <div className="flex flex-col gap-5">
      <TituloDePagina
        titulo="Señales"
        descripcion={`Procesos de ${entidad.nombre} que ameritan revisión, ordenados por prioridad. Una señal no es una acusación: la decisión siempre es de una persona.`}
        acciones={
          total > 0 && (
            <Button
              variant="outline"
              disabled={visibles.length === 0}
              onClick={() => descargarCsv(filasACsv(visibles, estadoDe, entidad.nombre), nombreArchivoCsv(entidad.id))}
            >
              <Download aria-hidden="true" />
              Exportar CSV
            </Button>
          )
        }
      />

      {total === 0 ? (
        <SinDatos
          icono={Inbox}
          titulo="Sin señales en el periodo"
          mensaje="Esta entidad no tiene procesos con señales en el periodo del paquete de datos."
        />
      ) : (
        // overflow-clip (no hidden): recorta las esquinas sin crear un área de desplazamiento, así los filtros
        // y la cabecera de la tabla pueden quedar fijos al desplazarse.
        <section
          aria-label="Procesos con señales"
          className="@container/bandeja overflow-clip rounded-tarjeta border border-border bg-card text-card-foreground contrast-more:border-borde-contraste"
        >
          <FiltrosDeBandeja
            opciones={datos.opciones}
            filtros={filtros}
            onChange={setFiltros}
            resumen={
              <p aria-live="polite">
                {hayFiltrosActivos(filtros)
                  ? `Mostrando ${formatEntero(visibles.length)} de ${formatEntero(total)} procesos con señales.`
                  : `${formatEntero(total)} ${total === 1 ? "proceso con señales" : "procesos con señales"}.`}
              </p>
            }
          />

          {visibles.length === 0 ? (
            <SinDatos
              plano
              icono={SearchX}
              titulo="Sin resultados"
              mensaje="Ningún proceso coincide con los filtros. Prueba con otra combinación."
              accion={
                <Button variant="outline" onClick={() => setFiltros(FILTROS_VACIOS)}>
                  Limpiar filtros
                </Button>
              }
            />
          ) : (
            <>
              <TablaBandeja filas={visibles} estadoDe={estadoDe} entidad={entidad.nombre} />
              <ListaBandeja filas={visibles} estadoDe={estadoDe} />
            </>
          )}
        </section>
      )}
    </div>
  );
}

/**
 * Descarga el CSV de los procesos visibles (con los filtros aplicados). Se arma en el navegador, así que
 * funciona sin internet y no envía datos a ningún servidor. Se abre en Excel, Power BI y Google Sheets.
 */
function descargarCsv(contenido: string, nombre: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

/**
 * Tabla de la bandeja (desde 42rem de ancho del panel). La cabecera queda fija bajo la barra de filtros.
 * La columna "Señales" solo existe desde 64rem y la de "Convocatoria" desde 56rem; antes, van debajo del
 * proceso para que su descripción no quede en una columna angosta.
 */
function TablaBandeja({
  filas,
  estadoDe,
  entidad,
}: {
  filas: FilaBandeja[];
  estadoDe: (ocid: string) => ReviewState;
  entidad: string;
}) {
  return (
    <div className="hidden @2xl/bandeja:block [&_[data-slot=table-container]]:overflow-visible">
      <Table className="table-fixed">
        <TableCaption className="sr-only">
          Procesos con señales de {entidad}, ordenados por prioridad de revisión
        </TableCaption>
        {/* El borde inferior va como sombra interior de cada celda: un borde de fila no acompaña a la cabecera fija. */}
        <TableHeader className="[&_th]:sticky [&_th]:top-[calc(var(--alto-cabecera)+var(--alto-filtros))] [&_th]:z-10 [&_th]:shadow-[inset_0_-1px_0_var(--border)] [&_tr]:border-b-0">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-24 ps-4">Prioridad</TableHead>
            <TableHead>Proceso</TableHead>
            <TableHead className="hidden w-[30%] @5xl/bandeja:table-cell">Señales</TableHead>
            <TableHead className="hidden w-28 @4xl/bandeja:table-cell">Convocatoria</TableHead>
            <TableHead className="w-36 text-right">Monto referencial</TableHead>
            <TableHead className="w-44 ps-6 pe-4">Revisión</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((fila) => (
            <TableRow key={fila.ocid}>
              <TableCell className="ps-4 align-top">
                <PrioridadBadge prioridad={fila.prioridad} />
              </TableCell>
              <TableCell className="align-top whitespace-normal">
                <Link
                  href={hrefProceso(fila.ocid)}
                  title={fila.descripcion}
                  className="line-clamp-2 rounded-sm font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {fila.descripcion}
                </Link>
                <Identificacion fila={fila} />
                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums @4xl/bandeja:hidden">
                  Convocatoria: {formatFecha(fila.fechaConvocatoria)}
                </p>
                <div className="mt-2 @5xl/bandeja:hidden">
                  <ListaDeSenales senales={fila.senales} />
                </div>
              </TableCell>
              <TableCell className="hidden align-top whitespace-normal @5xl/bandeja:table-cell">
                <ListaDeSenales senales={fila.senales} />
              </TableCell>
              <TableCell className="hidden align-top @4xl/bandeja:table-cell">
                {formatFecha(fila.fechaConvocatoria)}
              </TableCell>
              <TableCell className="text-right align-top">{formatSoles(fila.montoReferencial)}</TableCell>
              <TableCell className="ps-6 pe-4 align-top">
                <EstadoRevisionBadge estado={estadoDe(fila.ocid)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Celular: filas apiladas. Toda la fila abre la ficha (el enlace del título se extiende sobre ella); las
 * insignias quedan por encima para que el desglose de la prioridad siga accesible.
 */
function ListaBandeja({ filas, estadoDe }: { filas: FilaBandeja[]; estadoDe: (ocid: string) => ReviewState }) {
  return (
    <ul className="flex flex-col @2xl/bandeja:hidden">
      {filas.map((fila) => (
        <li
          key={fila.ocid}
          className="relative flex items-start gap-3 border-t border-separador px-4 py-3 transition-colors duration-150 ease-prisma first:border-t-0 hover:bg-muted has-[a:focus-visible]:bg-muted"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="relative z-10 flex flex-wrap items-center gap-2">
              <PrioridadBadge prioridad={fila.prioridad} />
              <EstadoRevisionBadge estado={estadoDe(fila.ocid)} />
            </div>
            <Link
              href={hrefProceso(fila.ocid)}
              className="text-encabezado outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
            >
              {fila.descripcion}
            </Link>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatFecha(fila.fechaConvocatoria)} · {formatSoles(fila.montoReferencial)}
            </p>
            <Identificacion fila={fila} />
            <ListaDeSenales senales={fila.senales} />
          </div>
          <ChevronRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        </li>
      ))}
    </ul>
  );
}

/**
 * Cómo se identifica el proceso: el método y la nomenclatura del SEACE, que es como lo conoce quien revisa
 * contrataciones. Los paquetes 1.0 no la traen: ahí se muestra el ocid. Si no caben en una línea, el código
 * baja a la siguiente entero, sin cortarse.
 */
function Identificacion({ fila }: { fila: FilaBandeja }) {
  return (
    <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
      <span>{fila.metodo}</span>
      <span className="font-mono">{fila.nomenclatura ?? fila.ocid}</span>
    </p>
  );
}

/**
 * Señales del proceso como lista tipográfica: una línea por señal, con el código en monoespaciada y el
 * nombre al lado, agrupadas por un filete fino. Sin cápsulas: en la fila ya hay dos insignias (prioridad
 * y revisión) y las señales se leen mejor como texto.
 */
function ListaDeSenales({ senales }: { senales: FilaBandeja["senales"] }) {
  return (
    <ul className="flex flex-col gap-1 border-s border-border ps-3" aria-label="Señales del proceso">
      {senales.map((senal) => (
        <li key={senal.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-2.5 text-sm">
          <span className="font-mono text-xs text-muted-foreground">{senal.codigo}</span>
          <span>
            {SIGNAL_METHODOLOGY[senal.codigo].name}
            {senal.simulado && <span className="text-muted-foreground"> · dato simulado</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
