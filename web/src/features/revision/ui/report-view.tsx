"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { describePriority } from "@/features/explicacion";
import { buildProcessTimeline } from "@/features/fichas";
import { SimulatedDataBadge } from "@/features/etica";
import { producto } from "@/config/producto";
import type { Expediente, Manifest, Proceso, Senal } from "@/lib/data/types";
import { conEntidad } from "@/lib/entidad";
import { formatEntero, formatFecha, SIN_DATO } from "@/lib/format";

import { formatReviewDate } from "../format-date";
import { ReviewHistory } from "./review-history";
import { ReportExplanation } from "./report-explanation";
import "./report-view.css";

const subscribeHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

interface ReportViewProps {
  process: Proceso;
  manifest: Manifest;
  entityName: string;
  signals: Senal[];
  file: Expediente | null;
  generatedAt: string;
}

function amount(value: number | null, currency: string) {
  if (value == null || !Number.isFinite(value)) return SIN_DATO;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function ReportView({
  process,
  manifest,
  entityName,
  signals,
  file,
  generatedAt,
}: ReportViewProps) {
  const ready = useSyncExternalStore(
    subscribeHydration,
    clientReady,
    serverReady,
  );
  const timeline = buildProcessTimeline(process, file);
  return (
    <div className="mx-auto max-w-contenido px-4 py-6 md:px-8">
      <nav
        aria-label="Acciones del reporte"
        className="prisma-report-toolbar mb-6 flex flex-wrap gap-2"
      >
        <Button asChild variant="plain">
          <Link
            href={conEntidad(
              "/revision",
              process.entidad_id,
            )}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver a revisión
          </Link>
        </Button>
        <Button type="button" disabled={!ready} onClick={() => window.print()}>
          <Printer aria-hidden="true" className="size-4" />
          Imprimir o guardar PDF
        </Button>
      </nav>
      <article
        className="prisma-report-paper mx-auto max-w-lectura space-y-8 rounded-tarjeta p-6 md:p-8"
      >
        <header className="space-y-3 border-b border-separador pb-5">
          <p className="text-encabezado">
            {producto.nombre} · Reporte de trazabilidad
          </p>
          <h1 className="text-titulo-1">{process.descripcion || SIN_DATO}</h1>
          <p className="text-subtitulo">{entityName}</p>
          <p className="text-nota">
            Generado el{" "}
            <time dateTime={generatedAt}>{formatReviewDate(generatedAt)}</time>{" "}
            · Hora de Lima
          </p>
          <p className="text-nota">
            Fuente: {manifest.fuente.nombre} · Datos al{" "}
            {formatFecha(manifest.fecha_corte)}
          </p>
          {process.simulado && <SimulatedDataBadge />}
        </header>
        <section aria-labelledby="report-summary" className="space-y-3">
          <h2 id="report-summary" className="text-titulo-2">
            Datos del proceso
          </h2>
          <dl className="divide-y divide-separador">
            {[
              ["Método", process.metodo || SIN_DATO],
              ["Estado", process.estado ?? SIN_DATO],
              [
                "Monto referencial",
                amount(process.monto_referencial, process.moneda),
              ],
              [
                "Monto adjudicado",
                amount(process.monto_adjudicado, process.moneda),
              ],
              ["Monto final", amount(process.monto_final, process.moneda)],
              [
                "Participantes registrados",
                formatEntero(process.numero_postores),
              ],
              ["Prioridad de revisión", describePriority(process.prioridad)],
            ].map(([label, value]) => (
              <div key={label} className="space-y-1 py-2">
                <dt className="text-nota text-muted-foreground">{label}</dt>
                <dd className="text-subtitulo tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="break-all font-mono text-nota">
            Identificador del proceso: {process.ocid}
          </p>
          {process.url_seace ? (
            <a
              href={process.url_seace}
              className="text-subtitulo underline underline-offset-4"
            >
              Ver en el SEACE
            </a>
          ) : (
            <p className="text-subtitulo">
              La fuente no publica un enlace para este proceso.
            </p>
          )}
        </section>
        <section aria-labelledby="report-timeline" className="space-y-3">
          <h2 id="report-timeline" className="text-titulo-2">
            Línea de tiempo
          </h2>
          <ol className="divide-y divide-separador">
            {timeline.map((event) => (
              <li key={event.id} className="space-y-2 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-encabezado">{event.label}</h3>
                  {event.isSimulated && <SimulatedDataBadge />}
                </div>
                <p className="text-subtitulo">{event.formattedDate}</p>
                {event.responsible && (
                  <p className="text-subtitulo">
                    Responsable simulado: {event.responsible}
                  </p>
                )}
                {event.document && (
                  <p className="text-subtitulo">
                    Documento simulado: {event.document}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="report-signals" className="space-y-4">
          <h2 id="report-signals" className="text-titulo-2">
            Señales y explicación
          </h2>
          {signals.length === 0 ? (
            <p className="text-subtitulo">
              No se encontraron señales para este proceso.
            </p>
          ) : (
            signals.map((signal) => (
              <ReportExplanation
                key={signal.id}
                signal={signal}
                manifest={manifest}
                process={process}
              />
            ))
          )}
        </section>
        <section aria-labelledby="report-documents" className="space-y-3">
          <h2 id="report-documents" className="text-titulo-2">
            Documentos oficiales
          </h2>
          {process.documentos.length === 0 ? (
            <p className="text-subtitulo">
              La fuente no publica documentos para este proceso.
            </p>
          ) : (
            <ul className="list-disc space-y-2 pl-5">
              {process.documentos.map((document, index) => (
                <li key={`${document.url}-${index}`} className="text-subtitulo">
                  <a
                    href={document.url}
                    className="underline underline-offset-4"
                  >
                    {document.titulo || SIN_DATO}
                  </a>{" "}
                  · {document.tipo || SIN_DATO}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="report-history" className="space-y-3">
          <h2 id="report-history" className="text-titulo-2">
            Historial de revisión
          </h2>
          <ReviewHistory ocid={process.ocid} print />
        </section>
        <footer className="space-y-3 border-t border-separador pt-5 text-nota">
          <p>{manifest.atribucion}</p>
          <p>
            Licencia: {manifest.licencia} · Reglas {manifest.version_reglas} ·
            Datos al {formatFecha(manifest.fecha_corte)}
          </p>
          <p>
            Las señales orientan la revisión y la decisión siempre es humana.
            Las revisiones de este reporte corresponden al navegador desde el
            que se genera.
          </p>
          <a href="/metodologia" className="underline underline-offset-4">
            Metodología, fuentes y licencias
          </a>
        </footer>
      </article>
    </div>
  );
}
