"use client";

import { useEffect, type RefObject } from "react";

/**
 * Publica el alto real de un elemento en una variable CSS de la raíz (por ejemplo, `--alto-cabecera`) y la
 * mantiene al día con ResizeObserver. Así lo que se fija debajo (la barra de filtros, la cabecera de una
 * tabla) usa `top: var(--alto-cabecera)` y no queda tapado si la cabecera crece: una segunda línea, un
 * control nuevo de otro lote o el zoom del navegador.
 */
export function useAltoEnVariable(ref: RefObject<HTMLElement | null>, variable: `--${string}`) {
  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    const raiz = document.documentElement;
    const publicar = () => raiz.style.setProperty(variable, `${elemento.getBoundingClientRect().height}px`);
    publicar();
    if (typeof ResizeObserver === "undefined") {
      return () => raiz.style.removeProperty(variable);
    }
    const observador = new ResizeObserver(publicar);
    observador.observe(elemento);
    return () => {
      observador.disconnect();
      raiz.style.removeProperty(variable);
    };
  }, [ref, variable]);
}
