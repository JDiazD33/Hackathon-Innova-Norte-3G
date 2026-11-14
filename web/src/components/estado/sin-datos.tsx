import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Estado vacío (HIG · Writing: un siguiente paso claro en cada pantalla vacía): ícono, título breve,
 * mensaje y una acción opcional. `titulo` e `icono` son opcionales; sin ellos se ve solo el mensaje.
 */
export function SinDatos({
  mensaje,
  accion,
  titulo,
  icono: Icono = Inbox,
}: {
  mensaje: string;
  accion?: ReactNode;
  titulo?: string;
  icono?: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Icono aria-hidden="true" className="size-6" strokeWidth={1.75} />
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
