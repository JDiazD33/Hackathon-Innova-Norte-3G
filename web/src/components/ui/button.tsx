import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/*
 * Botones Prisma: rectángulos de esquinas apenas redondeadas (4 px). Un solo botón principal (`default`)
 * por vista.
 * - default: principal, fondo de acento
 * - tinted: tinte de acento
 * - outline: neutro con borde (el habitual para acciones secundarias y filtros)
 * - secondary: neutro con relleno gris
 * - plain: solo texto de acento ("Limpiar filtros")
 * - ghost: sin fondo, para íconos de barra
 * Con un puntero grueso (pantalla táctil) los tamaños llegan a 44 px.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-control border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color,box-shadow,opacity] duration-150 ease-prisma outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary),var(--background)_14%)]",
        tinted:
          "bg-accent text-accent-foreground hover:bg-[color-mix(in_srgb,var(--accent),var(--accent-foreground)_10%)] aria-expanded:bg-[color-mix(in_srgb,var(--accent),var(--accent-foreground)_10%)]",
        outline:
          "border-input bg-card text-foreground hover:bg-muted aria-expanded:bg-muted contrast-more:border-borde-contraste",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--secondary),var(--foreground)_7%)] aria-expanded:bg-[color-mix(in_srgb,var(--secondary),var(--foreground)_7%)]",
        ghost:
          "text-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_7%,transparent)] aria-expanded:bg-[color-mix(in_srgb,var(--foreground)_7%,transparent)]",
        plain: "text-primary hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-estado-requiere-atencion text-estado-requiere-atencion-foreground hover:bg-[color-mix(in_srgb,var(--estado-requiere-atencion),var(--estado-requiere-atencion-foreground)_10%)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3.5 pointer-coarse:h-11 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 px-2 text-xs pointer-coarse:h-9 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 px-3 pointer-coarse:h-10 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-10 gap-2 px-4 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-9 pointer-coarse:size-11 [&_svg:not([class*='size-'])]:size-[1.125rem]",
        "icon-xs": "size-7 pointer-coarse:size-9 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 pointer-coarse:size-10",
        "icon-lg": "size-10 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
