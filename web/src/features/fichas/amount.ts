import { formatSoles, SIN_DATO } from "@/lib/format";

/** Respeta la moneda del proceso: no convierte ni suma monedas distintas. */
export function formatProcessAmount(
  value: number | null,
  currency: string,
): string {
  if (value == null || !Number.isFinite(value)) return SIN_DATO;
  if (currency === "PEN") return formatSoles(value);
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
