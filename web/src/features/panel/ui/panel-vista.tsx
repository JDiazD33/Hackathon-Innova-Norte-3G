"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SIGNAL_METHODOLOGY } from "@/features/etica/metodologia";
import { conEntidad } from "@/lib/entidad";
import { formatEntero, formatPorcentaje, formatSoles } from "@/lib/format";
import { useRevisiones } from "@/lib/revisiones";

import {
  contarRevisionesPendientes,
  describirCategorias,
  describirTendencia,
  describirTopProveedores,
  type DatosPanel,
  type SenalEntidadPanel,
} from "../panel";

const configCategorias = {
  cantidad: { label: "Señales", color: "var(--chart-1)" },
} satisfies ChartConfig;

const configTendencia = {
  procesos: { label: "Procesos", color: "var(--chart-4)" },
  conSenales: { label: "Con señales", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function PanelVista({ datos }: { datos: DatosPanel }) {
  const { estadoDe } = useRevisiones();
  const pendientes = contarRevisionesPendientes(datos.ocidsConSenales, estadoDe);
  const proporcion = datos.procesos > 0 ? datos.procesosConSenales / datos.procesos : null;
  const resumenCategorias = describirCategorias(datos.porCategoria);
  const resumenTendencia = describirTendencia(datos.tendencia);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm capitalize text-muted-foreground">{datos.entidad.tipo}</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{datos.entidad.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          Panorama de las contrataciones de la entidad y de los procesos que ameritan revisión.
        </p>
      </header>

      <section aria-label="Cifras clave" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cifra titulo="Procesos" valor={formatEntero(datos.procesos)} detalle="En el periodo del paquete de datos" />
        <Cifra titulo="Monto total" valor={formatSoles(datos.montoTotal)} detalle="Según el resumen de la entidad" />
        <Cifra
          titulo="Procesos con señales"
          valor={formatEntero(datos.procesosConSenales)}
          detalle={proporcion === null ? undefined : `${formatPorcentaje(proporcion)} de los procesos`}
          href={conEntidad("/senales", datos.entidad.id)}
          enlace="Ver la bandeja"
        />
        <Cifra
          titulo="Revisiones pendientes"
          valor={formatEntero(pendientes)}
          detalle="Sin decisión registrada en este navegador"
          href={conEntidad("/revision", datos.entidad.id)}
          enlace="Ir a revisión"
        />
      </section>

      {datos.senalesEntidad.map((senal) => (
        <SenalDeEntidad key={senal.id} senal={senal} />
      ))}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Señales por categoría</CardTitle>
            <CardDescription>{resumenCategorias}</CardDescription>
          </CardHeader>
          <CardContent>
            {datos.porCategoria.length > 0 && (
              <ChartContainer
                config={configCategorias}
                className="aspect-auto h-60 w-full"
                role="img"
                aria-label={resumenCategorias}
              >
                <BarChart data={datos.porCategoria} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="etiqueta" width={118} tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="cantidad" fill="var(--color-cantidad)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendencia mensual</CardTitle>
            <CardDescription>{resumenTendencia}</CardDescription>
          </CardHeader>
          <CardContent>
            {datos.tendencia.length > 0 && (
              <ChartContainer
                config={configTendencia}
                className="aspect-auto h-60 w-full"
                role="img"
                aria-label={resumenTendencia}
              >
                <BarChart data={datos.tendencia} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} minTickGap={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="procesos" fill="var(--color-procesos)" radius={3} />
                  <Bar dataKey="conSenales" fill="var(--color-conSenales)" radius={3} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proveedores con mayor participación</CardTitle>
          <CardDescription>{describirTopProveedores(datos.topProveedores)}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-4">
            {datos.topProveedores.map((p) => (
              <li key={p.proveedorId} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                  <Link
                    href={`/proveedores/${encodeURIComponent(p.proveedorId)}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {p.nombre}
                  </Link>
                  <span className="flex items-center gap-2 tabular-nums text-muted-foreground">
                    {p.recurrenteAtipico && (
                      <Badge className="bg-prioridad-alta text-prioridad-alta-foreground">
                        S03 · {SIGNAL_METHODOLOGY.S03.name.toLowerCase()}
                      </Badge>
                    )}
                    {formatPorcentaje(p.participacion, 1)} · {formatEntero(p.adjudicaciones)}{" "}
                    {p.adjudicaciones === 1 ? "proceso" : "procesos"}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted" aria-hidden="true">
                  <div
                    className="h-2 rounded-full bg-chart-1"
                    style={{ width: `${Math.min(100, Math.max(0, p.participacion * 100))}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function Cifra({
  titulo,
  valor,
  detalle,
  href,
  enlace,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  href?: string;
  enlace?: string;
}) {
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className="text-2xl tabular-nums md:text-3xl">{valor}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
        {detalle && <p>{detalle}</p>}
        {href && enlace && (
          <Link href={href} className="font-medium text-primary underline-offset-2 hover:underline">
            {enlace}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function SenalDeEntidad({ senal }: { senal: SenalEntidadPanel }) {
  const esProporcion = /^(proporción|participación)/.test(senal.unidad);
  const valor = esProporcion ? formatPorcentaje(senal.valor, 1) : formatEntero(senal.valor);
  return (
    <Card className="border-l-4 border-l-prioridad-alta-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TriangleAlert aria-hidden="true" className="size-4 text-prioridad-alta-foreground" />
          Señal de la entidad · {senal.codigo} {SIGNAL_METHODOLOGY[senal.codigo].name}
        </CardTitle>
        <CardDescription>
          Valor: {valor} ({senal.unidad}). Se revisa a nivel de la entidad y no suma a la prioridad de los
          procesos.{" "}
          <Link href="/metodologia" className="font-medium text-primary underline-offset-2 hover:underline">
            Cómo se calcula
          </Link>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
