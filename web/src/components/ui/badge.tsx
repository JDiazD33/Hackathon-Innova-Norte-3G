import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/* Insignia Prisma: etiqueta rectangular pequeña con tinte. El texto siempre acompaña al color. */
const badgeVariants = cva(
  "group/badge inline-flex min-h-[1.375rem] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border border-transparent px-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3.5!",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground [a]:hover:bg-[color-mix(in_srgb,var(--accent),var(--accent-foreground)_10%)]",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-[color-mix(in_srgb,var(--secondary),var(--foreground)_7%)]",
        destructive: "bg-estado-requiere-atencion text-estado-requiere-atencion-foreground",
        outline: "border-border text-foreground contrast-more:border-borde-contraste [a]:hover:bg-muted",
        ghost: "text-muted-foreground hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
