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
| `src/features/fichas/`, `src/features/explicacion/` | C · Sebastián |
| `src/features/revision/`, `src/features/etica/` | D · André |
| `data/publico/`, `data/local/` (los genera el pipeline) | A · Stefano |

Las rutas de `src/app/` siguen el mapa del `design.md` del Lote B (`openspec/changes/lote-b-base-web-panel-y-bandeja/design.md`). Para cambiar algo de otro dueño, se le propone mediante un PR.
