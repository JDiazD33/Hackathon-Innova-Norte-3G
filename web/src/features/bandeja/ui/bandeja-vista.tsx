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
import { cn } from "@/lib/utils";

import { FILTROS_VACIOS, filtrarFilas, hayFiltrosActivos, type FilaBandeja, type FiltrosBandeja } from "../bandeja";
import type { DatosBandeja } from "../cargar";
import { filasACsv, nombreArchivoCsv } from "../exportar";
import { FiltrosDeBandeja } from "./filtros";

const hrefProceso = (ocid: string) => `/procesos/${encodeURIComponent(ocid)}`;

/** Superficie sólida de la lista y la tabla (el contenido nunca va en vidrio). */
const CLASE_SUPERFICIE = "rounded-tarjeta bg-card text-card-foreground shadow-tarjeta dark:ring-1 dark:ring-border contrast-more:ring-1 contrast-more:ring-borde-contraste";

/**
 * Bandeja de señales (Lote B · parte 6): barra de filtros fija en vidrio y, debajo, los procesos en estilo
 * lista: tabla en escritorio ancho y filas con chevron en tablet y celular.
 */
export function BandejaVista({ entidad, datos }: { entidad: { id: string; nombre: string }; datos: DatosBandeja }) {
  const { estadoDe } = useRevisiones();
  const [filtros, setFiltros] = useState<FiltrosBandeja>(FILTROS_VACIOS);
  const visibles = useMemo(() => filtrarFilas(datos.filas, filtros, estadoDe), [datos.filas, filtros, estadoDe]);
  const total = datos.filas.length;

  return (
    <div className="flex flex-col gap-6">
      <TituloDePagina
        titulo="Señales"
        descripcion={`Procesos de ${entidad.nombre} que ameritan revisión, ordenados por prioridad. Una señal no es una acusación: la decisión siempre es de una persona.`}
        acciones={
          total > 0 && (
            <Button
              variant="secondary"
              disabled={visibles.length === 0}
              onClick={() => descargarCsv(filasACsv(visibles, estadoDe, entidad.nombre), nombreArchivoCsv(entidad.id))}
            >
              <Download aria-hidden="true" />
              Exportar CSV
            </Button>
          )
        }
      />

      {total > 0 && <FiltrosDeBandeja opciones={datos.opciones} filtros={filtros} onChange={setFiltros} />}

      <p aria-live="polite" className="px-1 text-sm text-muted-foreground">
        {hayFiltrosActivos(filtros)
          ? `Mostrando ${formatEntero(visibles.length)} de ${formatEntero(total)} procesos con señales.`
          : `${formatEntero(total)} ${total === 1 ? "proceso con señales" : "procesos con señales"}.`}
      </p>

      {total === 0 ? (
        <SinDatos
          icono={Inbox}
          titulo="Sin señales en el periodo"
          mensaje="Esta entidad no tiene procesos con señales en el periodo del paquete de datos."
        />
      ) : visibles.length === 0 ? (
        <SinDatos
          icono={SearchX}
          titulo="Sin resultados"
          mensaje="Ningún proceso coincide con los filtros. Prueba con otra combinación."
          accion={
            <Button variant="secondary" onClick={() => setFiltros(FILTROS_VACIOS)}>
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

/** Escritorio ancho: tabla en estilo lista, con la cabecera fija bajo la barra de filtros. */
function TablaBandeja({
  filas,
  estadoDe,
  entidad,
}: {
  filas: FilaBandeja[];
  estadoDe: (ocid: string) => ReviewState;
  entidad: string;
}) {
  // overflow-clip (no hidden) para que la cabecera pueda quedar fija al desplazarse.
  return (
    <div className={cn(CLASE_SUPERFICIE, "hidden overflow-clip xl:block [&_[data-slot=table-container]]:overflow-visible")}>
      <Table className="table-fixed">
        <TableCaption className="sr-only">
          Procesos con señales de {entidad}, ordenados por prioridad de revisión
        </TableCaption>
        <TableHeader className="[&_th]:sticky [&_th]:top-[calc(var(--alto-cabecera)+0.75rem+var(--alto-filtros))] [&_th]:z-10 [&_th]:bg-card">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-28 ps-5">Prioridad</TableHead>
            <TableHead>Proceso</TableHead>
            <TableHead className="w-[32%]">Señales</TableHead>
            <TableHead className="w-36 text-right">Fecha y monto</TableHead>
            <TableHead className="w-40 pe-5">Revisión</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((fila) => (
            <TableRow key={fila.ocid}>
              <TableCell className="ps-5 align-top">
                <PrioridadBadge prioridad={fila.prioridad} />
              </TableCell>
              <TableCell className="align-top whitespace-normal">
                <Link
                  href={hrefProceso(fila.ocid)}
                  className="rounded-md font-medium outline-none underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {fila.descripcion}
                </Link>
                <div className="mt-0.5 truncate text-xs text-muted-foreground" title={`${fila.metodo} · ${fila.ocid}`}>
                  {fila.metodo} · {fila.ocid}
                </div>
              </TableCell>
              <TableCell className="align-top whitespace-normal">
                <ChipsDeSenales senales={fila.senales} />
              </TableCell>
              <TableCell className="text-right align-top">
                <div>{formatFecha(fila.fechaConvocatoria)}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{formatSoles(fila.montoReferencial)}</div>
              </TableCell>
              <TableCell className="pe-5 align-top">
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
 * Tablet y celular: filas de lista con chevron. Toda la fila abre la ficha (el enlace del título se
 * extiende sobre ella); la insignia de prioridad queda por encima para que su desglose siga accesible.
 */
function ListaBandeja({ filas, estadoDe }: { filas: FilaBandeja[]; estadoDe: (ocid: string) => ReviewState }) {
  return (
    <ul className={cn(CLASE_SUPERFICIE, "flex flex-col overflow-hidden xl:hidden")}>
      {filas.map((fila) => (
        <li
          key={fila.ocid}
          className="relative flex items-center gap-3 border-t border-separador px-4 py-3.5 transition-colors duration-150 ease-prisma first:border-t-0 hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] has-[a:focus-visible]:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] md:px-5"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-2">
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
              {fila.metodo} · {formatFecha(fila.fechaConvocatoria)} · {formatSoles(fila.montoReferencial)}
            </p>
            <ChipsDeSenales senales={fila.senales} />
          </div>
          <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
        </li>
      ))}
    </ul>
  );
}

/** Chips de las señales del proceso: código y nombre, en cápsulas neutras. */
function ChipsDeSenales({ senales }: { senales: FilaBandeja["senales"] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Señales del proceso">
      {senales.map((senal) => (
        <li
          key={senal.id}
          className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
        >
          <span className="font-mono font-semibold">{senal.codigo}</span>
          <span>
            {SIGNAL_METHODOLOGY[senal.codigo].name}
            {senal.simulado && <span className="text-muted-foreground"> · dato simulado</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
