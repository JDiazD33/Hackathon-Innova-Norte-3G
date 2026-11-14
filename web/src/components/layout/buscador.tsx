"use client";

import { Building2, FileText, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { buscar, type EntradaBusqueda } from "@/features/bandeja/busqueda";
import { elegirEntidad, PARAM_ENTIDAD, type EntidadResumen } from "@/lib/entidad";

const CLASE_BOTON = "h-9 w-full justify-between gap-6 text-muted-foreground sm:w-56";

/**
 * Buscador global (Ctrl o Cmd + K). Busca en la entidad seleccionada: procesos por descripción
 * u ocid y proveedores por su seudónimo. El índice se pide a /api/busqueda al abrirlo.
 */
export function Buscador({ entidades }: { entidades: EntidadResumen[] }) {
  const router = useRouter();
  const entidad = elegirEntidad(entidades, useSearchParams().get(PARAM_ENTIDAD));
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [indice, setIndice] = useState<{ entidadId: string; entradas: EntradaBusqueda[] } | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    const alPresionar = (evento: KeyboardEvent) => {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        setAbierto((valor) => !valor);
      }
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, []);

  const entidadId = entidad?.id ?? null;
  useEffect(() => {
    if (!abierto || !entidadId || indice?.entidadId === entidadId) return;
    let cancelado = false;
    fetch(`/api/busqueda?entidad=${encodeURIComponent(entidadId)}`)
      .then((respuesta) => (respuesta.ok ? respuesta.json() : Promise.reject(new Error(String(respuesta.status)))))
      .then((entradas: EntradaBusqueda[]) => {
        if (cancelado) return;
        setIndice({ entidadId, entradas });
        setFallo(false);
      })
      .catch(() => {
        if (!cancelado) setFallo(true);
      });
    return () => {
      cancelado = true;
    };
  }, [abierto, entidadId, indice]);

  const resultados = useMemo(
    () => (indice && indice.entidadId === entidadId ? buscar(indice.entradas, consulta, 10) : []),
    [indice, entidadId, consulta],
  );
  const procesos = resultados.filter((r) => r.tipo === "proceso");
  const proveedores = resultados.filter((r) => r.tipo === "proveedor");

  const cambiarAbierto = (valor: boolean) => {
    setAbierto(valor);
    if (!valor) setConsulta("");
  };
  const ir = (href: string) => {
    cambiarAbierto(false);
    router.push(href);
  };

  const mensajeVacio = fallo
    ? "No se pudo cargar el buscador. Intenta de nuevo."
    : !indice || indice.entidadId !== entidadId
      ? "Cargando…"
      : consulta.trim()
        ? "No hay resultados en esta entidad."
        : "Escribe una descripción, un ocid o el seudónimo de un proveedor.";

  return (
    <>
      <Button variant="outline" className={CLASE_BOTON} onClick={() => setAbierto(true)}>
        <span className="flex items-center gap-2">
          <Search aria-hidden="true" className="size-4" />
          Buscar
        </span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-sans text-[0.7rem] sm:inline">Ctrl K</kbd>
      </Button>
      <CommandDialog
        open={abierto}
        onOpenChange={cambiarAbierto}
        title="Buscar"
        description="Busca procesos por descripción u ocid, y proveedores por su seudónimo, en la entidad seleccionada."
      >
        <Command shouldFilter={false}>
          <CommandInput value={consulta} onValueChange={setConsulta} placeholder="Descripción, ocid o proveedor…" />
          <CommandList>
            <CommandEmpty>{mensajeVacio}</CommandEmpty>
            {procesos.length > 0 && (
              <CommandGroup heading="Procesos">
                {procesos.map((r) => (
                  <CommandItem key={r.id} value={`proceso-${r.id}`} onSelect={() => ir(r.href)}>
                    <FileText aria-hidden="true" className="size-4" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{r.titulo}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {r.id} · {r.detalle}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {proveedores.length > 0 && (
              <CommandGroup heading="Proveedores">
                {proveedores.map((r) => (
                  <CommandItem key={r.id} value={`proveedor-${r.id}`} onSelect={() => ir(r.href)}>
                    <Building2 aria-hidden="true" className="size-4" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{r.titulo}</span>
                      <span className="truncate text-xs text-muted-foreground">{r.detalle}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

export function BuscadorCargando() {
  return (
    <Button variant="outline" className={CLASE_BOTON} disabled>
      <span className="flex items-center gap-2">
        <Search aria-hidden="true" className="size-4" />
        Buscar
      </span>
    </Button>
  );
}
