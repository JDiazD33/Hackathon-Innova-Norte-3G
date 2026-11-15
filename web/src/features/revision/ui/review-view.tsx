"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, FileDown } from "lucide-react";

import { EstadoRevisionBadge } from "@/components/estado/estado-revision-badge";
import { SinDatos } from "@/components/estado/sin-datos";
import { TituloDePagina } from "@/components/layout/titulo-de-pagina";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimulatedDataBadge } from "@/features/etica";
import { conEntidad } from "@/lib/entidad";
import { formatFecha } from "@/lib/format";
import { useRevisiones } from "@/lib/revisiones";

import { formatReviewDate } from "../format-date";
import { assignedBy, assignedTo, decidedCases } from "../selectors";
import {
  ROLE_LABELS,
  type AssignmentEntry,
  type DecisionEntry,
} from "../types";
import { AssignmentDialog } from "./assignment-dialog";
import { DecisionDialog } from "./decision-dialog";
import { ReviewFiles } from "./review-files";
import { ReviewHistory } from "./review-history";
import { ReviewRoleProvider, useReviewRole } from "./review-role";

export interface ReviewCase {
  ocid: string;
  description: string;
  date: string | null;
  simulated: boolean;
}
interface ReviewViewProps {
  entity: { id: string; nombre: string };
  cases: ReviewCase[];
}

export function ReviewView(props: ReviewViewProps) {
  return (
    <ReviewRoleProvider>
      <ReviewContent {...props} />
    </ReviewRoleProvider>
  );
}

function ReviewContent({ entity, cases }: ReviewViewProps) {
  const { role } = useReviewRole();
  const { snapshot, estadoDe } = useRevisiones();
  const [selected, setSelected] = useState(cases[0]?.ocid ?? "");
  const selectedCase = cases.find((process) => process.ocid === selected);
  const byId = new Map(cases.map((process) => [process.ocid, process]));
  const tabs = [
    {
      id: "to-me",
      label: "Asignados a mí",
      entries: assignedTo(snapshot.entries, role),
      empty: "No tienes casos asignados en esta entidad.",
    },
    {
      id: "by-me",
      label: "Asignados por mí",
      entries: assignedBy(snapshot.entries, role),
      empty: "Aún no asignaste casos de esta entidad.",
    },
    {
      id: "decided",
      label: "Decididos",
      entries: decidedCases(snapshot.entries),
      empty: "Aún no hay casos decididos en esta entidad.",
    },
  ];

  function actions(process: ReviewCase, primary = false) {
    return (
      <div className="flex flex-wrap items-start gap-2">
        <DecisionDialog
          ocid={process.ocid}
          title={process.description}
          variant={primary ? "default" : "outline"}
        />
        <AssignmentDialog ocid={process.ocid} title={process.description} />
        <Button asChild variant="plain">
          <Link href={`/reporte/${encodeURIComponent(process.ocid)}`}>
            <FileDown aria-hidden="true" className="size-4" />
            Ver reporte
          </Link>
        </Button>
      </div>
    );
  }

  function rows(entries: (AssignmentEntry | DecisionEntry)[], empty: string) {
    const visible = entries
      .filter((entry) => byId.has(entry.ocid))
      .sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
    if (!visible.length)
      return <SinDatos titulo="Sin casos por mostrar" mensaje={empty} />;
    return (
      <Card>
        <CardContent>
          <ul className="divide-y divide-separador">
            {visible.map((entry) => {
              const process = byId.get(entry.ocid)!;
              return (
                <li key={entry.id} className="space-y-3 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={conEntidad(
                        `/procesos/${encodeURIComponent(process.ocid)}`,
                        entity.id,
                      )}
                      className="text-encabezado text-primary underline underline-offset-4"
                    >
                      {process.description}
                    </Link>
                    <ChevronRight
                      aria-hidden="true"
                      className="size-5 shrink-0 text-muted-foreground"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <EstadoRevisionBadge estado={estadoDe(entry.ocid)} />
                    {process.simulated && <SimulatedDataBadge />}
                  </div>
                  <p className="text-nota text-muted-foreground">
                    {formatReviewDate(entry.fecha)} · {ROLE_LABELS[entry.rol]}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-subtitulo">
                    {entry.tipo === "asignacion"
                      ? entry.nota
                      : entry.comentario}
                  </p>
                  {actions(process)}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <TituloDePagina
        titulo="Revisión"
        descripcion={`Decisiones y asignaciones de ${entity.nombre}. Rol actual: ${ROLE_LABELS[role]}.`}
      />
      <ReviewFiles />
      <section aria-labelledby="review-cases" className="space-y-4">
        <h2 id="review-cases" className="text-titulo-2">
          Revisar un proceso
        </h2>
        {cases.length === 0 ? (
          <SinDatos mensaje="Esta entidad no tiene procesos en el paquete." />
        ) : (
          <Card>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="review-case">Proceso</Label>
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger id="review-case" className="w-full">
                    <SelectValue placeholder="Elige un proceso" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="max-w-(--radix-select-trigger-width)"
                  >
                    {cases.map((process) => (
                      <SelectItem key={process.ocid} value={process.ocid}>
                        <span className="truncate">
                          {process.description} · {formatFecha(process.date)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCase && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <EstadoRevisionBadge estado={estadoDe(selected)} />
                    {selectedCase.simulated && <SimulatedDataBadge />}
                  </div>
                  {actions(selectedCase, true)}
                  <details className="space-y-4">
                    <summary className="cursor-pointer rounded-item text-encabezado outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      Historial del proceso seleccionado
                    </summary>
                    <ReviewHistory ocid={selected} />
                  </details>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </section>
      <section aria-label="Casos según la revisión">
        <Tabs defaultValue="to-me">
          <TabsList className="h-auto w-full">
            <>
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="whitespace-normal py-2 text-center"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </>
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {rows(tab.entries, tab.empty)}
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </div>
  );
}
