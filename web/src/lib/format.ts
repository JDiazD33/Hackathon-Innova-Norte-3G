/**
 * Formatos para la interfaz (es-PE). Dueño: Lote B; los usan todos los lotes.
 * Todas las funciones devuelven "Sin dato" cuando el valor falta o no es válido.
 */

export const SIN_DATO = "Sin dato";

const solesEnteros = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const solesConDecimales = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const enteros = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
const fechaSinHora = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fechaEnLima = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Lima",
});
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function esNumero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

/** "S/ 1,250,000" o, con decimales, "S/ 1,250,000.50". */
export function formatSoles(valor: number | null | undefined, opciones: { decimales?: boolean } = {}): string {
  if (!esNumero(valor)) return SIN_DATO;
  return (opciones.decimales ? solesConDecimales : solesEnteros).format(valor);
}

/** "1,240". */
export function formatEntero(valor: number | null | undefined): string {
  if (!esNumero(valor)) return SIN_DATO;
  return enteros.format(valor);
}

/** Recibe una proporción (0,312) y devuelve "31%" o, con 1 decimal, "31.2%". */
export function formatPorcentaje(proporcion: number | null | undefined, decimales = 0): string {
  if (!esNumero(proporcion)) return SIN_DATO;
  return new Intl.NumberFormat("es-PE", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  }).format(proporcion);
}

/**
 * "4 oct 2026". Las fechas sin hora (2026-10-04) se muestran tal cual; las fechas
 * con hora se convierten a la hora de Lima.
 */
export function formatFecha(valor: string | null | undefined): string {
  if (!valor) return SIN_DATO;
  const sinHora = SOLO_FECHA.test(valor);
  const fecha = new Date(sinHora ? `${valor}T00:00:00Z` : valor);
  if (Number.isNaN(fecha.getTime())) return SIN_DATO;
  return (sinHora ? fechaSinHora : fechaEnLima).format(fecha).replace(/\./g, "");
}
