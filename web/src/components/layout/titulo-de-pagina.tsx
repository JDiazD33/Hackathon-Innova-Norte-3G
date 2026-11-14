import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Título grande con el que abre cada página (HIG · Typography y Toolbars): un antetítulo opcional, el
 * título, una frase que explica qué se ve y, a la derecha, las acciones de la página (una sola prominente).
 */
export function TituloDePagina({
  titulo,
  descripcion,
  antetitulo,
  acciones,
  className,
}: {
  titulo: ReactNode;
  descripcion?: ReactNode;
  antetitulo?: ReactNode;
  acciones?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-1.5">
        {antetitulo && <p className="text-sm font-medium text-muted-foreground first-letter:uppercase">{antetitulo}</p>}
        <h1 className="text-titulo-grande text-balance text-foreground">{titulo}</h1>
        {descripcion && <p className="max-w-3xl text-base text-pretty text-muted-foreground">{descripcion}</p>}
      </div>
      {acciones && <div className="flex shrink-0 flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  );
}
