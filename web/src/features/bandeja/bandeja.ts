import type { ReviewState } from "@/features/revision";
import type {
  CategoriaSenal,
  CodigoSenal,
  NivelPrioridad,
  ObjetoProceso,
  Prioridad,
  Proceso,
  Senal,
} from "@/lib/data/types";
import { CATEGORIA_LABELS, ORDEN_NIVELES } from "@/lib/etiquetas";

export interface SenalFila {
  id: string;
  codigo: CodigoSenal;
  categoria: CategoriaSenal;
  simulado: boolean;
}

/** Una fila de la bandeja: un proceso con prioridad de revisión. */
export interface FilaBandeja {
  ocid: string;
  descripcion: string;
  metodo: string;
  objeto: ObjetoProceso;
  fechaConvocatoria: string | null;
  montoReferencial: number | null;
  prioridad: Prioridad;
  senales: SenalFila[];
}

/** Solo los procesos con señales entran a la bandeja. Las señales se resuelven por id. */
export function construirFilas(procesos: readonly Proceso[], senales: readonly Senal[]): FilaBandeja[] {
  const porId = new Map(senales.map((s) => [s.id, s]));
  return procesos.flatMap((p) => {
    if (!p.prioridad) return [];
    const senalesFila = p.senales.flatMap((id) => {
      const s = porId.get(id);
      return s ? [{ id: s.id, codigo: s.codigo, categoria: s.categoria, simulado: s.simulado }] : [];
    });
    return [
      {
        ocid: p.ocid,
        descripcion: p.descripcion,
        metodo: p.metodo,
        objeto: p.objeto,
        fechaConvocatoria: p.fechas.convocatoria,
        montoReferencial: p.monto_referencial,
        prioridad: p.prioridad,
        senales: senalesFila,
      },
    ];
  });
}

/** Mayor puntaje primero; si empatan, la convocatoria más reciente; sin fecha, al final. */
export function ordenarFilas(filas: readonly FilaBandeja[]): FilaBandeja[] {
  return [...filas].sort((a, b) => {
    if (b.prioridad.puntaje !== a.prioridad.puntaje) return b.prioridad.puntaje - a.prioridad.puntaje;
    if (a.fechaConvocatoria !== b.fechaConvocatoria) {
      if (a.fechaConvocatoria === null) return 1;
      if (b.fechaConvocatoria === null) return -1;
      return b.fechaConvocatoria.localeCompare(a.fechaConvocatoria);
    }
    return a.ocid.localeCompare(b.ocid);
  });
}

export interface FiltrosBandeja {
  prioridades: NivelPrioridad[];
  categorias: CategoriaSenal[];
  metodos: string[];
  /** Fechas de convocatoria, inclusivas, en formato AAAA-MM-DD. */
  desde: string | null;
  hasta: string | null;
  estados: ReviewState[];
}

export const FILTROS_VACIOS: FiltrosBandeja = {
  prioridades: [],
  categorias: [],
  metodos: [],
  desde: null,
  hasta: null,
  estados: [],
};

export function hayFiltrosActivos(filtros: FiltrosBandeja): boolean {
  return (
    filtros.prioridades.length > 0 ||
    filtros.categorias.length > 0 ||
    filtros.metodos.length > 0 ||
    filtros.desde !== null ||
    filtros.hasta !== null ||
    filtros.estados.length > 0
  );
}

/**
 * Se combinan los distintos tipos de filtro (y); dentro de un tipo basta con que coincida
 * una opción (o). Con un rango de fechas, los procesos sin fecha de convocatoria quedan fuera.
 */
export function filtrarFilas(
  filas: readonly FilaBandeja[],
  filtros: FiltrosBandeja,
  estadoDe: (ocid: string) => ReviewState,
): FilaBandeja[] {
  return filas.filter((fila) => {
    if (filtros.prioridades.length > 0 && !filtros.prioridades.includes(fila.prioridad.nivel)) return false;
    if (filtros.categorias.length > 0 && !fila.senales.some((s) => filtros.categorias.includes(s.categoria))) return false;
    if (filtros.metodos.length > 0 && !filtros.metodos.includes(fila.metodo)) return false;
    if (filtros.desde !== null || filtros.hasta !== null) {
      const fecha = fila.fechaConvocatoria?.slice(0, 10) ?? null;
      if (fecha === null) return false;
      if (filtros.desde !== null && fecha < filtros.desde) return false;
      if (filtros.hasta !== null && fecha > filtros.hasta) return false;
    }
    if (filtros.estados.length > 0 && !filtros.estados.includes(estadoDe(fila.ocid))) return false;
    return true;
  });
}

export interface OpcionesFiltro {
  prioridades: NivelPrioridad[];
  categorias: { categoria: CategoriaSenal; etiqueta: string }[];
  metodos: string[];
}

/** Opciones que tienen sentido para las filas actuales (no se ofrecen filtros vacíos). */
export function opcionesDeFiltro(filas: readonly FilaBandeja[]): OpcionesFiltro {
  const niveles = new Set(filas.map((f) => f.prioridad.nivel));
  const categorias = new Set(filas.flatMap((f) => f.senales.map((s) => s.categoria)));
  const metodos = new Set(filas.map((f) => f.metodo));
  return {
    prioridades: ORDEN_NIVELES.filter((n) => niveles.has(n)),
    categorias: [...categorias]
      .map((categoria) => ({ categoria, etiqueta: CATEGORIA_LABELS[categoria] }))
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, "es")),
    metodos: [...metodos].sort((a, b) => a.localeCompare(b, "es")),
  };
}
