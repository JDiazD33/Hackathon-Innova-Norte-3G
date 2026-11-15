import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto del panel con la misma forma que la vista: título, franja de cifras, gráficos y tabla. */
export function PanelCargando() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Cargando el panel">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-96 max-w-full" />
        <Skeleton className="h-5 w-[32rem] max-w-full" />
      </div>
      <Skeleton className="h-28 rounded-tarjeta" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-tarjeta" />
        <Skeleton className="h-80 rounded-tarjeta" />
      </div>
      <Skeleton className="h-72 rounded-tarjeta" />
    </div>
  );
}
