import { SIGNAL_METHODOLOGY } from "@/features/etica/metodologia";
import { STATE_LABELS, type ReviewState } from "@/features/revision";
import { NIVEL_PRIORIDAD_LABELS } from "@/lib/etiquetas";

import type { FilaBandeja } from "./bandeja";

/*
 * Exportación de la bandeja a CSV (Lote B, tarea 4.5): un archivo que abren Excel, Power BI y Google Sheets.
 * - RFC 4180: separador coma, comillas dobles y saltos de línea CRLF.
 * - UTF-8 con BOM, para que Excel muestre bien las tildes.
 * - Fechas en ISO (2026-03-15) y montos como número sin separador de miles, para que Power BI los
 *   reconozca como fecha y número.
 * - Contra la inyección de fórmulas (OWASP "CSV Injection"): un texto que empieza con =, +, -, @, tabulación
 *   o retorno de carro se guarda con un apóstrofo delante, para que la hoja de cálculo no lo ejecute.
 */

const BOM = "﻿";
const INICIO_DE_FORMULA = /^[=+\-@\t\r]/;

export const COLUMNAS_CSV = [
  "Prioridad",
  "Puntaje",
  "Ocid",
  "Nomenclatura",
  "Descripción",
  "Método",
  "Fecha de convocatoria",
  "Monto referencial (S/)",
  "Señales",
  "Nombres de las señales",
  "Incluye dato simulado",
  "Estado de revisión",
  "Entidad",
] as const;

/** Un texto seguro para una celda: neutraliza fórmulas y lo entrecomilla si hace falta. */
export function celdaTexto(valor: string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "";
  const seguro = INICIO_DE_FORMULA.test(valor) ? `'${valor}` : valor;
  return /[",\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

/** Un número para una celda: sin separador de miles y con punto decimal. Vacío si no hay dato. */
export function celdaNumero(valor: number | null | undefined): string {
  return valor === null || valor === undefined || !Number.isFinite(valor) ? "" : String(valor);
}

/** Arma el CSV de las filas que se ven en la bandeja, en el mismo orden. */
export function filasACsv(
  filas: readonly FilaBandeja[],
  estadoDe: (ocid: string) => ReviewState,
  entidad: string,
): string {
  const lineas = [COLUMNAS_CSV.map(celdaTexto).join(",")];
  for (const fila of filas) {
    lineas.push(
      [
        celdaTexto(NIVEL_PRIORIDAD_LABELS[fila.prioridad.nivel]),
        celdaNumero(fila.prioridad.puntaje),
        celdaTexto(fila.ocid),
        celdaTexto(fila.nomenclatura),
        celdaTexto(fila.descripcion),
        celdaTexto(fila.metodo),
        celdaTexto(fila.fechaConvocatoria),
        celdaNumero(fila.montoReferencial),
        celdaTexto(fila.senales.map((s) => s.codigo).join("; ")),
        celdaTexto(fila.senales.map((s) => `${s.codigo} ${SIGNAL_METHODOLOGY[s.codigo].name}`).join("; ")),
        celdaTexto(fila.senales.some((s) => s.simulado) ? "Sí" : "No"),
        celdaTexto(STATE_LABELS[estadoDe(fila.ocid)]),
        celdaTexto(entidad),
      ].join(","),
    );
  }
  return BOM + lineas.join("\r\n") + "\r\n";
}

/** Nombre del archivo: prisma-senales-<entidad>-<fecha>.csv */
export function nombreArchivoCsv(entidadId: string, hoy: Date = new Date()): string {
  const fecha = hoy.toISOString().slice(0, 10);
  return `prisma-senales-${entidadId}-${fecha}.csv`;
}
