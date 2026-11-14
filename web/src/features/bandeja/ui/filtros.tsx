"use client";

import { ChevronDown } from "lucide-react";
import { useId } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { STATE_LABELS, type ReviewState } from "@/features/revision";
import { NIVEL_PRIORIDAD_LABELS } from "@/lib/etiquetas";

import { FILTROS_VACIOS, hayFiltrosActivos, type FiltrosBandeja, type OpcionesFiltro } from "../bandeja";

const ESTADOS: ReviewState[] = ["sin_revisar", "en_revision", "justificada", "requiere_atencion"];

export function FiltrosDeBandeja({
  opciones,
  filtros,
  onChange,
}: {
  opciones: OpcionesFiltro;
  filtros: FiltrosBandeja;
  onChange: (filtros: FiltrosBandeja) => void;
}) {
  const id = useId();
  const cambiar = (cambios: Partial<FiltrosBandeja>) => onChange({ ...filtros, ...cambios });

  return (
    <section aria-label="Filtros" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Prioridad" className="flex flex-wrap items-center gap-1">
          <span className="me-1 text-xs font-medium text-muted-foreground">Prioridad</span>
          {opciones.prioridades.map((nivel) => {
            const activa = filtros.prioridades.includes(nivel);
            return (
              <Button
                key={nivel}
                size="sm"
                variant={activa ? "default" : "outline"}
                aria-pressed={activa}
                onClick={() =>
                  cambiar({
                    prioridades: activa
                      ? filtros.prioridades.filter((n) => n !== nivel)
                      : [...filtros.prioridades, nivel],
                  })
                }
              >
                {NIVEL_PRIORIDAD_LABELS[nivel]}
              </Button>
            );
          })}
        </div>

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

        {hayFiltrosActivos(filtros) && (
          <Button variant="ghost" size="sm" onClick={() => onChange(FILTROS_VACIOS)}>
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-desde`} className="text-xs text-muted-foreground">
            Convocatoria desde
          </Label>
          <Input
            id={`${id}-desde`}
            type="date"
            className="h-9 w-40"
            value={filtros.desde ?? ""}
            onChange={(evento) => cambiar({ desde: evento.target.value || null })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-hasta`} className="text-xs text-muted-foreground">
            Convocatoria hasta
          </Label>
          <Input
            id={`${id}-hasta`}
            type="date"
            className="h-9 w-40"
            value={filtros.hasta ?? ""}
            onChange={(evento) => cambiar({ hasta: evento.target.value || null })}
          />
        </div>
      </div>
    </section>
  );
}

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
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {etiqueta}
          {seleccion.length > 0 && (
            <Badge variant="secondary" className="rounded-sm px-1.5 tabular-nums">
              {seleccion.length}
            </Badge>
          )}
          <ChevronDown aria-hidden="true" className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <fieldset className="flex flex-col">
          <legend className="sr-only">{etiqueta}</legend>
          {opciones.map((opcion, indice) => {
            const marcada = seleccion.includes(opcion.valor);
            return (
              <div key={opcion.valor} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
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
