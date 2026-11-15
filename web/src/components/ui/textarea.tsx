import * as React from "react"
import { cn } from "@/lib/utils"

/* Área de texto Prisma: igual que el campo (fondo blanco y borde visible). */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-control border border-input bg-card px-3 py-2 text-[1rem] text-foreground transition-[border-color,box-shadow] duration-150 ease-prisma outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-destructive contrast-more:border-borde-contraste md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
