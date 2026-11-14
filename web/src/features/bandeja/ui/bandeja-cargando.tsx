import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto de la bandeja con la misma forma que la vista: título, barra de filtros y lista. */
export function BandejaCargando() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando la bandeja">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-5 w-[36rem] max-w-full rounded-full" />
      </div>
      <Skeleton className="h-[3.25rem] rounded-barra" />
      <Skeleton className="h-4 w-44 rounded-full" />
      <div className="flex flex-col overflow-hidden rounded-tarjeta bg-card shadow-tarjeta dark:ring-1 dark:ring-border">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 border-t border-separador px-5 py-4 first:border-t-0">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
