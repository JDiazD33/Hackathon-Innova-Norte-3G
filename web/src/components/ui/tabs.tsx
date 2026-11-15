"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

import { CLASE_PISTA, CLASE_SEGMENTO } from "./control-segmentado"

/*
 * Pestañas con aspecto de control segmentado, por ejemplo las de Revisión o
 * las secciones de una ficha. Misma API que las Tabs de shadcn/ui (Radix).
 */
function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(CLASE_PISTA, "max-w-full overflow-x-auto", className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        CLASE_SEGMENTO,
        // Igual que CLASE_SEGMENTO_ACTIVO, con el prefijo de estado (Tailwind necesita las clases literales).
        "data-[state=active]:bg-segmento data-[state=active]:font-semibold data-[state=active]:text-accent-foreground contrast-more:data-[state=active]:ring-1 contrast-more:data-[state=active]:ring-borde-contraste",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
