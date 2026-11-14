import { BookOpen, ClipboardCheck, LayoutDashboard, ListFilter, type LucideIcon } from "lucide-react";

export type GrupoNavegacion = "Revisar" | "Información";

export interface ItemNavegacion {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
  /** Título del grupo en la barra lateral (HIG · Sidebars: como máximo dos niveles). */
  grupo: GrupoNavegacion;
}

/** Secciones de la navegación principal (docs/diseno/sistema-de-diseno.md). Las fichas se abren desde ellas. */
export const NAVEGACION: readonly ItemNavegacion[] = [
  { href: "/", etiqueta: "Panel", icono: LayoutDashboard, grupo: "Revisar" },
  { href: "/senales", etiqueta: "Señales", icono: ListFilter, grupo: "Revisar" },
  { href: "/revision", etiqueta: "Revisión", icono: ClipboardCheck, grupo: "Revisar" },
  { href: "/metodologia", etiqueta: "Metodología", icono: BookOpen, grupo: "Información" },
];

export const GRUPOS_NAVEGACION: readonly GrupoNavegacion[] = ["Revisar", "Información"];

export function esRutaActiva(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
