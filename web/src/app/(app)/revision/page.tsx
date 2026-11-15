import type { Metadata } from "next";
import { Suspense } from "react";

import { SinDatos } from "@/components/estado/sin-datos";
import { Skeleton } from "@/components/ui/skeleton";
import { loadReviewCases } from "@/features/revision/load-review-cases";
import { ReviewView } from "@/features/revision/ui/review-view";
import { cargarEntidades } from "@/lib/data/cached";
import { elegirEntidad, PARAM_ENTIDAD } from "@/lib/entidad";

export const metadata: Metadata = { title: "Revisión" };

export default function ReviewPage({ searchParams }: PageProps<"/revision">) {
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-tarjeta" />}>
      <ReviewContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ReviewContent({
  searchParams,
}: Pick<PageProps<"/revision">, "searchParams">) {
  const [query, entities] = await Promise.all([
    searchParams,
    cargarEntidades(),
  ]);
  const entity = elegirEntidad(entities, query[PARAM_ENTIDAD]);
  if (!entity)
    return <SinDatos mensaje="El paquete no tiene entidades para revisar." />;
  const cases = await loadReviewCases(entity.id);
  return <ReviewView key={entity.id} entity={entity} cases={cases} />;
}
