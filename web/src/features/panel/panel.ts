import type { ReviewState } from "@/features/revision";
import type { CategoriaSenal, CodigoSenal, Entidad, Proceso, Senal } from "@/lib/data/types";
import { CATEGORIA_LABELS } from "@/lib/etiquetas";
import { formatEntero, formatMes, formatPorcentaje } from "@/lib/format";

export interface CategoriaPanel {
  categoria: CategoriaSenal;
  etiqueta: string;
  cantidad: number;
}

export interface MesPanel {
  mes: string;
  etiqueta: string;
  procesos: number;
  conSenales: number;
}

export interface ProveedorPanel {
  proveedorId: string;
  nombre: string;
  participacion: number;
  adjudicaciones: number;
  /** Tiene la señal S03 (proveedor recurrente atípico) en esta entidad. */
  recurrenteAtipico: boolean;
}

export interface SenalEntidadPanel {
  id: string;
  codigo: CodigoSenal;
  valor: number;
  unidad: string;
}

/** Datos del panel que no dependen de las revisiones (se calculan en el servidor). */
export interface DatosPanel {
  entidad: Pick<Entidad, "id" | "nombre" | "tipo">;
  procesos: number;
  montoTotal: number;
  procesosConSenales: number;
  /** Procesos con prioridad: con ellos se cuentan las revisiones pendientes en el navegador. */
  ocidsConSenales: string[];
  porCategoria: CategoriaPanel[];
  tendencia: MesPanel[];
  topProveedores: ProveedorPanel[];
  senalesEntidad: SenalEntidadPanel[];
}

/**
 * Prepara el panel de una entidad. Las cifras base vienen de `entidad.resumen`, que calcula
 * el pipeline; aquí solo se ordenan, se etiquetan y se completan con nombres visibles.
 * `nombreProveedor` decide qué nombre mostrar (seudónimo en modo público).
 */
export function resumirPanel(
  entidad: Entidad,
  procesos: readonly Proceso[],
  senales: readonly Senal[],
  nombreProveedor: (proveedorId: string) => string,
): DatosPanel {
  const { resumen } = entidad;
  const porCategoria = (Object.entries(resumen.por_categoria) as [CategoriaSenal, number][])
    .filter(([, cantidad]) => cantidad > 0)
    .map(([categoria, cantidad]) => ({ categoria, etiqueta: CATEGORIA_LABELS[categoria], cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta, "es"));

  const tendencia = [...resumen.tendencia_mensual]
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map(({ mes, procesos: total, con_senales }) => ({ mes, etiqueta: formatMes(mes), procesos: total, conSenales: con_senales }));

  const conS03 = new Set(senales.filter((s) => s.codigo === "S03").map((s) => s.objeto.id));
  const topProveedores = resumen.top_proveedores.map(({ proveedor_id, participacion, adjudicaciones }) => ({
    proveedorId: proveedor_id,
    nombre: nombreProveedor(proveedor_id),
    participacion,
    adjudicaciones,
    recurrenteAtipico: conS03.has(proveedor_id),
  }));

  return {
    entidad: { id: entidad.id, nombre: entidad.nombre, tipo: entidad.tipo },
    procesos: resumen.procesos,
    montoTotal: resumen.monto_total,
    procesosConSenales: resumen.procesos_con_senales,
    ocidsConSenales: procesos.filter((p) => p.prioridad !== null).map((p) => p.ocid),
    porCategoria,
    tendencia,
    topProveedores,
    senalesEntidad: senales
      .filter((s) => s.nivel === "entidad")
      .map(({ id, codigo, valor, unidad }) => ({ id, codigo, valor, unidad })),
  };
}

/** Una revisión está pendiente mientras nadie decidió "justificada" ni "requiere atención". */
export function contarRevisionesPendientes(
  ocids: readonly string[],
  estadoDe: (ocid: string) => ReviewState,
): number {
  return ocids.filter((ocid) => {
    const estado = estadoDe(ocid);
    return estado === "sin_revisar" || estado === "en_revision";
  }).length;
}

const plural = (n: number, singular: string, varios: string) => `${formatEntero(n)} ${n === 1 ? singular : varios}`;

/** Resumen en texto del gráfico de señales por categoría. */
export function describirCategorias(categorias: readonly CategoriaPanel[]): string {
  if (categorias.length === 0) return "Esta entidad no tiene señales en el periodo.";
  return `${categorias.map((c) => `${c.etiqueta}: ${plural(c.cantidad, "señal", "señales")}`).join("; ")}.`;
}

/** Resumen en texto del gráfico de tendencia mensual. */
export function describirTendencia(tendencia: readonly MesPanel[]): string {
  if (tendencia.length === 0) return "No hay procesos convocados en el periodo.";
  const total = tendencia.reduce((suma, m) => suma + m.procesos, 0);
  const conSenales = tendencia.reduce((suma, m) => suma + m.conSenales, 0);
  const pico = tendencia.reduce((mayor, m) => (m.procesos > mayor.procesos ? m : mayor));
  const periodo =
    tendencia.length === 1 ? `En ${tendencia[0].etiqueta}` : `Entre ${tendencia[0].etiqueta} y ${tendencia.at(-1)!.etiqueta}`;
  return (
    `${periodo} se convocaron ${plural(total, "proceso", "procesos")}; ${plural(conSenales, "tiene", "tienen")} señales. ` +
    `El mes con más procesos fue ${pico.etiqueta} (${formatEntero(pico.procesos)}).`
  );
}

/** Resumen en texto de los proveedores con mayor participación. */
export function describirTopProveedores(proveedores: readonly ProveedorPanel[]): string {
  if (proveedores.length === 0) return "No hay adjudicaciones en el periodo.";
  return `${proveedores
    .map((p) => `${p.nombre}: ${formatPorcentaje(p.participacion, 1)} (${plural(p.adjudicaciones, "proceso", "procesos")})`)
    .join("; ")}.`;
}
