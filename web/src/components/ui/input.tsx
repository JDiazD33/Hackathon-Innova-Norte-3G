import * as React from "react"
import { cn } from "@/lib/utils"

/* Campo Prisma: cápsula con el relleno gris del sistema. Con "aumentar contraste" gana borde. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-full border border-transparent bg-secondary px-3.5 py-1 text-base text-foreground transition-[background-color,box-shadow] duration-150 ease-prisma outline-none pointer-coarse:h-11 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-destructive contrast-more:border-borde-contraste md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
