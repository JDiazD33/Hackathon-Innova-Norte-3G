"use client";

import Link from "next/link";
import { FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AssignmentDialog,
  DecisionDialog,
  ReviewHistory,
} from "@/features/revision/ui";

/**
 * Revisión dentro de la ficha (tarea C 2.5): el historial del almacén común y las mismas acciones que la
 * vista Revisión del Lote D. El diálogo y la asignación no aparecen para el auditor, que solo lee.
 */
export function ProcessHistory({
  ocid,
  description,
}: {
  ocid: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>
          <h2>Historial de revisión</h2>
        </CardTitle>
        <div className="flex flex-wrap items-start gap-2">
          <DecisionDialog ocid={ocid} title={description} />
          <AssignmentDialog ocid={ocid} title={description} />
          <Button asChild variant="plain">
            <Link href={`/reporte/${encodeURIComponent(ocid)}`}>
              <FileDown aria-hidden="true" className="size-4" />
              Ver reporte
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ReviewHistory ocid={ocid} />
      </CardContent>
    </Card>
  );
}
