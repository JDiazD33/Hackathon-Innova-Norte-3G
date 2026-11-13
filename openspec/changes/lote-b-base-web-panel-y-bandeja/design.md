# Design

## Context

Aún no existe `web/`. El sistema de diseño (`docs/diseno/sistema-de-diseno.md`) define los tokens, las pantallas y las reglas de accesibilidad. El contrato del paquete de datos (`docs/arquitectura/contrato-paquete-de-datos.md`) define lo que se lee. Los lotes C y D construyen sobre esta base, así que la estructura de carpetas y las interfaces deben existir desde la Fase 0. La motivación está en `proposal.md`.

## Goals / Non-Goals

**Goals:**

- Una base sobre la que C y D trabajen en paralelo, cada uno en sus carpetas.
- Que la interfaz lea datos solo a través de `DataSource`, para cambiar de fixture a datos reales (o a una API futura) sin tocar las pantallas.
- Una demo que funcione igual desplegada y en local sin internet.

**Non-Goals:**

- Inicio de sesión real y backend propio (fase 2 de la ruta de escalamiento).
- Internacionalización: la interfaz solo está en español.
- Aplicación móvil nativa (ADR 0001).

## Decisions

1. **Next.js App Router con Server Components que leen el paquete del disco.** `StaticDataSource` lee los JSON de `web/data/<paquete>`, donde la variable `PAQUETE_DATOS` elige el paquete: `fixture` por defecto, `publico` para el despliegue y `local` para las sesiones de validación. La lista es cerrada, así que no se puede leer fuera de `web/data/`. Las lecturas se cachean con `"use cache"` y `cacheLife("max")`, porque el paquete solo cambia al regenerarlo; ver la guía de Cache Components de Next 16 en `web/node_modules/next/dist/docs/`. Las partes interactivas son componentes cliente que reciben los datos ya cargados: filtros, búsqueda, rol y revisiones.
   - *Alternativa:* exportación estática con carga en el navegador. Se descartó porque obliga a pregenerar miles de rutas `/procesos/[ocid]` o a usar URLs con parámetros.
   - *Alternativa:* rutas API. No hacen falta en el MVP.
2. **Despliegue en Vercel con el paquete público incluido.** Como la ruta está acotada a `web/data/`, el build de Next rastrea esos archivos y los incluye solo; se comprobó el 13 de noviembre en `.next/server/app/page.js.nft.json`. Por eso nunca se despliega desde una máquina que tenga `web/data/local/`. En la demo local se ejecuta `npm run build` y luego `npm run start` con el Wi-Fi apagado.
3. **Tema con los tokens de shadcn/ui y `next-themes`.** Los colores del sistema de diseño se escriben como variables CSS en `globals.css`, en modo claro y oscuro. Los colores de prioridad y de estado son tokens propios (`--prioridad-alta`, `--estado-requiere-atencion`, etc.) que C y D usan sin redefinir.
4. **Bandeja con TanStack Table en el cliente.** La entidad seleccionada trae sus procesos con señales, que suelen ser cientos y no miles. El orden y los filtros se resuelven en el navegador, sin volver al servidor.
5. **Buscador con el componente Command de shadcn/ui** sobre un índice en memoria de la entidad (descripción, ocid y seudónimo). Se descartó una librería de búsqueda difusa por ser innecesaria para el volumen del MVP.
6. **Nombre del producto en `src/config/producto.ts`.** Es el único lugar donde está; las pantallas lo importan (ADR 0006).
7. **Pruebas con Vitest y Testing Library** para la lógica y los componentes, y **ESLint** con las reglas de Next.js. La accesibilidad se revisa con la lista del sistema de diseño.

## Estructura de carpetas y dueños

```text
web/
  data/fixture/                        B  (fixture sintético, versionado)
  data/publico/                        A  (paquete público, versionado tras revisión)
  data/local/                          A  (paquete local, nunca versionado)
  src/app/(app)/layout.tsx             B  estructura común
  src/app/(app)/page.tsx               B  panel
  src/app/(app)/senales/page.tsx       B  bandeja
  src/app/(app)/procesos/[ocid]/       C
  src/app/(app)/proveedores/[id]/      C
  src/app/(app)/revision/              D
  src/app/(app)/metodologia/           D
  src/app/reporte/[ocid]/              D  (sin la estructura común, para imprimir)
  src/components/ui/                   B  componentes de shadcn/ui
  src/components/layout/               B
  src/lib/data/                        B  DataSource, StaticDataSource y tipos del contrato
  src/lib/format.ts                    B  formatos de soles, fechas y porcentajes
  src/features/panel/, bandeja/        B
  src/features/fichas/, explicacion/   C
  src/features/revision/, etica/       D
  src/config/producto.ts               B
contracts/paquete-de-datos.schema.json B (con A)
```

Un lote solo modifica las carpetas de otro mediante un PR que ese dueño revisa.

## Risks / Trade-offs

- [El paquete de una entidad grande vuelve lenta la bandeja] → paginar en el servidor o limitar la carga inicial a la prioridad alta y media.
- [Vercel no incluye los JSON en el despliegue] → comprobarlo en la parte B5 desde otro dispositivo. Si falla, alternativa: generar las páginas de las entidades en el build.
- [El tema no cumple el contraste en modo oscuro] → verificar cada par de colores en la parte B1, antes de que C y D construyan encima.

## Migration Plan

No aplica: es un proyecto nuevo. El despliegue se publica desde `main`, y para volver atrás se redespliega la versión anterior en Vercel.
