"use client";

import { ChevronRight, Landmark } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { TituloDePagina } from "@/components/layout/titulo-de-pagina";
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
import { cn } from "@/lib/utils";

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

/* Un solo color por serie. Las señales usan el tono de la prioridad; los procesos, gris. */
const configCategorias = {
  cantidad: { label: "Señales", color: "var(--chart-1)" },
} satisfies ChartConfig;

const configTendencia = {
  procesos: { label: "Procesos", color: "var(--chart-4)" },
  conSenales: { label: "Con señales", color: "var(--chart-3)" },
} satisfies ChartConfig;

/** La ficha del proveedor muestra su participación en una entidad: el enlace conserva la del panel. */
const hrefProveedor = (id: string, entidadId: string) => conEntidad(`/proveedores/${encodeURIComponent(id)}`, entidadId);

/** Panel con borde: la superficie de cada bloque del panel. */
const CLASE_PANEL =
  "overflow-hidden rounded-tarjeta border border-border bg-card text-card-foreground contrast-more:border-borde-contraste";

/**
 * Panel de la entidad (Lote B): el título, una franja con las cifras clave, la señal de la entidad como
 * aviso y tres bloques con el mismo encabezado: qué se mide y, debajo, la lectura (la conclusión en una
 * frase). Los gráficos conservan su resumen en texto.
 */
export function PanelVista({ datos }: { datos: DatosPanel }) {
  const { estadoDe } = useRevisiones();
  const pendientes = contarRevisionesPendientes(datos.ocidsConSenales, estadoDe);
  const proporcion = datos.procesos > 0 ? datos.procesosConSenales / datos.procesos : null;
  const resumenCategorias = describirCategorias(datos.porCategoria);
  const resumenTendencia = describirTendencia(datos.tendencia);

  return (
    <div className="flex flex-col gap-5">
      <TituloDePagina
        antetitulo={datos.entidad.tipo}
        titulo={datos.entidad.nombre}
        descripcion="Panorama de las contrataciones de la entidad y de los procesos que ameritan revisión."
      />

      {/* Las líneas divisorias son el fondo que asoma por la separación de 1 px entre las cifras. */}
      <section
        aria-label="Cifras clave"
        className={cn(CLASE_PANEL, "grid grid-cols-2 gap-px bg-separador xl:grid-cols-4")}
      >
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

      <div className="grid gap-5 lg:grid-cols-2">
        <Bloque titulo="Señales por categoría" lectura={titularCategorias(datos.porCategoria)}>
          <div className="flex flex-col gap-3 p-4">
            {datos.porCategoria.length > 0 && (
              <ChartContainer
                config={configCategorias}
                className="aspect-auto h-56 w-full"
                role="img"
                aria-label={resumenCategorias}
              >
                <BarChart data={datos.porCategoria} layout="vertical" margin={{ left: 0, right: 16 }} barCategoryGap={8}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="etiqueta" width={118} tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="cantidad" fill="var(--color-cantidad)" radius={[0, 2, 2, 0]} maxBarSize={14} />
                </BarChart>
              </ChartContainer>
            )}
            <p className="text-xs text-muted-foreground">{resumenCategorias}</p>
          </div>
        </Bloque>

        <Bloque titulo="Tendencia mensual" lectura={titularTendencia(datos.tendencia)}>
          <div className="flex flex-col gap-3 p-4">
            {datos.tendencia.length > 0 && (
              <ChartContainer
                config={configTendencia}
                className="aspect-auto h-56 w-full"
                role="img"
                aria-label={resumenTendencia}
              >
                <BarChart data={datos.tendencia} margin={{ left: -12, right: 8 }} barGap={2}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} minTickGap={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="procesos" fill="var(--color-procesos)" radius={[2, 2, 0, 0]} maxBarSize={12} />
                  <Bar dataKey="conSenales" fill="var(--color-conSenales)" radius={[2, 2, 0, 0]} maxBarSize={12} />
                </BarChart>
              </ChartContainer>
            )}
            <p className="text-xs text-muted-foreground">{resumenTendencia}</p>
          </div>
        </Bloque>
      </div>

      <Bloque titulo="Proveedores con mayor participación" lectura={titularProveedores(datos.topProveedores)}>
        <p className="sr-only">{describirTopProveedores(datos.topProveedores)}</p>
        <table className="w-full text-sm tabular-nums">
          <caption className="sr-only">Proveedores con mayor participación en la entidad</caption>
          <thead>
            <tr className="border-b border-border bg-muted text-left text-xs text-muted-foreground">
              <th scope="col" className="h-9 w-12 ps-4 font-semibold">N.º</th>
              <th scope="col" className="h-9 font-semibold">Proveedor</th>
              <th scope="col" className="hidden h-9 w-56 font-semibold sm:table-cell">Participación</th>
              <th scope="col" className="h-9 w-16 text-right font-semibold sm:hidden">%</th>
              <th scope="col" className="h-9 w-24 pe-4 text-right font-semibold">Procesos</th>
            </tr>
          </thead>
          <tbody>
            {datos.topProveedores.map((p, indice) => (
              <tr key={p.proveedorId} className="border-b border-separador last:border-b-0">
                <td className="py-2.5 ps-4 text-muted-foreground">{indice + 1}</td>
                <td className="py-2.5 pe-3">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                    <Link
                      href={hrefProveedor(p.proveedorId, datos.entidad.id)}
                      className="rounded-sm font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {p.nombre}
                    </Link>
                    {p.recurrenteAtipico && (
                      <span className="text-xs text-prioridad-alta-foreground">
                        <span className="font-mono">S03</span> · {SIGNAL_METHODOLOGY.S03.name.toLowerCase()}
                      </span>
                    )}
                  </div>
                </td>
                <td className="hidden py-2.5 sm:table-cell">
                  <div className="flex items-center gap-3 pe-6">
                    <span className="w-12 text-right">{formatPorcentaje(p.participacion, 1)}</span>
                    <span className="h-1.5 flex-1 bg-muted" aria-hidden="true">
                      <span
                        className="block h-1.5 bg-chart-1"
                        style={{ width: `${Math.min(100, Math.max(0, p.participacion * 100))}%` }}
                      />
                    </span>
                  </div>
                </td>
                <td className="py-2.5 text-right sm:hidden">{formatPorcentaje(p.participacion, 1)}</td>
                <td className="py-2.5 pe-4 text-right">{formatEntero(p.adjudicaciones)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Bloque>
    </div>
  );
}

/** Cifra clave dentro de la franja: etiqueta, número, detalle y, si corresponde, un enlace. */
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
    <div className="flex flex-col gap-0.5 bg-card px-4 py-3.5">
      <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
      <p className="text-titulo-1 tabular-nums text-card-foreground">{valor}</p>
      {detalle && <p className="text-xs text-muted-foreground">{detalle}</p>}
      {href && enlace && (
        <Link
          href={href}
          className="mt-auto inline-flex w-fit items-center gap-0.5 rounded-sm pt-1.5 text-xs font-medium text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {enlace}
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

/**
 * Bloque del panel: un encabezado con lo que se mide (título) y la lectura, que es la conclusión en una
 * frase; debajo, el gráfico o la tabla.
 */
function Bloque({ titulo, lectura, children }: { titulo: string; lectura: string; children: ReactNode }) {
  return (
    <section className={cn(CLASE_PANEL, "flex flex-col")}>
      <header className="flex flex-col gap-0.5 border-b border-separador px-4 py-3">
        <h2 className="text-encabezado">{titulo}</h2>
        <p className="text-sm text-muted-foreground">{lectura}</p>
      </header>
      {children}
    </section>
  );
}

/** La señal de la entidad (S05) como un aviso sereno: un filete ámbar, ícono y texto, no una alarma. */
function SenalDeEntidad({ senal }: { senal: SenalEntidadPanel }) {
  const esProporcion = /^(proporción|participación)/.test(senal.unidad);
  const valor = esProporcion ? formatPorcentaje(senal.valor, 1) : formatEntero(senal.valor);
  return (
    <section
      aria-label={`Señal de la entidad ${senal.codigo}`}
      className={cn(CLASE_PANEL, "flex items-start gap-3 border-l-[3px] border-l-prioridad-alta-foreground px-4 py-3")}
    >
      <Landmark aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-prioridad-alta-foreground" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm">
          <span className="font-semibold">{SIGNAL_METHODOLOGY[senal.codigo].name}</span>{" "}
          <span className="text-xs text-muted-foreground">
            · señal de la entidad <span className="font-mono">{senal.codigo}</span>
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Valor: <span className="font-semibold text-foreground tabular-nums">{valor}</span> ({senal.unidad}). Se
          revisa a nivel de la entidad y no suma a la prioridad de los procesos.{" "}
          <Link href="/metodologia" className="font-medium text-primary underline underline-offset-2">
            Cómo se calcula
          </Link>
        </p>
      </div>
    </section>
  );
}
