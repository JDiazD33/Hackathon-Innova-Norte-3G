"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Suspense, useSyncExternalStore, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { AppNav, AppNavLinks } from "./app-nav";

/*
 * Armazón de Prisma: desde 1024 px la barra lateral va pegada al borde izquierdo, de alto completo y
 * separada por un borde fino; su primera fila mide lo mismo que la barra superior, para que las dos
 * formen un solo marco. Se puede ocultar y el contenido ocupa su lugar. Recordar si está oculta es una
 * comodidad de cada navegador: si localStorage no está disponible, la barra simplemente se muestra.
 */
const CLAVE = "prisma.barra-lateral";
const oyentes = new Set<() => void>();
let estadoEnMemoria: boolean | null = null;

function leerOculta(): boolean {
  try {
    return window.localStorage.getItem(CLAVE) === "oculta";
  } catch {
    return false;
  }
}

function guardarOculta(oculta: boolean) {
  try {
    window.localStorage.setItem(CLAVE, oculta ? "oculta" : "visible");
  } catch {
    // Sin almacenamiento (ventana privada, por ejemplo): el estado vive solo en esta página.
  }
  estadoEnMemoria = oculta;
  oyentes.forEach((avisar) => avisar());
}


function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

export function useBarraLateralOculta(): [boolean, (oculta: boolean) => void] {
  const oculta = useSyncExternalStore(
    suscribir,
    () => estadoEnMemoria ?? leerOculta(),
    () => false,
  );
  return [oculta, guardarOculta];
}

/** Barra lateral fija al borde (solo desde 1024 px). */
export function BarraLateral({ marca, nota }: { marca: ReactNode; nota: ReactNode }) {
  const [oculta, setOculta] = useBarraLateralOculta();
  return (
    <aside
      aria-label="Barra lateral"
      inert={oculta}
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex contrast-more:border-borde-contraste",
        "transition-[translate,opacity] duration-200 ease-prisma motion-reduce:transition-opacity",
        oculta && "pointer-events-none -translate-x-full opacity-0",
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border ps-3 pe-2 contrast-more:border-borde-contraste">
        {marca}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Ocultar la barra lateral" onClick={() => setOculta(true)}>
              <PanelLeftClose aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ocultar la barra lateral</TooltipContent>
        </Tooltip>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <Suspense fallback={<AppNavLinks entidad={null} />}>
          <AppNav />
        </Suspense>
      </div>
      <p className="border-t border-sidebar-border px-4 py-3 text-leyenda text-pretty text-muted-foreground">{nota}</p>
    </aside>
  );
}

/** Botón de la barra superior para volver a mostrar la barra lateral cuando está oculta. */
export function BotonMostrarBarraLateral() {
  const [oculta, setOculta] = useBarraLateralOculta();
  if (!oculta) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:inline-flex"
          aria-label="Mostrar la barra lateral"
          onClick={() => setOculta(false)}
        >
          <PanelLeftOpen aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Mostrar la barra lateral</TooltipContent>
    </Tooltip>
  );
}

/** Columna del contenido: deja sitio a la barra lateral cuando está visible. */
export function ColumnaPrincipal({ children }: { children: ReactNode }) {
  const [oculta] = useBarraLateralOculta();
  return (
    <div
      className={cn(
        "flex min-h-dvh min-w-0 flex-col transition-[padding] duration-200 ease-prisma motion-reduce:transition-none",
        !oculta && "lg:pl-60",
      )}
    >
      {children}
    </div>
  );
}
