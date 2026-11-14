import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

/** Mensaje claro cuando no hay datos que mostrar, con una acción opcional. */
export function SinDatos({ mensaje, accion }: { mensaje: string; accion?: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">{mensaje}</p>
        {accion}
      </CardContent>
    </Card>
  );
}
