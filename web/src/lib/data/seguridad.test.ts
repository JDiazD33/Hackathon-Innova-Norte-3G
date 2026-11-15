import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";
import { esIdSeguro, LARGO_MAXIMO_ID } from "./types";

/*
 * Pruebas de seguridad del Lote B (parte 9): los ids que llegan desde la URL no pueden salir de la carpeta
 * de datos ni romper el servidor, y todas las rutas llevan las cabeceras de seguridad.
 */
describe("esIdSeguro", () => {
  it("acepta los ids del paquete", () => {
    for (const id of ["entidad-0001", "ocds-dgv273-seacev3-1234567", "P0137", "S03-P0137-entidad-0001"]) {
      expect(esIdSeguro(id), id).toBe(true);
    }
  });

  it("rechaza intentos de recorrer carpetas, caracteres de control y HTML", () => {
    for (const id of ["../../etc/passwd", "..", "a/../b", "entidad-0001\u0000.json", "<script>", "", " entidad", "/etc"]) {
      expect(esIdSeguro(id), JSON.stringify(id)).toBe(false);
    }
  });

  it(`rechaza ids de más de ${LARGO_MAXIMO_ID} caracteres (antes daban un error 500)`, () => {
    expect(esIdSeguro("a".repeat(LARGO_MAXIMO_ID))).toBe(true);
    expect(esIdSeguro("a".repeat(LARGO_MAXIMO_ID + 1))).toBe(false);
    expect(esIdSeguro("a".repeat(5000))).toBe(false);
  });
});

describe("cabeceras de seguridad", () => {
  it("no anuncian la tecnología del servidor y protegen todas las rutas", async () => {
    expect(nextConfig.poweredByHeader).toBe(false);
    const reglas = await nextConfig.headers!();
    const todas = reglas.find((regla) => regla.source === "/:path*");
    const cabeceras = Object.fromEntries((todas?.headers ?? []).map(({ key, value }) => [key, value]));
    expect(cabeceras["X-Frame-Options"]).toBe("DENY");
    expect(cabeceras["X-Content-Type-Options"]).toBe("nosniff");
    expect(cabeceras["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(cabeceras["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(cabeceras["Permissions-Policy"]).toContain("camera=()");
  });
});
