import type { Senal } from "@/lib/data/types";
import { formatEntero, formatFecha, formatPorcentaje } from "@/lib/format";
import { formatProcessAmount } from "@/features/fichas/amount";

import { inputNumber, isNumber } from "./textos/common";

export interface ComparisonPoint {
  label: string;
  value: number;
  isCase: boolean;
  timestamp?: number;
}

export interface ComparisonChartModel {
  kind: "bars" | "percentile" | "timeline";
  points: ComparisonPoint[];
  title: string;
  summary: string;
  unit: "proportion" | "money" | "percentile";
  currency: string;
  threshold?: number;
  percentile?: number;
}

const share = (value: unknown): value is number =>
  isNumber(value) && value >= 0 && value <= 1;

/** Solo presenta valores del paquete; no reconstruye una distribución a partir de sus cuartiles. */
export function buildComparisonChart(
  signal: Senal,
  caseOcid?: string,
): ComparisonChartModel | null {
  const base = { currency: "PEN" };
  if (signal.codigo === "S01") {
    const reference = signal.comparacion?.proporcion_referencia;
    if (
      !share(reference) ||
      (signal.comparacion?.n != null && signal.comparacion.n <= 0) ||
      !isNumber(signal.valor)
    )
      return null;
    // La población del pipeline también admite cero participantes: el complemento no equivale a uno exacto.
    const points = [
      { label: "Hasta 1", value: 1 - reference, isCase: signal.valor <= 1 },
      { label: "2 o más", value: reference, isCase: signal.valor >= 2 },
    ];
    return {
      ...base,
      kind: "bars",
      unit: "proportion",
      points,
      title: "Participantes registrados en el grupo",
      summary: `${formatPorcentaje(points[0].value, 1)} del grupo tiene hasta un participante registrado y ${formatPorcentaje(reference, 1)} tiene dos o más. Este proceso registra ${formatEntero(signal.valor)}.`,
    };
  }
  if (signal.codigo === "S02") {
    const percentile = signal.comparacion?.percentil_del_caso;
    if (
      !isNumber(percentile) ||
      percentile < 0 ||
      percentile > 100 ||
      (signal.comparacion?.n != null && signal.comparacion.n <= 0)
    )
      return null;
    return {
      ...base,
      kind: "percentile",
      unit: "percentile",
      points: [],
      percentile,
      title: "Posición del plazo de este proceso",
      summary: `Este proceso está en el percentil ${new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 }).format(percentile)}: el ${formatPorcentaje(percentile / 100, 1)} de los procesos comparables tiene un plazo igual o menor. La franja central va del percentil 25 al 75.`,
    };
  }
  if (signal.codigo === "S03") {
    const group = signal.comparacion;
    if (!group || !share(signal.valor) || (group.n != null && group.n <= 0))
      return null;
    const points: ComparisonPoint[] = [
      { label: "Este proveedor", value: signal.valor, isCase: true },
    ];
    if (share(group.mediana))
      points.push({ label: "Mediana", value: group.mediana, isCase: false });
    if (share(group.q3))
      points.push({
        label: "Cuartil superior",
        value: group.q3,
        isCase: false,
      });
    if (points.length < 2) return null;
    const threshold = share(group.valla_superior)
      ? group.valla_superior
      : undefined;
    return {
      ...base,
      kind: "bars",
      unit: "proportion",
      title: "El proveedor frente a las referencias del grupo",
      points,
      threshold,
      summary: `${points.map((point) => `${point.label}: ${formatPorcentaje(point.value, 1)}`).join("; ")}.${threshold != null ? ` Límite superior: ${formatPorcentaje(threshold, 1)}.` : ""} Las barras de referencia resumen el grupo; no representan proveedores individuales.`,
    };
  }
  if (signal.codigo === "S04") {
    const dates = signal.entradas.fechas;
    const amounts = signal.entradas.montos;
    if (
      !Array.isArray(dates) ||
      !Array.isArray(amounts) ||
      dates.length < 2 ||
      dates.length !== amounts.length ||
      dates.length !== signal.ocids.length ||
      !isNumber(signal.umbral.valor)
    )
      return null;
    const entries = dates.map((date, index) => ({
      date,
      amount: amounts[index],
      ocid: signal.ocids[index],
    }));
    if (
      entries.some(
        (entry) =>
          typeof entry.date !== "string" ||
          !Number.isFinite(Date.parse(entry.date)) ||
          !isNumber(entry.amount) ||
          entry.amount < 0,
      )
    )
      return null;
    entries.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    let total = 0;
    const points = entries.map((entry, index) => {
      total += entry.amount as number;
      return {
        label: formatFecha(entry.date),
        timestamp: Date.parse(entry.date),
        value: total,
        isCase: caseOcid
          ? entry.ocid === caseOcid
          : index === entries.length - 1,
      };
    });
    return {
      ...base,
      kind: "timeline",
      unit: "money",
      points,
      threshold: signal.umbral.valor,
      title: "Monto acumulado de las compras agrupadas",
      summary: `${points.map((point) => `${point.label}: ${formatProcessAmount(point.value, "PEN")} acumulados${point.isCase ? (caseOcid ? " (este proceso)" : " (grupo del caso)") : ""}`).join("; ")}. Umbral configurado: ${formatProcessAmount(signal.umbral.valor, "PEN")}.`,
    };
  }
  if (signal.codigo === "S06") {
    const contracted = inputNumber(signal, "monto_contratado");
    const final = inputNumber(signal, "monto_final");
    const currency = signal.entradas.moneda;
    if (
      contracted == null ||
      final == null ||
      contracted < 0 ||
      final < 0 ||
      typeof currency !== "string" ||
      !/^[A-Z]{3}$/.test(currency)
    )
      return null;
    return {
      currency,
      kind: "bars",
      unit: "money",
      title: "Monto contratado y monto final",
      points: [
        { label: "Contratado", value: contracted, isCase: false },
        { label: "Final (caso)", value: final, isCase: true },
      ],
      summary: `Monto contratado: ${formatProcessAmount(contracted, currency)}. Monto final de este proceso: ${formatProcessAmount(final, currency)}.`,
    };
  }
  return null;
}
