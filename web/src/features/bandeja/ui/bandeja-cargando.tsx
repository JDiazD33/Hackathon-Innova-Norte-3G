import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto de la bandeja con la misma forma que la vista: título y un panel con filtros y filas. */
export function BandejaCargando() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Cargando la bandeja">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-5 w-[36rem] max-w-full" />
      </div>
      <div className="flex flex-col overflow-hidden rounded-tarjeta border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 border-t border-separador px-4 py-3 first:border-t-0">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
