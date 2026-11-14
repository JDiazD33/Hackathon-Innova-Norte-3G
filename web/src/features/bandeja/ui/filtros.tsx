"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ControlSegmentado } from "@/components/ui/control-segmentado";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { STATE_LABELS, type ReviewState } from "@/features/revision";
import type { NivelPrioridad } from "@/lib/data/types";
import { NIVEL_PRIORIDAD_LABELS } from "@/lib/etiquetas";
import { formatFecha } from "@/lib/format";

import { FILTROS_VACIOS, hayFiltrosActivos, type FiltrosBandeja, type OpcionesFiltro } from "../bandeja";

const ESTADOS: ReviewState[] = ["sin_revisar", "en_revision", "justificada", "requiere_atencion"];

type OpcionPrioridad = NivelPrioridad | "todas";

/**
 * Barra de filtros de la bandeja (HIG · Toolbars y Segmented controls): fija bajo la barra superior y en
 * vidrio. Prioridad con un control segmentado; categoría, método y revisión con botones emergentes; las
 * fechas en un popover; "Limpiar filtros" como botón plano. En el celular se desliza en horizontal.
 */
export function FiltrosDeBandeja({
  opciones,
  filtros,
  onChange,
}: {
  opciones: OpcionesFiltro;
  filtros: FiltrosBandeja;
  onChange: (filtros: FiltrosBandeja) => void;
}) {
  const cambiar = (cambios: Partial<FiltrosBandeja>) => onChange({ ...filtros, ...cambios });
  const prioridad: OpcionPrioridad = filtros.prioridades.length === 1 ? filtros.prioridades[0] : "todas";

  return (
    <section
      aria-label="Filtros"
      className="sticky top-[5.75rem] z-20 -mx-1 rounded-barra material-barra lg:top-[4.25rem]"
    >
      <div className="flex items-center gap-2 overflow-x-auto p-2 [scrollbar-width:none] md:flex-wrap md:overflow-visible">
        <ControlSegmentado<OpcionPrioridad>
          etiqueta="Prioridad"
          className="shrink-0"
          valor={prioridad}
          onChange={(valor) => cambiar({ prioridades: valor === "todas" ? [] : [valor] })}
          opciones={[
            { valor: "todas", etiqueta: "Todas" },
            ...opciones.prioridades.map((nivel) => ({ valor: nivel, etiqueta: NIVEL_PRIORIDAD_LABELS[nivel] })),
          ]}
        />
        <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-separador" />
        <SeleccionMultiple
          etiqueta="Categoría"
          opciones={opciones.categorias.map((c) => ({ valor: c.categoria, texto: c.etiqueta }))}
          seleccion={filtros.categorias}
          onChange={(categorias) => cambiar({ categorias })}
        />
        <SeleccionMultiple
          etiqueta="Método"
          opciones={opciones.metodos.map((metodo) => ({ valor: metodo, texto: metodo }))}
          seleccion={filtros.metodos}
          onChange={(metodos) => cambiar({ metodos })}
        />
        <SeleccionMultiple
          etiqueta="Revisión"
          opciones={ESTADOS.map((estado) => ({ valor: estado, texto: STATE_LABELS[estado] }))}
          seleccion={filtros.estados}
          onChange={(estados) => cambiar({ estados })}
        />
        <RangoDeFechas
          desde={filtros.desde}
          hasta={filtros.hasta}
          onChange={(desde, hasta) => cambiar({ desde, hasta })}
        />
        {hayFiltrosActivos(filtros) && (
          <Button variant="plain" size="sm" className="shrink-0" onClick={() => onChange(FILTROS_VACIOS)}>
            Limpiar filtros
          </Button>
        )}
      </div>
    </section>
  );
}

/** Botón emergente con casillas. Con algo elegido, toma el tinte de acento y muestra cuántos. */
function SeleccionMultiple<T extends string>({
  etiqueta,
  opciones,
  seleccion,
  onChange,
}: {
  etiqueta: string;
  opciones: { valor: T; texto: string }[];
  seleccion: T[];
  onChange: (seleccion: T[]) => void;
}) {
  const id = useId();
  if (opciones.length === 0) return null;
  const activos = seleccion.length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={activos > 0 ? "tinted" : "secondary"}
          size="sm"
          className="shrink-0"
          aria-label={activos > 0 ? `${etiqueta}: ${activos} ${activos === 1 ? "elegida" : "elegidas"}` : etiqueta}
        >
          {etiqueta}
          {activos > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-leyenda font-semibold text-primary-foreground tabular-nums">
              {activos}
            </span>
          )}
          <ChevronDown aria-hidden="true" className="size-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-1.5">
        <fieldset className="flex flex-col">
          <legend className="px-2.5 pt-1 pb-1.5 text-xs font-semibold text-muted-foreground">{etiqueta}</legend>
          {opciones.map((opcion, indice) => {
            const marcada = seleccion.includes(opcion.valor);
            return (
              <div
                key={opcion.valor}
                className="flex items-center gap-2.5 rounded-[calc(var(--radius-menu)-0.375rem)] px-2.5 py-2 hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]"
              >
                <Checkbox
                  id={`${id}-${indice}`}
                  checked={marcada}
                  onCheckedChange={(valor) =>
                    onChange(valor === true ? [...seleccion, opcion.valor] : seleccion.filter((v) => v !== opcion.valor))
                  }
                />
                <Label htmlFor={`${id}-${indice}`} className="flex-1 cursor-pointer text-sm font-normal">
                  {opcion.texto}
                </Label>
              </div>
            );
          })}
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}

/** Rango de fechas de la convocatoria en un popover. */
function RangoDeFechas({
  desde,
  hasta,
  onChange,
}: {
  desde: string | null;
  hasta: string | null;
  onChange: (desde: string | null, hasta: string | null) => void;
}) {
  const id = useId();
  const activo = desde !== null || hasta !== null;
  const resumen =
    desde && hasta
      ? `${formatFecha(desde)} – ${formatFecha(hasta)}`
      : desde
        ? `Desde ${formatFecha(desde)}`
        : hasta
          ? `Hasta ${formatFecha(hasta)}`
          : "Fechas";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={activo ? "tinted" : "secondary"} size="sm" className="shrink-0" aria-label={`Convocatoria: ${resumen}`}>
          <CalendarDays aria-hidden="true" className="size-4" />
          {resumen}
          <ChevronDown aria-hidden="true" className="size-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-3 p-3">
        <p className="text-xs font-semibold text-muted-foreground">Fecha de convocatoria</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-desde`} className="text-xs text-muted-foreground">
              Desde
            </Label>
            <Input
              id={`${id}-desde`}
              type="date"
              className="w-44"
              value={desde ?? ""}
              onChange={(evento) => onChange(evento.target.value || null, hasta)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-hasta`} className="text-xs text-muted-foreground">
              Hasta
            </Label>
            <Input
              id={`${id}-hasta`}
              type="date"
              className="w-44"
              value={hasta ?? ""}
              onChange={(evento) => onChange(desde, evento.target.value || null)}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
