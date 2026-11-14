"use client";

import { useId, useState, type ReactNode } from "react";
import {
  ChartNoAxesCombined,
  ChevronDown,
  Clock3,
  ExternalLink,
  Files,
  ListChecks,
  Network,
  Users,
} from "lucide-react";

import { PrioridadBadge } from "@/components/estado/prioridad-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SIGNAL_METHODOLOGY } from "@/features/etica/metodologia";
import type { CategoriaSenal, Prioridad, Senal } from "@/lib/data/types";
import { formatEntero, SIN_DATO } from "@/lib/format";
import { cn } from "@/lib/utils";

import { explainSignal, type ExplanationContext } from "../index";
import { SimulatedDataBadge } from "./simulated-data-badge";
import { buildComparisonChart } from "../comparison-chart";
import { ComparisonChart } from "./comparison-chart";

const CATEGORY_ICONS = {
  competencia: Users,
  tiempos: Clock3,
  concentracion: Network,
  fraccionamiento: Files,
  ejecucion: ChartNoAxesCombined,
  reputacional: Users,
  trazabilidad: ListChecks,
} satisfies Record<CategoriaSenal, typeof Users>;

export interface SignalCardProps {
  signal: Senal;
  context?: ExplanationContext;
  priority?: Prioridad | null;
  weight?: number | null;
  variant?: "default" | "print";
}

function highlightValues(text: string): ReactNode {
  return text.split(/(\d[\d,.]*(?:\s?%)?)/g).map((part, index) =>
    /^\d/.test(part) ? (
      <strong key={index} className="font-semibold tabular-nums">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

/** Misma explicación para la ficha y el reporte: print expone todo, sin controles interactivos. */
export function SignalCard({
  signal,
  context,
  priority,
  weight,
  variant = "default",
}: SignalCardProps) {
  const id = useId();
  const isPrint = variant === "print";
  const [showDetails, setShowDetails] = useState(false);
  const expanded = isPrint || showDetails;
  const explanation = explainSignal(signal, context);
  if (!explanation) return null;
  const Icon = CATEGORY_ICONS[signal.categoria];
  const reference =
    [
      signal.referencia.cardinal && `Cardinal ${signal.referencia.cardinal}`,
      signal.referencia.ocp && "guía de OCP",
    ]
      .filter(Boolean)
      .join(" · ") || SIGNAL_METHODOLOGY[signal.codigo].reference;
  const points =
    weight ??
    priority?.desglose.find((item) => item.codigo === signal.codigo)?.peso;
  const dataUsed = explanation.dataUsed.filter(
    (item) => !item.startsWith("Ver en el SEACE:"),
  );
  const comparisonChart = buildComparisonChart(signal, context?.process?.ocid);

  function block(
    title: string,
    content: ReactNode,
    hidden = false,
    neutral = false,
  ) {
    return (
      <section
        hidden={hidden}
        className={cn("space-y-2", neutral && "rounded-item bg-muted p-4")}
      >
        <h4 className="text-encabezado">{title}</h4>
        {content}
      </section>
    );
  }

  return (
    <Card data-signal-code={signal.codigo} className="break-inside-avoid">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2 text-nota text-muted-foreground">
          <Icon aria-hidden="true" className="size-5 text-primary" />
          <span className="font-mono">{signal.codigo}</span>
          <span>
            {points == null
              ? "Peso: Sin dato"
              : `${formatEntero(points)} ${points === 1 ? "punto" : "puntos"} en la prioridad`}
          </span>
          {(signal.simulado || signal.codigo === "S08") && (
            <SimulatedDataBadge />
          )}
          {priority && !isPrint && <PrioridadBadge prioridad={priority} />}
        </div>
        <h3 className="text-titulo-3">
          {SIGNAL_METHODOLOGY[signal.codigo].name}
        </h3>
      </CardHeader>
      <CardContent id={id} className="space-y-5 text-cuerpo">
        {block(
          "Qué encontramos",
          <p>{highlightValues(explanation.finding)}</p>,
        )}
        {block(
          "Con qué lo comparamos",
          <>
            <p>{explanation.comparison}</p>
            {expanded &&
              comparisonChart &&
              (isPrint ? (
                <p className="text-subtitulo text-muted-foreground">
                  {comparisonChart.summary}
                </p>
              ) : (
                <ComparisonChart model={comparisonChart} />
              ))}
          </>,
          !expanded,
        )}
        {block(
          "Por qué importa",
          <>
            <p>{explanation.importance}</p>
            <p className="text-nota text-muted-foreground">
              <a
                href="/metodologia"
                className="text-primary underline underline-offset-4"
              >
                {reference}
              </a>
            </p>
          </>,
        )}
        {block(
          "Qué revisar",
          <ul className="space-y-3">
            {explanation.review.map((item, index) => (
              <li key={item} className="flex items-start gap-3">
                {isPrint ? (
                  <ListChecks
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0"
                  />
                ) : (
                  <Checkbox id={`${id}-check-${index}`} className="mt-1" />
                )}
                {isPrint ? (
                  <span>{item}</span>
                ) : (
                  <label
                    htmlFor={`${id}-check-${index}`}
                    className="cursor-pointer"
                  >
                    {item}
                  </label>
                )}
              </li>
            ))}
          </ul>,
          !expanded,
        )}
        {block(
          "Qué no significa",
          <p>{explanation.limitation}</p>,
          !expanded,
          true,
        )}
        {expanded &&
          (isPrint ? (
            block("Datos usados", dataUsedContent())
          ) : (
            <details className="space-y-3">
              <summary className="cursor-pointer rounded-item text-encabezado outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Datos usados
              </summary>
              {dataUsedContent()}
            </details>
          ))}
        {signal.calidad.length > 0 &&
          (isPrint ? (
            block("Calidad de datos", qualityNotes())
          ) : (
            <details className="space-y-3">
              <summary className="cursor-pointer rounded-item text-encabezado outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Calidad de datos
              </summary>
              {qualityNotes()}
            </details>
          ))}
        {!isPrint && (
          <Button
            type="button"
            variant="plain"
            aria-expanded={expanded}
            aria-controls={id}
            onClick={() => setShowDetails(!expanded)}
          >
            {expanded
              ? "Ocultar explicación completa"
              : "Ver explicación completa"}
            <ChevronDown
              aria-hidden="true"
              className={cn("size-4", expanded && "rotate-180")}
            />
          </Button>
        )}
      </CardContent>
    </Card>
  );

  function dataUsedContent() {
    return (
      <div className="space-y-3 text-subtitulo">
        <ul className="list-disc space-y-1 pl-5">
          {dataUsed.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {context?.process?.url_seace ? (
          <a
            href={context.process.url_seace}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary underline underline-offset-4"
          >
            Ver en el SEACE
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        ) : (
          !context?.process && <p>Enlace oficial: {SIN_DATO}</p>
        )}
      </div>
    );
  }

  function qualityNotes() {
    return (
      <ul className="list-disc space-y-1 pl-5 text-subtitulo text-muted-foreground">
        {signal.calidad.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    );
  }
}
