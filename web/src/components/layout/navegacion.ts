import { BookOpen, ClipboardCheck, LayoutDashboard, ListFilter, type LucideIcon } from "lucide-react";

export interface ItemNavegacion {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
}

/** Secciones de la barra lateral (docs/diseno/sistema-de-diseno.md). Las fichas se abren desde ellas. */
export const NAVEGACION: readonly ItemNavegacion[] = [
  { href: "/", etiqueta: "Panel", icono: LayoutDashboard },
  { href: "/senales", etiqueta: "Señales", icono: ListFilter },
  { href: "/revision", etiqueta: "Revisión", icono: ClipboardCheck },
  { href: "/metodologia", etiqueta: "Metodología", icono: BookOpen },
];

export function esRutaActiva(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
