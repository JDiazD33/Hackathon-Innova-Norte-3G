# web · Aplicación

Next.js 16 (App Router con Cache Components) + React 19 + TypeScript + Tailwind CSS 4. Pruebas con Vitest.

> **Antes de escribir código de Next.js**, lee el `AGENTS.md` de esta carpeta. Next 16 trae cambios respecto de versiones anteriores, y sus guías están en `node_modules/next/dist/docs/`.

## Comandos (desde `web/`)

| Comando | Qué hace |
|---|---|
| `npm ci` | Instala las dependencias exactas |
| `npm run dev` | Servidor de desarrollo en http://localhost:3000 con el fixture |
| `npm test` | Pruebas (Vitest) |
| `npm run typecheck` | Genera los tipos de rutas de Next (`next typegen`) y revisa los tipos; funciona en una copia recién clonada |
| `npm run lint` | ESLint |
| `npm run build` y `npm run start` | Build de producción y demo local (ya construida, funciona sin internet) |
| `npm run fixture` | Regenera `data/fixture/` (datos ficticios, siempre iguales) |

## Datos

- La app lee `data/<paquete>/`, según la variable `PAQUETE_DATOS`: `fixture` (por defecto), `publico` o `local`.
- Las pantallas leen solo a través de `getDataSource()` de `src/lib/data`; nunca leen los JSON directamente.
- Contrato: `../docs/arquitectura/contrato-paquete-de-datos.md` y `../contracts/paquete-de-datos.schema.json`.
- Para validar un paquete: `PAQUETE_DIR=data/publico npm test -- paquete`.
- `data/local/` contiene nombres reales: nunca se sube ni se despliega.

## Carpetas y dueños

| Carpeta | Dueño |
|---|---|
| `src/lib/data/`, `src/lib/format.ts`, `src/config/`, `src/app/layout.tsx`, `data/fixture/`, `scripts/` | B · Joaquín |
| `src/features/panel/`, `src/features/bandeja/` | B · Joaquín |
| `src/components/ui/` (shadcn/ui), `src/components/layout/`, `src/components/estado/`, `src/lib/revisiones.ts`, `src/lib/entidad.ts`, `src/lib/etiquetas.ts`, `src/app/(app)/layout.tsx`, `src/app/api/busqueda/` | B · Joaquín |
| `src/features/fichas/`, `src/features/explicacion/` | C · Sebastián |
| `src/features/revision/`, `src/features/etica/` | D · André |
| `data/publico/`, `data/local/` (los genera el pipeline) | A · Stefano |

Las rutas de `src/app/` siguen el mapa del `design.md` del Lote B (`openspec/changes/lote-b-base-web-panel-y-bandeja/design.md`). Para cambiar algo de otro dueño, se le propone mediante un PR.

## Cómo crear una pantalla

Prisma sigue el lenguaje visual descrito en [`docs/diseno/sistema-de-diseno.md`](../docs/diseno/sistema-de-diseno.md) ([ADR 0008](../docs/adr/0008-prisma-y-diseno-inspirado-en-apple.md)): **el contenido va en superficies sólidas y los controles flotan en vidrio**.

1. La ruta va dentro de `src/app/(app)/`, así hereda la barra lateral, la barra superior, la barra de pestañas del celular y el pie.
2. Los datos se leen en el servidor con funciones `cargar*` que usan `"use cache"` y `cacheLife("max")`. Hay ejemplos en `src/features/panel/cargar.ts` y `src/features/bandeja/cargar.ts`.
3. La entidad seleccionada viene en `?entidad=`. Para leerla, la página envuelve su contenido en `<Suspense>` y usa `elegirEntidad` de `src/lib/entidad.ts`. Ver `src/app/(app)/page.tsx`.
4. Lo interactivo va en componentes cliente (`"use client"`). El estado de revisión se lee con `useRevisiones()` de `src/lib/revisiones.ts`.
5. **Cada página abre con `TituloDePagina`** (`src/components/layout/titulo-de-pagina.tsx`): título grande, una frase que explica qué se ve y, a la derecha, las acciones (un solo botón prominente).
6. **Componentes:** los compartidos (`PrioridadBadge`, `EstadoRevisionBadge` y `SinDatos`, en `src/components/estado/`) y los de shadcn/ui (en `src/components/ui/`), incluidos `Tabs` y `ControlSegmentado`. No los copies ni los reestilices: si necesitas otra variante, pídela al Lote B.
7. **Solo tokens, nada de colores ni medidas sueltas:**
   - color: `bg-card`, `text-muted-foreground`, `bg-prioridad-alta`, `text-estado-requiere-atencion-foreground`… El rojo es solo para "requiere atención";
   - texto: `text-titulo-grande` … `text-leyenda` (o la escala de Tailwind, que está reasignada a la misma);
   - formas: `rounded-tarjeta`, `rounded-item`, `rounded-full`, `shadow-tarjeta`;
   - vidrio: `material-barra`, `material-menu` o `material-hoja`, **solo** en controles y navegación;
   - movimiento: `duration-200 ease-prisma`, y `motion-safe:` para cualquier escala o desplazamiento.
8. Une clases con `cn` de `@/lib/utils`, que conoce la escala de Prisma.
9. Revisa la pantalla en claro y oscuro, a 375, 768 y 1280 px y solo con el teclado.

### Plantilla de página Prisma

```tsx
// src/app/(app)/mi-pantalla/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";

import { SinDatos } from "@/components/estado/sin-datos";
import { TituloDePagina } from "@/components/layout/titulo-de-pagina";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cargarEntidades } from "@/lib/data/cached";
import { elegirEntidad, PARAM_ENTIDAD } from "@/lib/entidad";

export const metadata: Metadata = { title: "Mi pantalla" }; // la pestaña dice "Mi pantalla · Prisma"

export default function PaginaMiPantalla({ searchParams }: PageProps<"/mi-pantalla">) {
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-tarjeta" />}>
      <MiPantalla searchParams={searchParams} />
    </Suspense>
  );
}

async function MiPantalla({ searchParams }: Pick<PageProps<"/mi-pantalla">, "searchParams">) {
  const [parametros, entidades] = await Promise.all([searchParams, cargarEntidades()]);
  const entidad = elegirEntidad(entidades, parametros[PARAM_ENTIDAD]);
  if (!entidad) return <SinDatos titulo="Sin datos" mensaje="El paquete de datos no tiene entidades para mostrar." />;

  return (
    <div className="flex flex-col gap-8">
      <TituloDePagina titulo="Mi pantalla" descripcion={`Qué se ve aquí, para ${entidad.nombre}.`} />
      <section aria-labelledby="seccion-1" className="flex flex-col gap-3">
        <h2 id="seccion-1" className="text-titulo-2">Una sección</h2>
        <Card>
          <CardHeader>
            <CardTitle>El título dice la conclusión</CardTitle>
            <CardDescription>Una línea de contexto.</CardDescription>
          </CardHeader>
          <CardContent className="text-base">El contenido va en superficies sólidas.</CardContent>
        </Card>
      </section>
    </div>
  );
}
```
