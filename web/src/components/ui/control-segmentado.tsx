"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * Control segmentado (HIG · Segmented controls): una sola opción entre pocas (hasta 5–7), segmentos del
 * mismo ancho y solo texto o solo íconos. Las pestañas de `tabs.tsx` comparten este aspecto.
 */
export const CLASE_PISTA =
  "inline-flex h-9 w-fit items-center gap-0.5 rounded-full bg-secondary p-0.5 text-sm pointer-coarse:h-11 contrast-more:ring-1 contrast-more:ring-borde-contraste";

export const CLASE_SEGMENTO =
  "inline-flex h-full min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 font-medium whitespace-nowrap text-muted-foreground transition-[background-color,color,box-shadow] duration-200 ease-prisma outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-secondary disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0";

export const CLASE_SEGMENTO_ACTIVO =
  "bg-segmento text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.12),0_1px_1px_rgb(0_0_0/0.04)] contrast-more:ring-1 contrast-more:ring-borde-contraste";

export interface OpcionSegmento<T extends string> {
  valor: T;
  etiqueta: ReactNode;
}

/**
 * Elige una opción con un control segmentado. Siempre hay una seleccionada: elegir la activa otra vez no
 * la desmarca. Con el teclado se recorre con las flechas (Radix ToggleGroup).
 */
export function ControlSegmentado<T extends string>({
  etiqueta,
  opciones,
  valor,
  onChange,
  className,
}: {
  /** Nombre accesible del grupo, por ejemplo "Prioridad". */
  etiqueta: string;
  opciones: readonly OpcionSegmento<T>[];
  valor: T;
  onChange: (valor: T) => void;
  className?: string;
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      aria-label={etiqueta}
      value={valor}
      onValueChange={(nuevo) => {
        if (nuevo) onChange(nuevo as T);
      }}
      className={cn(CLASE_PISTA, className)}
    >
      {opciones.map((opcion) => (
        <ToggleGroupPrimitive.Item
          key={opcion.valor}
          value={opcion.valor}
          className={cn(CLASE_SEGMENTO, valor === opcion.valor && CLASE_SEGMENTO_ACTIVO)}
        >
          {opcion.etiqueta}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
