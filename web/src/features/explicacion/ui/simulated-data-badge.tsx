import { FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/** Etiqueta provisional prevista en design.md; sustituir por la del Lote D cuando se publique. */
export function SimulatedDataBadge() {
  return (
    <Badge variant="secondary">
      <FlaskConical aria-hidden="true" className="size-3.5" />
      Dato simulado
    </Badge>
  );
}
