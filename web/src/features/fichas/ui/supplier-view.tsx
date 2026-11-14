import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { TituloDePagina } from "@/components/layout/titulo-de-pagina";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignalCard } from "@/features/explicacion/ui/signal-card";
import { SimulatedDataBadge } from "@/features/explicacion/ui/simulated-data-badge";
import { conEntidad } from "@/lib/entidad";
import {
  formatEntero,
  formatFecha,
  formatPorcentaje,
  SIN_DATO,
} from "@/lib/format";

import { formatProcessAmount } from "../amount";
import type { SupplierDetail } from "../supplier-detail";

export function SupplierView({ detail }: { detail: SupplierDetail }) {
  const {
    identity,
    entity,
    manifest,
    wonProcesses,
    participation,
    awardedProcesses,
    amounts,
    signals,
  } = detail;
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div>
        <Button variant="plain" asChild>
          <Link href={conEntidad("/senales", entity.id)}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver a señales
          </Link>
        </Button>
      </div>
      <TituloDePagina
        antetitulo="Ficha del proveedor"
        titulo={identity.displayName}
        descripcion={`Participación en ${entity.nombre}, durante el periodo ${manifest.anios.join("–")} del paquete.`}
      />
      {manifest.modo === "publico" && (
        <p className="text-subtitulo text-muted-foreground">
          La identidad del proveedor se protege con un seudónimo.
        </p>
      )}
      {manifest.modo === "local" && (
        <div className="space-y-2 text-subtitulo">
          <p>RUC: {identity.taxId ?? SIN_DATO}</p>
          {identity.profileUrl && (
            <a
              href={identity.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary underline underline-offset-4"
            >
              Ficha Única del Proveedor
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          )}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Procesos ganados</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-titulo-1 tabular-nums">
              {formatEntero(wonProcesses.length)}
            </p>
            <p className="mt-2 text-subtitulo text-muted-foreground">
              De {formatEntero(awardedProcesses)} procesos con adjudicatarios en
              la entidad.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Participación por procesos</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-titulo-1 tabular-nums">
              {formatPorcentaje(participation, 1)}
            </p>
            <p className="mt-2 text-subtitulo text-muted-foreground">
              Un proceso cuenta una vez, aunque tenga más de un adjudicatario.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Monto de los procesos ganados</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {amounts.length === 0 ? (
              <p className="text-titulo-1">{SIN_DATO}</p>
            ) : (
              amounts.map((amount) => (
                <div key={amount.currency}>
                  <p className="text-titulo-2 tabular-nums">
                    {formatProcessAmount(amount.value, amount.currency)}
                  </p>
                  {amount.missing > 0 && (
                    <p className="text-nota text-muted-foreground">
                      {formatEntero(amount.missing)} procesos sin monto; el
                      total disponible es parcial.
                    </p>
                  )}
                </div>
              ))
            )}
            {detail.sharedAwards && (
              <p className="text-nota text-muted-foreground">
                Incluye procesos con adjudicación compartida. La fuente no
                desglosa cuánto corresponde a cada proveedor.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <section aria-labelledby="supplier-signals" className="space-y-4">
        <h2 id="supplier-signals" className="text-titulo-2">
          Señales en esta entidad
        </h2>
        <p className="text-subtitulo text-muted-foreground">
          La señal S03 usa la ventana indicada en su explicación; las cifras de
          arriba corresponden al periodo del paquete.
        </p>
        {signals.length === 0 ? (
          <Card>
            <CardContent>
              No se encontró la señal S03 para este proveedor en la entidad
              seleccionada.
            </CardContent>
          </Card>
        ) : (
          signals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              context={{
                manifest,
                process: wonProcesses.find((process) =>
                  signal.ocids.includes(process.ocid),
                ),
              }}
              weight={manifest.prioridad.pesos.S03}
            />
          ))
        )}
      </section>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Procesos ganados en la entidad</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wonProcesses.length === 0 ? (
            <p className="text-subtitulo text-muted-foreground">
              No hay procesos ganados por este proveedor en la entidad
              seleccionada.
            </p>
          ) : (
            <ul className="divide-y divide-separador">
              {wonProcesses.map((process) => (
                <li key={process.ocid} className="space-y-2 py-4">
                  {process.simulado && (
                    <div>
                      <SimulatedDataBadge />
                    </div>
                  )}
                  <Link
                    href={conEntidad(
                      `/procesos/${encodeURIComponent(process.ocid)}`,
                      entity.id,
                    )}
                    className="text-encabezado text-primary underline underline-offset-4"
                  >
                    {process.descripcion || SIN_DATO}
                  </Link>
                  <p className="text-subtitulo text-muted-foreground">
                    {formatFecha(process.fechas.adjudicacion)} ·{" "}
                    {process.estado ?? SIN_DATO}
                  </p>
                  <p className="text-subtitulo tabular-nums">
                    {formatProcessAmount(
                      process.monto_adjudicado,
                      process.moneda,
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
