import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto del panel con la misma forma que la vista: título grande, cifras, gráficos y lista. */
export function PanelCargando() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Cargando el panel">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-10 w-96 max-w-full" />
        <Skeleton className="h-5 w-[32rem] max-w-full rounded-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-tarjeta" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-tarjeta" />
        <Skeleton className="h-96 rounded-tarjeta" />
      </div>
      <Skeleton className="h-72 rounded-tarjeta" />
    </div>
  );
}
