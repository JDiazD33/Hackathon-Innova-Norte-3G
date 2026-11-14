import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";

import { PrioridadBadge } from "@/components/estado/prioridad-badge";
import { TituloDePagina } from "@/components/layout/titulo-de-pagina";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { describePriority } from "@/features/explicacion";
import { SignalCard } from "@/features/explicacion/ui/signal-card";
import { SimulatedDataBadge } from "@/features/explicacion/ui/simulated-data-badge";
import { conEntidad } from "@/lib/entidad";
import { formatEntero, formatFecha, formatSoles, SIN_DATO } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { ProcessDetail } from "../process-detail";
import { ProcessHistory } from "./process-history";

function amount(value: number | null, currency: string) {
  if (value == null || !Number.isFinite(value)) return SIN_DATO;
  if (currency === "PEN") return formatSoles(value);
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

const OBJECT_LABELS = {
  bienes: "Bienes",
  servicios: "Servicios",
  obras: "Obras",
  consultoria_de_obras: "Consultoría de obras",
  otro: "Otro",
};

export function ProcessView({ detail }: { detail: ProcessDetail }) {
  const { process, entity, manifest, signals, timeline } = detail;
  const summary = [
    ["Entidad", entity?.nombre ?? SIN_DATO],
    ["Método", process.metodo || SIN_DATO],
    ["Objeto", OBJECT_LABELS[process.objeto]],
    ["Monto referencial", amount(process.monto_referencial, process.moneda)],
    ["Monto adjudicado", amount(process.monto_adjudicado, process.moneda)],
    ["Monto final", amount(process.monto_final, process.moneda)],
    ["Estado del proceso", process.estado || SIN_DATO],
    ["Participantes registrados", formatEntero(process.numero_postores)],
  ];
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div>
        <Button variant="plain" asChild>
          <Link href={conEntidad("/senales", process.entidad_id)}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver a señales
          </Link>
        </Button>
      </div>
      <TituloDePagina
        antetitulo="Ficha del proceso"
        titulo={process.descripcion || SIN_DATO}
        descripcion={`${entity?.nombre ?? SIN_DATO} · ${process.metodo || SIN_DATO} · ${formatFecha(process.fechas.convocatoria)}`}
      />
      <div className="flex flex-wrap items-center gap-3">
        {process.simulado && <SimulatedDataBadge />}
        {process.prioridad ? (
          <PrioridadBadge prioridad={process.prioridad} />
        ) : (
          <span className="text-muted-foreground">Sin señales</span>
        )}
        {process.prioridad && (
          <span className="text-subtitulo tabular-nums">
            {describePriority(process.prioridad)}
          </span>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Resumen del proceso</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="divide-y divide-separador">
            {summary.map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-6"
              >
                <dt className="text-subtitulo text-muted-foreground">
                  {label}
                </dt>
                <dd
                  className={cn(
                    "min-w-0 break-words text-cuerpo tabular-nums sm:text-right",
                    value === SIN_DATO && "text-muted-foreground",
                  )}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="break-all font-mono text-nota text-muted-foreground">
            Identificador del proceso: {process.ocid}
          </p>
          {process.url_seace ? (
            <a
              href={process.url_seace}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary underline underline-offset-4"
            >
              Ver en el SEACE
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          ) : (
            <p className="text-subtitulo text-muted-foreground">
              La fuente no publica un enlace para este proceso.
            </p>
          )}
        </CardContent>
      </Card>
      <section aria-labelledby="process-signals" className="space-y-4">
        <h2 id="process-signals" className="text-titulo-2">
          Señales para revisar
        </h2>
        <p className="text-cuerpo text-muted-foreground">
          Una señal amerita revisión. La decisión siempre es de una persona.
        </p>
        {signals.length === 0 ? (
          <Card>
            <CardContent>
              No se encontraron señales para este proceso.
            </CardContent>
          </Card>
        ) : (
          signals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              context={{ manifest, process }}
              priority={process.prioridad}
              weight={
                process.prioridad?.desglose.find(
                  (item) => item.codigo === signal.codigo,
                )?.peso ?? manifest.prioridad.pesos[signal.codigo]
              }
            />
          ))
        )}
      </section>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Línea de tiempo</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-5">
            {timeline.map((event) => (
              <li
                key={event.id}
                className={cn(
                  "relative border-l-2 border-separador pl-4",
                  event.isSimulated && "border-dashed",
                )}
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-1.5 top-1 size-2.5 rounded-full border-2 border-card bg-primary"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-encabezado">{event.label}</h3>
                  {event.isSimulated && <SimulatedDataBadge />}
                </div>
                <p className="mt-1 text-subtitulo text-muted-foreground">
                  {event.date && event.formattedDate !== SIN_DATO ? (
                    <time dateTime={event.date}>{event.formattedDate}</time>
                  ) : (
                    SIN_DATO
                  )}
                </p>
                {event.responsible && (
                  <p className="mt-1 text-subtitulo">
                    Responsable simulado: {event.responsible}
                  </p>
                )}
                {event.document && (
                  <p className="mt-1 break-words text-subtitulo">
                    Documento simulado: {event.document}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Documentos oficiales</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {process.documentos.length === 0 ? (
            <p className="text-subtitulo text-muted-foreground">
              La fuente no publica documentos para este proceso
            </p>
          ) : (
            <ul className="divide-y divide-separador">
              {process.documentos.map((document, index) => (
                <li
                  key={`${document.url}-${index}`}
                  className="flex items-start gap-3 py-4"
                >
                  <FileText
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0 space-y-1">
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 break-words text-cuerpo text-primary underline underline-offset-4"
                    >
                      {document.titulo || SIN_DATO}
                      <ExternalLink
                        aria-hidden="true"
                        className="size-4 shrink-0"
                      />
                    </a>
                    <p className="text-nota text-muted-foreground">
                      {document.tipo || SIN_DATO}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <ProcessHistory ocid={process.ocid} />
    </div>
  );
}
