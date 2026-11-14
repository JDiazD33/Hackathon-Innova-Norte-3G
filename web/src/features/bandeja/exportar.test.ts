import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { StaticDataSource } from "@/lib/data/static-data-source";

import { construirFilas, filtrarFilas, FILTROS_VACIOS, ordenarFilas } from "./bandeja";
import { celdaNumero, celdaTexto, COLUMNAS_CSV, filasACsv, nombreArchivoCsv } from "./exportar";

const fuente = new StaticDataSource(fileURLToPath(new URL("../../../data/fixture", import.meta.url)));

async function filasDe(entidadId: string) {
  const [procesos, senales] = await Promise.all([fuente.listProcesses(entidadId), fuente.listSignals(entidadId)]);
  return ordenarFilas(construirFilas(procesos, senales));
}

/** Separa un CSV en filas y celdas (lector mínimo de RFC 4180, solo para las pruebas). */
function leerCsv(csv: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let entreComillas = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (entreComillas) {
      if (c === '"' && csv[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') entreComillas = false;
      else celda += c;
    } else if (c === '"') entreComillas = true;
    else if (c === ",") {
      fila.push(celda);
      celda = "";
    } else if (c === "\r" && csv[i + 1] === "\n") {
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
      i++;
    } else celda += c;
  }
  return filas;
}

const sinRevisar = () => "sin_revisar" as const;

describe("celdas", () => {
  it("entrecomilla comas, comillas y saltos de línea", () => {
    expect(celdaTexto("Bienes, servicios")).toBe('"Bienes, servicios"');
    expect(celdaTexto('Dice "hola"')).toBe('"Dice ""hola"""');
    expect(celdaTexto("dos\nlíneas")).toBe('"dos\nlíneas"');
    expect(celdaTexto(null)).toBe("");
  });

  it("neutraliza textos que una hoja de cálculo ejecutaría como fórmula", () => {
    expect(celdaTexto("=HYPERLINK(\"http://x\")")).toBe(`"'=HYPERLINK(""http://x"")"`);
    expect(celdaTexto("+1")).toBe("'+1");
    expect(celdaTexto("-2")).toBe("'-2");
    expect(celdaTexto("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(celdaTexto("Adquisición normal")).toBe("Adquisición normal");
  });

  it("escribe los números sin separador de miles", () => {
    expect(celdaNumero(196000)).toBe("196000");
    expect(celdaNumero(1250.5)).toBe("1250.5");
    expect(celdaNumero(null)).toBe("");
  });
});

describe("filasACsv", () => {
  it("empieza con BOM, usa CRLF y trae una fila por proceso de la bandeja", async () => {
    const filas = await filasDe("entidad-0001");
    const csv = filasACsv(filas, sinRevisar, "Universidad Pública Ficticia del Norte");
    expect(csv.startsWith("﻿")).toBe(true);
    const tabla = leerCsv(csv.slice(1));
    expect(tabla[0]).toEqual([...COLUMNAS_CSV]);
    expect(tabla).toHaveLength(filas.length + 1);
    expect(tabla.slice(1).every((f) => f.length === COLUMNAS_CSV.length)).toBe(true);
  });

  it("respeta el orden y los datos de la bandeja, en formatos que lee Power BI", async () => {
    const filas = await filasDe("entidad-0001");
    const [, primera] = leerCsv(filasACsv(filas, sinRevisar, "Entidad").slice(1));
    const col = (nombre: (typeof COLUMNAS_CSV)[number]) => primera[COLUMNAS_CSV.indexOf(nombre)];
    expect(col("Ocid")).toBe(filas[0].ocid);
    expect(col("Prioridad")).toBe("Alta");
    expect(col("Puntaje")).toBe(String(filas[0].prioridad.puntaje));
    expect(col("Fecha de convocatoria")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(col("Monto referencial (S/)")).toMatch(/^\d+(\.\d+)?$/);
    expect(col("Nomenclatura")).toMatch(/-SM-/);
    expect(col("Estado de revisión")).toBe("Sin revisar");
  });

  it("exporta solo lo que dejan los filtros", async () => {
    const filas = await filasDe("entidad-0001");
    const altas = filtrarFilas(filas, { ...FILTROS_VACIOS, prioridades: ["alta"] }, sinRevisar);
    const tabla = leerCsv(filasACsv(altas, sinRevisar, "Entidad").slice(1));
    expect(tabla).toHaveLength(altas.length + 1);
    expect(tabla.slice(1).every((f) => f[0] === "Alta")).toBe(true);
  });

  it("usa el estado de revisión que decidió una persona", async () => {
    const filas = await filasDe("entidad-0001");
    const csv = filasACsv(filas.slice(0, 1), () => "requiere_atencion", "Entidad");
    expect(leerCsv(csv.slice(1))[1][COLUMNAS_CSV.indexOf("Estado de revisión")]).toBe("Requiere atención");
  });
});

describe("nombreArchivoCsv", () => {
  it("lleva la entidad y la fecha", () => {
    expect(nombreArchivoCsv("entidad-0001", new Date("2026-11-14T12:00:00Z"))).toBe(
      "prisma-senales-entidad-0001-2026-11-14.csv",
    );
  });
});
