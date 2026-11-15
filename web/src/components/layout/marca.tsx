import Link from "next/link";

import { producto } from "@/config/producto";
import { cn } from "@/lib/utils";

/**
 * Ícono de Prisma: el triángulo facetado del logo, sin fondo. Es el mismo dibujo de src/app/icon.svg.
 * Las tres caras usan los tokens de marca (la azul marino se aclara en modo oscuro para no perderse
 * sobre negro); las esquinas son tonos fijos del logo.
 */
export function IconoPrisma({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 530 458" className={cn("h-7 w-8 shrink-0", className)}>
      <path d="M213 90 265 180 157 368 0 458Z" className="fill-marca-izquierda" />
      <path d="M0 458 157 368 105 458Z" className="fill-marca-base" fillOpacity={0.75} />
      <path d="M265 0 213 90 265 180Z" fill="#2a7396" />
      <path d="M265 0 317 90 265 180Z" fill="#5fabb8" />
      <path d="M317 90 265 180 372 368 478 368Z" className="fill-marca-derecha" />
      <path d="M478 368 372 368 530 458Z" fill="#62b9b9" />
      <path d="M372 368 530 458 422 458Z" fill="#3d7fa3" />
      <path d="M157 368 372 368 422 458 105 458Z" className="fill-marca-base" />
    </svg>
  );
}

/**
 * Marca de la barra lateral: el triángulo y el nombre, tomados de src/config/producto.ts. La frase del
 * producto queda como descripción del enlace (se lee al pasar el mouse y con lector de pantalla).
 */
export function Marca() {
  return (
    <Link
      href="/"
      title={producto.frase}
      className="flex min-w-0 items-center gap-2.5 rounded-item px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <IconoPrisma className="h-6 w-7" />
      <span className="text-[1.0625rem] leading-6 font-bold tracking-[-0.01em] text-sidebar-primary">
        {producto.nombre}
      </span>
      <span className="sr-only">: {producto.frase}</span>
    </Link>
  );
}
