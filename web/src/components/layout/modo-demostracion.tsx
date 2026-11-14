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
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground"
        >
          <Info aria-hidden="true" className="size-3.5" />
          Modo demostración
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        Los proveedores aparecen con seudónimos y las personas naturales nunca muestran su nombre.
      </TooltipContent>
    </Tooltip>
  );
}
