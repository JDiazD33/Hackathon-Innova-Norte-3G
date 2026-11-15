"use client";

import { useId } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer } from "@/components/ui/chart";
import { formatFecha, formatPorcentaje } from "@/lib/format";

import type { ComparisonChartModel } from "../comparison-chart";

const AXIS_TICK = { fill: "var(--muted-foreground)" };

/** El resumen contiene los mismos datos; el SVG se oculta al lector y en el celular. */
export function ComparisonChart({ model }: { model: ComparisonChartModel }) {
  const id = useId();
  const config = { value: { label: model.title, color: "var(--primary)" } };
  const marker = model.points.find((point) => point.isCase);
  const moneyTick = (value: number) =>
    new Intl.NumberFormat("es-PE", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  return (
    <figure aria-labelledby={id} className="space-y-3">
      <div aria-hidden="true" className="hidden md:block print:hidden">
        <p className="mb-3 text-subtitulo font-semibold">{model.title}</p>
        <ChartContainer config={config} className="h-64 w-full">
          {model.kind === "percentile" ? (
            <BarChart
              accessibilityLayer={false}
              layout="vertical"
              data={[{ label: "Grupo", value: 100 }]}
            >
              <XAxis
                tick={AXIS_TICK}
                type="number"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickLine={false}
                axisLine={false}
              />
              <YAxis dataKey="label" type="category" hide />
              <Bar
                dataKey="value"
                fill="var(--muted)"
                isAnimationActive={false}
              />
              <ReferenceArea
                x1={25}
                x2={75}
                fill="var(--chart-4)"
                fillOpacity={0.25}
              />
              <ReferenceLine
                x={model.percentile}
                stroke="var(--primary)"
                label={{
                  value: "Este proceso",
                  position: "insideTopLeft",
                  fill: "var(--foreground)",
                }}
              />
            </BarChart>
          ) : model.kind === "timeline" ? (
            <LineChart accessibilityLayer={false} data={model.points}>
              <CartesianGrid vertical={false} stroke="var(--separador)" />
              <XAxis
                tick={AXIS_TICK}
                dataKey="timestamp"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  formatFecha(new Date(value).toISOString().slice(0, 10))
                }
              />
              <YAxis
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                tickFormatter={moneyTick}
              />
              <Line
                type="linear"
                dataKey="value"
                stroke="var(--primary)"
                isAnimationActive={false}
              />
              <ReferenceLine
                y={model.threshold}
                stroke="var(--muted-foreground)"
                label={{
                  value: "Umbral",
                  position: "insideTopRight",
                  fill: "var(--foreground)",
                }}
              />
              {marker && (
                <ReferenceDot
                  x={marker.timestamp}
                  y={marker.value}
                  fill="var(--primary)"
                  stroke="var(--card)"
                  label={{
                    value: "Caso",
                    position: "top",
                    fill: "var(--foreground)",
                  }}
                />
              )}
            </LineChart>
          ) : (
            <BarChart accessibilityLayer={false} data={model.points}>
              <CartesianGrid vertical={false} stroke="var(--separador)" />
              <XAxis
                dataKey="label"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                tickFormatter={
                  model.unit === "proportion"
                    ? (value) => formatPorcentaje(value)
                    : moneyTick
                }
              />
              <Bar
                dataKey="value"
                isAnimationActive={false}
                label={{
                  position: "top",
                  formatter: (value: unknown) =>
                    typeof value === "number"
                      ? model.unit === "proportion"
                        ? formatPorcentaje(value, 1)
                        : moneyTick(value)
                      : "",
                  fill: "var(--foreground)",
                }}
              >
                {model.points.map((point) => (
                  <Cell
                    key={point.label}
                    fill={point.isCase ? "var(--primary)" : "var(--chart-4)"}
                  />
                ))}
              </Bar>
              {model.threshold != null && (
                <ReferenceLine
                  y={model.threshold}
                  stroke="var(--muted-foreground)"
                  label={{
                    value: "Límite superior",
                    position: "insideTopRight",
                    fill: "var(--foreground)",
                  }}
                />
              )}
            </BarChart>
          )}
        </ChartContainer>
        {model.kind === "bars" && (
          <p className="mt-2 text-nota text-muted-foreground">
            Caso resaltado: {marker?.label}. Los valores completos están en el
            resumen.
          </p>
        )}
      </div>
      <figcaption id={id} className="text-subtitulo text-muted-foreground">
        {model.summary}
      </figcaption>
    </figure>
  );
}
