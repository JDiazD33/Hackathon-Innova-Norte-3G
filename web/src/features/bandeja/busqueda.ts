import { getSupplierIdentity } from "@/features/fichas";
import type { ModoPaquete, Proceso, Proveedor } from "@/lib/data/types";
import { formatFecha } from "@/lib/format";

export interface EntradaBusqueda {
  tipo: "proceso" | "proveedor";
  id: string;
  titulo: string;
  detalle: string;
  href: string;
  /** Texto normalizado en el que se busca. */
  texto: string;
}

/** Minúsculas, sin tildes y con espacios simples: "ADQUISICIÓN  de" → "adquisicion de". */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Índice de búsqueda de una entidad: sus procesos (por descripción y ocid) y los proveedores
 * que ganaron en ella. La identidad del proveedor sigue las reglas del Lote C, así que en modo
 * público solo se busca por seudónimo y una persona natural nunca se busca por su nombre.
 */
export function construirIndice(
  procesos: readonly Proceso[],
  proveedores: readonly Proveedor[],
  modo: ModoPaquete,
): EntradaBusqueda[] {
  const entradasProcesos = procesos.map((p) => ({
    tipo: "proceso" as const,
    id: p.ocid,
    titulo: p.descripcion,
    detalle: [p.metodo, p.fechas.convocatoria ? formatFecha(p.fechas.convocatoria) : null].filter(Boolean).join(" · "),
    href: `/procesos/${encodeURIComponent(p.ocid)}`,
    texto: normalizarTexto(`${p.descripcion} ${p.ocid}`),
  }));

  const ganadores = new Set(procesos.flatMap((p) => p.ganadores));
  const entradasProveedores = proveedores
    .filter((proveedor) => ganadores.has(proveedor.id))
    .map((proveedor) => {
      const identidad = getSupplierIdentity(proveedor, modo);
      const visible = [identidad.displayName, proveedor.alias, identidad.taxId].filter(Boolean).join(" ");
      return {
        tipo: "proveedor" as const,
        id: proveedor.id,
        titulo: identidad.displayName,
        detalle: identidad.taxId ? `Proveedor · RUC ${identidad.taxId}` : "Proveedor",
        href: `/proveedores/${encodeURIComponent(proveedor.id)}`,
        texto: normalizarTexto(visible),
      };
    });

  return [...entradasProcesos, ...entradasProveedores];
}

/**
 * Devuelve las entradas que contienen todas las palabras de la consulta. Primero las que
 * coinciden exactamente con un id, después las que empiezan con la consulta y luego el resto.
 */
export function buscar(indice: readonly EntradaBusqueda[], consulta: string, limite = 8): EntradaBusqueda[] {
  const normalizada = normalizarTexto(consulta);
  const palabras = normalizada.split(" ").filter(Boolean);
  if (palabras.length === 0) return [];

  const rango = (entrada: EntradaBusqueda) => {
    if (normalizarTexto(entrada.id) === normalizada) return 0;
    if (normalizarTexto(entrada.titulo).startsWith(normalizada)) return 1;
    return 2;
  };

  return indice
    .filter((entrada) => palabras.every((palabra) => entrada.texto.includes(palabra)))
    .map((entrada, posicion) => ({ entrada, posicion, rango: rango(entrada) }))
    .sort((a, b) => a.rango - b.rango || a.posicion - b.posicion)
    .slice(0, limite)
    .map(({ entrada }) => entrada);
}
