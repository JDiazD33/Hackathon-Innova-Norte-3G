import * as React from "react"
import { cn } from "@/lib/utils"

/* Área de texto Prisma: el mismo relleno gris que el campo, con esquinas de 12 px. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-item border border-transparent bg-secondary px-3.5 py-2.5 text-base text-foreground transition-[background-color,box-shadow] duration-150 ease-prisma outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-destructive contrast-more:border-borde-contraste md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
