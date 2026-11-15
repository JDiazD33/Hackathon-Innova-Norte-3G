"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * Control segmentado: una sola opción entre pocas (hasta 5–7), solo texto o solo íconos. Es un grupo de
 * botones dentro de un marco con borde; la opción elegida lleva el tinte de acento y más peso. Las
 * pestañas de `tabs.tsx` comparten este aspecto.
 */
export const CLASE_PISTA =
  "inline-flex h-9 w-fit items-stretch gap-0.5 rounded-control border border-input bg-card p-0.5 text-sm pointer-coarse:h-11 contrast-more:border-borde-contraste";

export const CLASE_SEGMENTO =
  "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[0.125rem] px-3 font-medium whitespace-nowrap text-muted-foreground transition-[background-color,color] duration-150 ease-prisma outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0";

export const CLASE_SEGMENTO_ACTIVO =
  "bg-segmento font-semibold text-accent-foreground hover:bg-segmento hover:text-accent-foreground contrast-more:ring-1 contrast-more:ring-borde-contraste";

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
