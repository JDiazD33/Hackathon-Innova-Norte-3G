"use client";

import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Aviso del paquete público: los proveedores aparecen con seudónimos. */
export function ModoDemostracion() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-control border border-border bg-card px-2 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring contrast-more:border-borde-contraste"
        >
          <Info aria-hidden="true" className="size-3.5 text-muted-foreground" />
          Modo demostración
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        Los proveedores aparecen con seudónimos y las personas naturales nunca muestran su nombre.
      </TooltipContent>
    </Tooltip>
  );
}
