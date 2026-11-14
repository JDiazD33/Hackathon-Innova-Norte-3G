import Link from "next/link";

import { producto } from "@/config/producto";
import { cn } from "@/lib/utils";

/**
 * Ícono de Prisma: un prisma que separa un rayo en tres haces. Es propio (no usa logos ni símbolos de
 * Apple) y es el mismo dibujo de src/app/icon.svg, sin el fondo, que aquí pone el degradado de la marca.
 */
export function IconoPrisma({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-[0.4375rem] bg-linear-to-br from-marca-inicio to-marca-fin",
        className,
      )}
    >
      <svg viewBox="0 0 64 64" className="size-full" fill="none" strokeLinecap="round" strokeWidth={3.2}>
        <path d="M5 35 L19.6 31" stroke="#ffffff" />
        <path d="M19.6 31 L34.2 29.5" stroke="#ffffff" strokeOpacity={0.75} strokeWidth={2.4} />
        <path d="M27 12 L41 47 H13 Z" fill="#ffffff" fillOpacity={0.2} stroke="#ffffff" strokeLinejoin="round" />
        <path d="M34.5 29.5 L56 22" stroke="#b8e0ff" />
        <path d="M34.5 29.5 L57 31" stroke="#9ff0d4" />
        <path d="M34.5 29.5 L55 40" stroke="#ffe08a" />
      </svg>
    </span>
  );
}

/** Marca de la barra lateral: ícono, nombre y frase, tomados de src/config/producto.ts. */
export function Marca() {
  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-2.5 rounded-item px-1.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <IconoPrisma />
      <span className="flex min-w-0 flex-col">
        <span className="text-encabezado text-sidebar-foreground">{producto.nombre}</span>
        <span className="line-clamp-2 text-leyenda text-muted-foreground">{producto.frase}</span>
      </span>
    </Link>
  );
}
