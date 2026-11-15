import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TituloDePagina } from "@/components/layout/titulo-de-pagina";
import type { CodigoSenal, Manifest } from "@/lib/data/types";
import { CATEGORIA_LABELS } from "@/lib/etiquetas";
import { formatEntero, formatFecha } from "@/lib/format";

import { buildMethodology } from "../metodologia";
import { SimulatedDataBadge } from "./simulated-data-badge";

export function MethodologyView({ manifest }: { manifest: Manifest }) {
  const methodology = buildMethodology(manifest);
  const example = Object.entries(methodology.priority.weights)
    .filter(
      ([code, weight]) =>
        code !== "S05" &&
        manifest.senales_activas.includes(code as CodigoSenal) &&
        typeof weight === "number" &&
        weight > 0,
    )
    .slice(0, 2);
  const exampleTotal = example.reduce(
    (total, [, weight]) => total + (weight ?? 0),
    0,
  );
  return (
    <div className="mx-auto flex max-w-lectura flex-col gap-8">
      <TituloDePagina
        titulo="Metodología y límites"
        descripcion="Cómo se construyen las señales, qué datos se utilizan y por qué la decisión siempre corresponde a una persona."
      />
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Datos de este paquete</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-cuerpo">
          <dl className="divide-y divide-separador">
            {[
              ["Fuente", methodology.source.name],
              ["Datos al", formatFecha(methodology.source.cutoffDate)],
              ["Versión de las reglas", methodology.source.ruleVersion],
              ["Versión del contrato", methodology.source.contractVersion],
              ["Región", methodology.source.region],
              ["Periodo", methodology.source.years.join("–")],
              ["Licencia de los datos", methodology.source.license],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-6"
              >
                <dt className="text-subtitulo text-muted-foreground">
                  {label}
                </dt>
                <dd className="break-words text-subtitulo sm:text-right">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-subtitulo">{methodology.source.attribution}</p>
          <a
            href={methodology.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-subtitulo text-primary underline underline-offset-4"
          >
            Consultar la fuente del paquete
          </a>
        </CardContent>
      </Card>
      <section aria-labelledby="active-signals" className="space-y-4">
        <h2 id="active-signals" className="text-titulo-2">
          Señales activas
        </h2>
        <p className="text-subtitulo text-muted-foreground">
          Este catálogo resume las reglas. El umbral y las entradas de cada
          resultado están en la explicación de su ficha.
        </p>
        {methodology.signals.length === 0 && (
          <p>El manifiesto no declara señales activas.</p>
        )}
        {methodology.signals.map((signal) => (
          <Card key={signal.code} id={`senal-${signal.code}`}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-nota text-muted-foreground">
                  {signal.code}
                </span>
                <span className="text-nota text-muted-foreground">
                  {CATEGORIA_LABELS[signal.category]}
                </span>
                {signal.simulated && <SimulatedDataBadge />}
              </div>
              <CardTitle>
                <h3>{signal.name}</h3>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-cuerpo">
              <p>{signal.rule}</p>
              <p className="text-nota text-muted-foreground">
                Referencia: {signal.reference}
              </p>
            </CardContent>
          </Card>
        ))}
        {methodology.disabledSignals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                <h3>Señales desactivadas</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-separador">
                {methodology.disabledSignals.map((signal) => (
                  <li key={signal.codigo} className="space-y-1 py-3">
                    <p className="font-mono text-subtitulo">{signal.codigo}</p>
                    <p className="text-subtitulo text-muted-foreground">
                      {signal.motivo}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Cómo se obtiene la prioridad</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-cuerpo">
          <p>{methodology.priority.formula}</p>
          <p className="text-subtitulo text-muted-foreground">
            {methodology.priority.note}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Señal</TableHead>
                <TableHead className="text-right">Peso del paquete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(methodology.priority.weights).map(
                ([code, weight]) => (
                  <TableRow key={code}>
                    <TableCell className="font-mono">{code}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatEntero(weight)}
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
          <p className="text-subtitulo">
            Alta desde {formatEntero(methodology.priority.cutoffs.alta)} puntos;
            media desde {formatEntero(methodology.priority.cutoffs.media)}; baja
            por debajo del corte de media cuando hay señales.
          </p>
          {example.length > 0 && (
            <div className="rounded-item bg-muted p-4 text-subtitulo">
              <p className="font-semibold">Ejemplo con los pesos del paquete</p>
              <p className="mt-2 tabular-nums">
                {example
                  .map(([code, weight]) => `${code} (${formatEntero(weight)})`)
                  .join(" + ")}{" "}
                = {formatEntero(exampleTotal)} puntos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Referentes y licencias</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-separador">
            {methodology.references.map((reference) => (
              <li key={reference.name} className="space-y-2 py-4">
                <h3 className="text-encabezado">
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4"
                  >
                    {reference.name}
                  </a>
                </h3>
                <p className="text-nota text-muted-foreground">
                  {reference.license}
                </p>
                <p className="text-subtitulo">{reference.use}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Software utilizado</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-separador">
            {methodology.software.map((software) => (
              <li key={software.name} className="space-y-1 py-3">
                <h3 className="text-encabezado">{software.name}</h3>
                <p className="text-nota text-muted-foreground">
                  {software.license}
                </p>
                <p className="text-subtitulo">{software.use}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Límites y privacidad</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-3 pl-5 text-cuerpo">
            {methodology.limits.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Calidad de los datos</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-subtitulo">
          <div>
            <h3 className="mb-2 text-encabezado">Exclusiones</h3>
            {methodology.source.exclusions.length === 0 ? (
              <p className="text-muted-foreground">
                El manifiesto no registra exclusiones.
              </p>
            ) : (
              <ul className="list-disc space-y-2 pl-5">
                {methodology.source.exclusions.map((entry) => (
                  <li key={entry.motivo}>
                    {entry.motivo}: {formatEntero(entry.cantidad)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-encabezado">Correcciones</h3>
            {methodology.source.corrections.length === 0 ? (
              <p className="text-muted-foreground">
                El manifiesto no registra correcciones.
              </p>
            ) : (
              <ul className="list-disc space-y-2 pl-5">
                {methodology.source.corrections.map((entry) => (
                  <li key={entry.tipo}>
                    {entry.tipo}: {formatEntero(entry.cantidad)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
