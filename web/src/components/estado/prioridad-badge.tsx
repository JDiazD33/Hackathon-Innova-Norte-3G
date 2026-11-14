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
 * Prioridad asignada por el sistema: ícono, texto y desglose (visible con el mouse y con el
 * teclado). Nunca usa rojo: el rojo es solo para la decisión humana "requiere atención".
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
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold",
            ESTILOS[prioridad.nivel],
            className,
          )}
        >
          <span aria-hidden="true" className="text-[0.55rem] tracking-[0.12em]">
            {"●".repeat(puntos)}
            {"○".repeat(3 - puntos)}
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
