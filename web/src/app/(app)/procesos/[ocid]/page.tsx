import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { loadProcessPage } from "@/features/fichas/load-process";
import { ProcessView } from "@/features/fichas/ui/process-view";
import { getDataSource } from "@/lib/data";

export const metadata: Metadata = { title: "Ficha del proceso" };

/** Una muestra real valida el prerender sin construir miles de fichas; las demás se resuelven al abrirlas.
 * Next 16: usePathname de la navegación compartida necesita params conocidos durante el build.
 */
export async function generateStaticParams() {
  const source = getDataSource();
  for (const entity of await source.listEntities()) {
    const [process] = await source.listProcesses(entity.id);
    if (process) return [{ ocid: process.ocid }];
  }
  return [];
}

export default function ProcessPage({ params }: PageProps<"/procesos/[ocid]">) {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Cargando proceso">
          <Skeleton className="h-64 rounded-tarjeta" />
        </div>
      }
    >
      <ProcessContent params={params} />
    </Suspense>
  );
}

async function ProcessContent({
  params,
}: Pick<PageProps<"/procesos/[ocid]">, "params">) {
  const { ocid } = await params;
  const detail = await loadProcessPage(ocid);
  if (!detail) notFound();
  return <ProcessView detail={detail} />;
}
