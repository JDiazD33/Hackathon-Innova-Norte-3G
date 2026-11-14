import { createCn } from "cn/config";

/**
 * Une clases de Tailwind y resuelve conflictos. Conoce la escala de Prisma (globals.css) para no
 * confundir `text-titulo-3` (tamaño) con un color, ni descartar `rounded-tarjeta` o `shadow-tarjeta`.
 */
export const cn = createCn({
  extend: {
    theme: {
      text: [
        "titulo-grande",
        "titulo-1",
        "titulo-2",
        "titulo-3",
        "encabezado",
        "cuerpo",
        "subtitulo",
        "nota",
        "leyenda",
      ],
      radius: ["item", "menu", "tarjeta", "barra", "hoja"],
      shadow: ["tarjeta", "material"],
      ease: ["prisma"],
    },
  },
});
