import { SIN_DATO } from "@/lib/format";

const reviewDate = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Lima",
});

export function formatReviewDate(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? reviewDate.format(date) : SIN_DATO;
}
