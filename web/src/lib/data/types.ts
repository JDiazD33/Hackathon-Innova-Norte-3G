/**
 * Tipos del contrato del paquete de datos v1.
 * Fuente de verdad: contracts/paquete-de-datos.schema.json y
 * docs/arquitectura/contrato-paquete-de-datos.md. Dueño: Lote B (con el Lote A).
 * Si cambias algo aquí, cambia también el schema, el documento y el fixture.
 */

export type ModoPaquete = "publico" | "local";

export type CodigoSenal = "S01" | "S02" | "S03" | "S04" | "S05" | "S06" | "S07" | "S08";

export type CategoriaSenal =
  | "competencia"
  | "tiempos"
  | "concentracion"
  | "fraccionamiento"
  | "ejecucion"
  | "reputacional"
  | "trazabilidad";

export type NivelPrioridad = "alta" | "media" | "baja";

export type NivelSenal = "proceso" | "proveedor_entidad" | "grupo" | "entidad" | "expediente";

export type ObjetoProceso = "bienes" | "servicios" | "obras" | "consultoria_de_obras" | "otro";

export type TipoProveedor = "persona_juridica" | "persona_natural" | "desconocido";

export interface Manifest {
  version_contrato: string;
  version_reglas: string;
  generado: string;
  fecha_corte: string;
  fuente: { nombre: string; url: string; archivos: string[] };
  licencia: string;
  atribucion: string;
  region: string;
  anios: number[];
  modo: ModoPaquete;
  conteos: { procesos: number; senales: number; proveedores: number; entidades: number };
  exclusiones: { motivo: string; cantidad: number }[];
  correcciones: { tipo: string; cantidad: number }[];
  senales_activas: CodigoSenal[];
  senales_desactivadas: { codigo: CodigoSenal; motivo: string }[];
  prioridad: {
    pesos: Partial<Record<CodigoSenal, number>>;
    cortes: { alta: number; media: number };
  };
}

export interface ResumenEntidad {
  procesos: number;
  monto_total: number;
  procesos_con_senales: number;
  por_categoria: Partial<Record<CategoriaSenal, number>>;
  tendencia_mensual: { mes: string; procesos: number; con_senales: number }[];
  top_proveedores: { proveedor_id: string; participacion: number; adjudicaciones: number }[];
}

export interface Entidad {
  id: string;
  nombre: string;
  tipo: string;
  resumen: ResumenEntidad;
  senales_entidad: string[];
}

export interface Prioridad {
  puntaje: number;
  nivel: NivelPrioridad;
  desglose: { codigo: CodigoSenal; peso: number }[];
}

export interface FechasProceso {
  convocatoria: string | null;
  inicio_presentacion: string | null;
  fin_presentacion: string | null;
  adjudicacion: string | null;
  contrato: string | null;
  culminacion: string | null;
}

export interface Documento {
  tipo: string;
  titulo: string;
  url: string;
}

export interface Proceso {
  ocid: string;
  entidad_id: string;
  descripcion: string;
  metodo: string;
  objeto: ObjetoProceso;
  moneda: string;
  monto_referencial: number | null;
  monto_adjudicado: number | null;
  monto_final: number | null;
  fechas: FechasProceso;
  numero_postores: number | null;
  estado: string | null;
  ganadores: string[];
  documentos: Documento[];
  url_seace: string | null;
  senales: string[];
  prioridad: Prioridad | null;
  simulado: boolean;
}

export interface Comparacion {
  descripcion: string;
  ambito: "region" | "nacional";
  n: number | null;
  q1: number | null;
  mediana: number | null;
  q3: number | null;
  valla_superior: number | null;
  /** Porcentaje (0–100) de casos del grupo con un valor igual o menor que el del caso. */
  percentil_del_caso: number | null;
  /** Proporción (0–1) de referencia del grupo; por ejemplo, la de procesos con 2 o más postores en S01. */
  proporcion_referencia: number | null;
}

export interface Senal {
  id: string;
  codigo: CodigoSenal;
  categoria: CategoriaSenal;
  nivel: NivelSenal;
  objeto: { tipo: "proceso" | "proveedor" | "entidad" | "grupo" | "expediente"; id: string };
  ocids: string[];
  valor: number;
  unidad: string;
  umbral: { operador: "igual" | "menor_que" | "mayor_que" | "mayor_o_igual"; valor: number; descripcion: string };
  comparacion: Comparacion | null;
  referencia: { cardinal: string | null; ocp: string | null };
  version_regla: string;
  entradas: Record<string, unknown>;
  calidad: string[];
  simulado: boolean;
}

export interface Proveedor {
  id: string;
  alias: string;
  nombre: string | null;
  ruc: string | null;
  tipo: TipoProveedor;
  url_ficha_unica: string | null;
}

export type EtapaExpediente = "requerimiento" | "evaluacion" | "conformidad" | "pago";

export interface Expediente {
  ocid: string;
  simulado: true;
  etapas: { etapa: EtapaExpediente; responsable: string; fecha: string | null; documento: string | null }[];
}

export interface Indice {
  /** ocid → id de la entidad dueña del proceso. */
  procesos: Record<string, string>;
  /** id del proveedor → ids de las entidades donde ganó procesos. */
  proveedores: Record<string, string[]>;
}

/** Identificadores aceptados en rutas y nombres de archivo (evita recorrer carpetas). */
export const PATRON_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function esIdSeguro(id: string): boolean {
  return PATRON_ID.test(id) && !id.includes("..");
}
