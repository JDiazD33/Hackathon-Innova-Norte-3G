import type { NextRequest } from "next/server";

import { cargarIndiceBusqueda } from "@/features/bandeja/cargar";
import { cargarEntidades } from "@/lib/data/cached";
import { esIdSeguro } from "@/lib/data/types";

/**
 * GET /api/busqueda?entidad=entidad-0001 → índice del buscador de esa entidad.
 * - 400 si el id no tiene un formato seguro.
 * - 404 si la entidad no está en el paquete. Se comprueba antes de leer el índice para que ids
 *   inventados no llenen la caché (prueba de seguridad, parte 9).
 */
export async function GET(request: NextRequest) {
  const entidad = request.nextUrl.searchParams.get("entidad") ?? "";
  if (!esIdSeguro(entidad)) {
    return Response.json({ error: "Entidad no válida." }, { status: 400 });
  }
  const entidades = await cargarEntidades();
  if (!entidades.some((e) => e.id === entidad)) {
    return Response.json({ error: "Entidad no encontrada." }, { status: 404 });
  }
  return Response.json(await cargarIndiceBusqueda(entidad));
}
