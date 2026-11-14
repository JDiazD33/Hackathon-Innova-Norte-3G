"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EstadoRevisionBadge } from "@/components/estado/estado-revision-badge";
import { PrioridadBadge } from "@/components/estado/prioridad-badge";
import { SinDatos } from "@/components/estado/sin-datos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SIGNAL_METHODOLOGY } from "@/features/etica/metodologia";
import type { ReviewState } from "@/features/revision";
import { formatEntero, formatFecha, formatSoles } from "@/lib/format";
import { useRevisiones } from "@/lib/revisiones";

import { FILTROS_VACIOS, filtrarFilas, hayFiltrosActivos, type FilaBandeja, type FiltrosBandeja } from "../bandeja";
import type { DatosBandeja } from "../cargar";
import { FiltrosDeBandeja } from "./filtros";

const hrefProceso = (ocid: string) => `/procesos/${encodeURIComponent(ocid)}`;

export function BandejaVista({ entidad, datos }: { entidad: { id: string; nombre: string }; datos: DatosBandeja }) {
  const { estadoDe } = useRevisiones();
  const [filtros, setFiltros] = useState<FiltrosBandeja>(FILTROS_VACIOS);
  const visibles = useMemo(() => filtrarFilas(datos.filas, filtros, estadoDe), [datos.filas, filtros, estadoDe]);
  const total = datos.filas.length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Señales</h1>
        <p className="text-sm text-muted-foreground">
          Procesos de {entidad.nombre} que ameritan revisión, ordenados por prioridad. Una señal no es una
          acusación: la decisión siempre es de una persona.
        </p>
      </header>

      {total > 0 && <FiltrosDeBandeja opciones={datos.opciones} filtros={filtros} onChange={setFiltros} />}

      <p aria-live="polite" className="text-sm text-muted-foreground">
        {hayFiltrosActivos(filtros)
          ? `Mostrando ${formatEntero(visibles.length)} de ${formatEntero(total)} procesos con señales.`
          : `${formatEntero(total)} ${total === 1 ? "proceso con señales" : "procesos con señales"}.`}
      </p>

      {total === 0 ? (
        <SinDatos mensaje="Esta entidad no tiene procesos con señales en el periodo." />
      ) : visibles.length === 0 ? (
        <SinDatos
          mensaje="Ningún proceso coincide con los filtros."
          accion={<Button onClick={() => setFiltros(FILTROS_VACIOS)}>Limpiar filtros</Button>}
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
    <div className="hidden overflow-x-auto rounded-xl border bg-card lg:block">
      <Table>
        <TableCaption className="sr-only">
          Procesos con señales de {entidad}, ordenados por prioridad de revisión
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28 ps-4">Prioridad</TableHead>
            <TableHead className="min-w-56">Proceso</TableHead>
            <TableHead className="min-w-64">Señales</TableHead>
            <TableHead className="w-32">Convocatoria</TableHead>
            <TableHead className="w-36 text-right">Monto referencial</TableHead>
            <TableHead className="w-44 pe-4">Revisión</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((fila) => (
            <TableRow key={fila.ocid}>
              <TableCell className="ps-4 align-top">
                <PrioridadBadge prioridad={fila.prioridad} />
              </TableCell>
              <TableCell className="max-w-md whitespace-normal align-top">
                <Link href={hrefProceso(fila.ocid)} className="font-medium underline-offset-2 hover:underline">
                  {fila.descripcion}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {fila.metodo} · {fila.ocid}
                </div>
              </TableCell>
              <TableCell className="whitespace-normal align-top">
                <ChipsDeSenales senales={fila.senales} />
              </TableCell>
              <TableCell className="align-top tabular-nums">{formatFecha(fila.fechaConvocatoria)}</TableCell>
              <TableCell className="text-right align-top tabular-nums">{formatSoles(fila.montoReferencial)}</TableCell>
              <TableCell className="pe-4 align-top">
                <EstadoRevisionBadge estado={estadoDe(fila.ocid)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ListaBandeja({ filas, estadoDe }: { filas: FilaBandeja[]; estadoDe: (ocid: string) => ReviewState }) {
  return (
    <ul className="flex flex-col gap-3 lg:hidden">
      {filas.map((fila) => (
        <li key={fila.ocid}>
          <Card className="gap-3 py-4">
            <CardContent className="flex flex-col gap-3 px-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <PrioridadBadge prioridad={fila.prioridad} />
                <EstadoRevisionBadge estado={estadoDe(fila.ocid)} />
              </div>
              <Link href={hrefProceso(fila.ocid)} className="font-medium underline-offset-2 hover:underline">
                {fila.descripcion}
              </Link>
              <p className="text-xs text-muted-foreground">
                {fila.metodo} · {formatFecha(fila.fechaConvocatoria)} · {formatSoles(fila.montoReferencial)}
              </p>
              <ChipsDeSenales senales={fila.senales} />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function ChipsDeSenales({ senales }: { senales: FilaBandeja["senales"] }) {
  return (
    <ul className="flex flex-col gap-1 text-sm" aria-label="Señales del proceso">
      {senales.map((senal) => (
        <li key={senal.id} className="flex items-baseline gap-2">
          <Badge variant="outline" className="shrink-0 px-1.5 font-mono text-[0.7rem]">
            {senal.codigo}
          </Badge>
          <span>
            {SIGNAL_METHODOLOGY[senal.codigo].name}
            {senal.simulado && <span className="text-muted-foreground"> · dato simulado</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
