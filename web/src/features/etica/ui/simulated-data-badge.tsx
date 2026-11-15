import { FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Marca los datos sintéticos sin atribuirles el estado de una revisión. */
export function SimulatedDataBadge({ className }: { className?: string }) {
  return (
    <Badge variant="secondary" className={cn("gap-1.5", className)}>
      <FlaskConical aria-hidden="true" className="size-3.5" />
      Dato simulado
    </Badge>
  );
}
