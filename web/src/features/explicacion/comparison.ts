import type { Senal } from "@/lib/data/types";
import { formatPorcentaje } from "@/lib/format";

/** Resume el percentil recibido; no calcula distribuciones ni umbrales nuevos. */
export function describeComparison(signal: Pick<Senal, "codigo" | "comparacion">): string | null {
  const comparison = signal.comparacion;
  const percentile = comparison?.percentil_del_caso;
  if (
    typeof percentile !== "number" || !Number.isFinite(percentile) ||
    percentile < 0 || percentile > 100 ||
    (comparison?.n != null && comparison.n <= 0)
  ) return null;

  if (signal.codigo === "S02" && percentile <= 50) {
    // Se redondea hacia arriba en tramos de cinco: p4 → 5 %, p9,7 → 10 %.
    // Es una precisión de presentación, no el umbral que activa la señal.
    const band = Math.max(5, Math.ceil(percentile / 5) * 5);
    return `El plazo está entre el ${formatPorcentaje(band / 100)} más corto de los procesos comparables.`;
  }

  const share = formatPorcentaje(percentile / 100, 1);
  switch (signal.codigo) {
    case "S02":
      return `El ${share} de los procesos comparables tiene un plazo igual o menor.`;
    case "S03":
      return `El ${share} de los proveedores comparados tiene una participación igual o menor.`;
    case "S05":
      return `El ${share} de las entidades comparadas tiene una proporción de contratación directa igual o menor.`;
    default:
      return `El ${share} de los casos comparables tiene un valor igual o menor.`;
  }
}
