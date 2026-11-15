import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { loadReport } from "@/features/revision/load-report";
import { ReportView } from "@/features/revision/ui/report-view";

export const metadata: Metadata = { title: "Reporte de trazabilidad" };

export default function ReportPage({ params }: PageProps<"/reporte/[ocid]">) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-label="Cargando reporte"
          className="mx-auto max-w-lectura p-6"
        >
          <Skeleton className="h-64 rounded-tarjeta" />
        </div>
      }
    >
      <ReportContent params={params} />
    </Suspense>
  );
}

async function ReportContent({
  params,
}: Pick<PageProps<"/reporte/[ocid]">, "params">) {
  const { ocid } = await params;
  const data = await loadReport(ocid);
  if (!data) notFound();
  await connection();
  return <ReportView {...data} generatedAt={new Date().toISOString()} />;
}
