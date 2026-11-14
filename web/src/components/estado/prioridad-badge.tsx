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

/**
 * Prioridad asignada por el sistema: cápsula con tinte, indicador de tres puntos, texto y desglose
 * (visible con el mouse y con el teclado). Nunca usa rojo: el rojo es solo para la decisión humana
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
            "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background contrast-more:ring-1 contrast-more:ring-current",
            ESTILOS[prioridad.nivel],
            className,
          )}
        >
          <span aria-hidden="true" className="flex items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn("size-1.5 rounded-full border border-current", i < puntos && "bg-current")}
              />
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
