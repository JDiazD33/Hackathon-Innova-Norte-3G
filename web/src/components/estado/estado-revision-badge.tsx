import { Circle, CircleCheck, Clock, Flag, type LucideIcon } from "lucide-react";

import { STATE_LABELS, type ReviewState } from "@/features/revision";
import { cn } from "@/lib/utils";

const ESTADOS: Record<ReviewState, { icono: LucideIcon; clase: string }> = {
  sin_revisar: { icono: Circle, clase: "bg-estado-sin-revisar text-estado-sin-revisar-foreground" },
  en_revision: { icono: Clock, clase: "bg-estado-en-revision text-estado-en-revision-foreground" },
  justificada: { icono: CircleCheck, clase: "bg-estado-justificada text-estado-justificada-foreground" },
  requiere_atencion: {
    icono: Flag,
    clase: "bg-estado-requiere-atencion text-estado-requiere-atencion-foreground",
  },
};

/** Estado de revisión decidido por una persona: etiqueta rectangular con tinte, siempre con ícono y texto. */
export function EstadoRevisionBadge({ estado, className }: { estado: ReviewState; className?: string }) {
  const { icono: Icono, clase } = ESTADOS[estado];
  return (
    <span
      className={cn(
        "inline-flex min-h-[1.375rem] items-center gap-1.5 rounded-sm px-1.5 text-xs font-medium whitespace-nowrap contrast-more:ring-1 contrast-more:ring-current",
        clase,
        className,
      )}
    >
      <Icono aria-hidden="true" className="size-3.5" strokeWidth={2} />
      {STATE_LABELS[estado]}
    </span>
  );
}
