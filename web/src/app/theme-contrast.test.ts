import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Comprueba el contraste WCAG 2.2 AA de los tokens de globals.css en modo claro y oscuro:
 * 4,5:1 para texto y 3:1 para el anillo de foco (docs/diseno/sistema-de-diseno.md).
 */
const css = readFileSync(fileURLToPath(new URL("./globals.css", import.meta.url)), "utf8");

function tokens(selector: ":root" | ".dark"): Record<string, string> {
  const inicio = css.indexOf(`${selector} {`);
  const bloque = css.slice(inicio, css.indexOf("}", inicio));
  return Object.fromEntries([...bloque.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)].map(([, nombre, valor]) => [nombre, valor]));
}

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

const PARES_DE_TEXTO: [texto: string, fondo: string][] = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary-foreground", "primary"],
  ["primary", "background"],
  ["primary", "card"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["accent-foreground", "accent"],
  ["sidebar-foreground", "sidebar"],
  ["sidebar-primary-foreground", "sidebar-primary"],
  ["sidebar-accent-foreground", "sidebar-accent"],
  ["prioridad-alta-foreground", "prioridad-alta"],
  ["prioridad-media-foreground", "prioridad-media"],
  ["prioridad-baja-foreground", "prioridad-baja"],
  ["estado-sin-revisar-foreground", "estado-sin-revisar"],
  ["estado-en-revision-foreground", "estado-en-revision"],
  ["estado-justificada-foreground", "estado-justificada"],
  ["estado-requiere-atencion-foreground", "estado-requiere-atencion"],
];

describe.each([":root", ".dark"] as const)("contraste de los tokens en %s", (selector) => {
  const t = tokens(selector);

  it.each(PARES_DE_TEXTO)("%s sobre %s llega a 4,5:1", (texto, fondo) => {
    expect(t[texto], `falta --${texto}`).toBeDefined();
    expect(t[fondo], `falta --${fondo}`).toBeDefined();
    expect(contraste(t[texto], t[fondo])).toBeGreaterThanOrEqual(4.5);
  });

  it("el anillo de foco se distingue del fondo (3:1)", () => {
    expect(contraste(t.ring, t.background)).toBeGreaterThanOrEqual(3);
    expect(contraste(t.ring, t.card)).toBeGreaterThanOrEqual(3);
  });

  it("solo el estado 'requiere atención' usa rojo", () => {
    const rojos = Object.entries(t)
      .filter(([nombre]) => nombre.startsWith("prioridad-") || nombre.startsWith("estado-"))
      .filter(([, valor]) => {
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(valor.slice(i, i + 2), 16));
        return r > 150 && r - Math.max(g, b) > 60 && Math.abs(g - b) < 40;
      })
      .map(([nombre]) => nombre);
    expect(rojos.every((nombre) => nombre.startsWith("estado-requiere-atencion"))).toBe(true);
  });
});
