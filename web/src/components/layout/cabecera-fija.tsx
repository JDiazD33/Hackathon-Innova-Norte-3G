"use client";

import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { useAltoEnVariable } from "./alto-en-variable";

/**
 * Barra superior fija, sólida y con un borde fino abajo. Publica su alto en `--alto-cabecera` para que la barra de filtros y las
 * cabeceras de tabla se fijen justo debajo, tenga una o dos líneas. Es un contenedor (`@container/cabecera`):
 * sus partes deciden si caben según el ancho real de la cabecera, que ya descuenta la barra lateral.
 */
export function CabeceraFija({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useAltoEnVariable(ref, "--alto-cabecera");
  return (
    <header ref={ref} className={cn("@container/cabecera sticky top-0 z-30 material-cabecera", className)}>
      {children}
    </header>
  );
}
