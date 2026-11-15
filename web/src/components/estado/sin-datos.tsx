import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Estado vacío (un siguiente paso claro en cada pantalla vacía): ícono, título breve,
 * mensaje y una acción opcional. `titulo` e `icono` son opcionales; sin ellos se ve solo el mensaje.
 * Con `plano` no dibuja su propio panel: es para mostrarlo dentro de uno que ya tiene borde.
 */
export function SinDatos({
  mensaje,
  accion,
  titulo,
  icono: Icono = Inbox,
  plano = false,
}: {
  mensaje: string;
  accion?: ReactNode;
  titulo?: string;
  icono?: LucideIcon;
  plano?: boolean;
}) {
  return (
    <Card className={cn(plano && "rounded-none border-0 bg-transparent")}>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex size-10 items-center justify-center rounded-control border border-border bg-muted text-muted-foreground">
          <Icono aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </span>
        <div className="flex max-w-sm flex-col gap-1">
          {titulo && <p className="text-encabezado text-card-foreground">{titulo}</p>}
          <p className="text-sm text-muted-foreground">{mensaje}</p>
        </div>
        {accion && <div className="pt-1">{accion}</div>}
      </CardContent>
    </Card>
  );
}
