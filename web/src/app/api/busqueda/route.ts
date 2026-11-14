import type { NextRequest } from "next/server";

import { cargarIndiceBusqueda } from "@/features/bandeja/cargar";
import { esIdSeguro } from "@/lib/data/types";

/** GET /api/busqueda?entidad=entidad-0001 → índice del buscador de esa entidad. */
export async function GET(request: NextRequest) {
  const entidad = request.nextUrl.searchParams.get("entidad") ?? "";
  if (!esIdSeguro(entidad)) {
    return Response.json({ error: "Entidad no válida." }, { status: 400 });
  }
  return Response.json(await cargarIndiceBusqueda(entidad));
}
