"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { describePriority } from "@/features/explicacion";
import type { NivelPrioridad, Prioridad } from "@/lib/data/types";
import { NIVEL_PRIORIDAD_LABELS } from "@/lib/etiquetas";
import { cn } from "@/lib/utils";

const ESTILOS: Record<NivelPrioridad, string> = {
  alta: "bg-prioridad-alta text-prioridad-alta-foreground",
  media: "bg-prioridad-media text-prioridad-media-foreground",
  baja: "bg-prioridad-baja text-prioridad-baja-foreground",
};

const PUNTOS: Record<NivelPrioridad, number> = { alta: 3, media: 2, baja: 1 };

/** Altura de cada barra del medidor: crecen de izquierda a derecha, como un indicador de nivel. */
const ALTURAS = ["h-1.5", "h-2", "h-2.5"] as const;

/**
 * Prioridad asignada por el sistema: etiqueta rectangular con tinte, medidor de tres barras, texto y
 * desglose (visible con el mouse y con el teclado). El nivel se lee por el texto y por cuántas barras
 * están llenas, no solo por el color. Nunca usa rojo: el rojo es solo para la decisión humana
 * "requiere atención".
 */
export function PrioridadBadge({ prioridad, className }: { prioridad: Prioridad; className?: string }) {
  const desglose = describePriority(prioridad);
  const puntos = PUNTOS[prioridad.nivel];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`Prioridad de revisión: ${desglose}`}
          className={cn(
            "inline-flex min-h-[1.375rem] items-center gap-1.5 rounded-sm px-1.5 text-xs font-semibold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background contrast-more:ring-1 contrast-more:ring-current",
            ESTILOS[prioridad.nivel],
            className,
          )}
        >
          <span aria-hidden="true" className="flex items-end gap-px">
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn("w-[3px] bg-current", ALTURAS[i], i >= puntos && "opacity-30")} />
            ))}
          </span>
          {NIVEL_PRIORIDAD_LABELS[prioridad.nivel]}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        Prioridad de revisión: {desglose}. Es una suma de pesos, no una probabilidad.
      </TooltipContent>
    </Tooltip>
  );
}
