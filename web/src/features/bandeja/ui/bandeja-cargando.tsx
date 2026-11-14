import { Skeleton } from "@/components/ui/skeleton";

export function BandejaCargando() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando la bandeja">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
