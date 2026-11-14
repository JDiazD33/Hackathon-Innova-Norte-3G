"use client";

import { ChevronRight, Landmark } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { TituloDePagina } from "@/components/layout/titulo-de-pagina";
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
  titularCategorias,
  titularProveedores,
  titularTendencia,
  type DatosPanel,
  type SenalEntidadPanel,
} from "../panel";

/* Un solo color por serie (HIG · Charts). Las señales usan el tono de la prioridad; los procesos, gris. */
const configCategorias = {
  cantidad: { label: "Señales", color: "var(--chart-1)" },
} satisfies ChartConfig;

const configTendencia = {
  procesos: { label: "Procesos", color: "var(--chart-4)" },
  conSenales: { label: "Con señales", color: "var(--chart-3)" },
} satisfies ChartConfig;

const hrefProveedor = (id: string) => `/proveedores/${encodeURIComponent(id)}`;

/**
 * Panel de la entidad (Lote B · parte 6): título grande, cifras como widgets, la señal de la entidad
 * como aviso, gráficos cuyo título dice la conclusión y proveedores en una lista agrupada.
 */
export function PanelVista({ datos }: { datos: DatosPanel }) {
  const { estadoDe } = useRevisiones();
  const pendientes = contarRevisionesPendientes(datos.ocidsConSenales, estadoDe);
  const proporcion = datos.procesos > 0 ? datos.procesosConSenales / datos.procesos : null;
  const resumenCategorias = describirCategorias(datos.porCategoria);
  const resumenTendencia = describirTendencia(datos.tendencia);

  return (
    <div className="flex flex-col gap-8">
      <TituloDePagina
        antetitulo={datos.entidad.tipo}
        titulo={datos.entidad.nombre}
        descripcion="Panorama de las contrataciones de la entidad y de los procesos que ameritan revisión."
      />

      <section aria-label="Cifras clave" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
        <TarjetaGrafico
          seccion="Señales por categoría"
          titulo={titularCategorias(datos.porCategoria)}
          resumen={resumenCategorias}
        >
          {datos.porCategoria.length > 0 && (
            <ChartContainer
              config={configCategorias}
              className="aspect-auto h-60 w-full"
              role="img"
              aria-label={resumenCategorias}
            >
              <BarChart data={datos.porCategoria} layout="vertical" margin={{ left: 0, right: 16 }} barCategoryGap={8}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="etiqueta" width={118} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="cantidad" fill="var(--color-cantidad)" radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ChartContainer>
          )}
        </TarjetaGrafico>

        <TarjetaGrafico
          seccion="Tendencia mensual"
          titulo={titularTendencia(datos.tendencia)}
          resumen={resumenTendencia}
        >
          {datos.tendencia.length > 0 && (
            <ChartContainer
              config={configTendencia}
              className="aspect-auto h-60 w-full"
              role="img"
              aria-label={resumenTendencia}
            >
              <BarChart data={datos.tendencia} margin={{ left: -12, right: 8 }} barGap={2}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} minTickGap={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="procesos" fill="var(--color-procesos)" radius={[4, 4, 0, 0]} maxBarSize={14} />
                <Bar dataKey="conSenales" fill="var(--color-conSenales)" radius={[4, 4, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ChartContainer>
          )}
        </TarjetaGrafico>
      </div>

      <Card className="gap-0 pb-2">
        <CardHeader className="pb-3">
          <p className="text-xs font-semibold text-muted-foreground">Proveedores con mayor participación</p>
          <CardTitle>{titularProveedores(datos.topProveedores)}</CardTitle>
          <CardDescription>{describirTopProveedores(datos.topProveedores)}</CardDescription>
        </CardHeader>
        <ol className="flex flex-col">
          {datos.topProveedores.map((p) => (
            <li key={p.proveedorId} className="border-t border-separador first:border-t-0">
              <div className="flex flex-col gap-2 px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                  <Link
                    href={hrefProveedor(p.proveedorId)}
                    className="group/enlace inline-flex min-w-0 items-center gap-1 rounded-md text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="truncate group-hover/enlace:underline">{p.nombre}</span>
                    <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                  <span className="flex flex-wrap items-center gap-2 text-sm tabular-nums text-muted-foreground">
                    {p.recurrenteAtipico && (
                      <Badge className="bg-prioridad-alta text-prioridad-alta-foreground">
                        S03 · {SIGNAL_METHODOLOGY.S03.name.toLowerCase()}
                      </Badge>
                    )}
                    <span>
                      <span className="font-semibold text-foreground">{formatPorcentaje(p.participacion, 1)}</span> ·{" "}
                      {formatEntero(p.adjudicaciones)} {p.adjudicaciones === 1 ? "proceso" : "procesos"}
                    </span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted" aria-hidden="true">
                  <div
                    className="h-1.5 rounded-full bg-chart-1"
                    style={{ width: `${Math.min(100, Math.max(0, p.participacion * 100))}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

/** Cifra clave como widget: etiqueta, número grande, detalle y, si corresponde, un enlace. */
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
    <Card size="sm">
      <CardContent className="flex h-full flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
        <p className="text-titulo-1 tabular-nums text-card-foreground">{valor}</p>
        {detalle && <p className="text-xs text-muted-foreground">{detalle}</p>}
        {href && enlace && (
          <Link
            href={href}
            className="mt-auto inline-flex w-fit items-center gap-0.5 rounded-md pt-2 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {enlace}
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

/** Tarjeta de gráfico: la sección arriba, el título con la conclusión y el resumen en texto. */
function TarjetaGrafico({
  seccion,
  titulo,
  resumen,
  children,
}: {
  seccion: string;
  titulo: string;
  resumen: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold text-muted-foreground">{seccion}</p>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription className="text-xs">{resumen}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** La señal de la entidad (S05) como un aviso sereno: ícono y texto, no una alarma. */
function SenalDeEntidad({ senal }: { senal: SenalEntidadPanel }) {
  const esProporcion = /^(proporción|participación)/.test(senal.unidad);
  const valor = esProporcion ? formatPorcentaje(senal.valor, 1) : formatEntero(senal.valor);
  return (
    <Card size="sm">
      <CardContent className="flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-prioridad-alta text-prioridad-alta-foreground">
          <Landmark aria-hidden="true" className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs font-semibold text-muted-foreground">Señal de la entidad · {senal.codigo}</p>
          <p className="text-encabezado text-card-foreground">{SIGNAL_METHODOLOGY[senal.codigo].name}</p>
          <p className="text-sm text-muted-foreground">
            Valor: <span className="font-semibold text-foreground tabular-nums">{valor}</span> ({senal.unidad}). Se
            revisa a nivel de la entidad y no suma a la prioridad de los procesos.{" "}
            <Link href="/metodologia" className="font-medium text-primary underline-offset-2 hover:underline">
              Cómo se calcula
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
