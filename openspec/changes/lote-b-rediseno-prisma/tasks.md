# Tasks

Lote B · Rediseño Prisma · **Joaquín (líder)** · carpetas de B en `web/` · encargo en `docs/plan/fase-1/lote-b-joaquin.md`

## 1. B5 · Parte 5: base Prisma (dom 15, rama `lote-b/parte-5-prisma-base`)

- [x] 1.1 Crear el change `lote-b-rediseno-prisma` (proposal, design, specs y tasks). Verificar con `openspec validate --all --strict`.
- [x] 1.2 Cambiar el nombre a Prisma en `src/config/producto.ts`, crear `src/app/icon.svg` y `src/app/apple-icon.png` (180 × 180), y actualizar el nombre en `README.md` y en los documentos que lo usen. Verificar que la pestaña dice "Panel · Prisma" y que `/icon.svg` y `/apple-icon.png` responden.
- [x] 1.3 Cambiar la tipografía: Inter con `next/font/google` como `--font-inter`, la pila del sistema en `@theme`, la escala de estilos en `rem` y sin Geist. Verificar en el HTML del build que no hay peticiones a fuentes externas y que el texto crece con el zoom al 200 %.
- [x] 1.4 Reemplazar los tokens de color en claro y oscuro y agregar a `theme-contrast.test.ts` los pares nuevos con texto. Verificar con `npm test -- theme-contrast` en verde.
- [ ] 1.5 Agregar los materiales (`material-barra`, `material-menu`, `material-hoja`), los radios, las sombras y la curva de movimiento, con sus alternativas para `@supports not`, reducir transparencia, más contraste y reducir movimiento. Verificar emulando cada preferencia en el navegador.
  - Parte 5: las tres alternativas del vidrio y la regla de reducir movimiento están en el CSS del build (`@supports not`, `prefers-reduced-transparency`, `prefers-contrast: more` y `prefers-reduced-motion`). Falta emularlas en un navegador con las preferencias del sistema: el panel de pruebas no las emula.
- [x] 1.6 Construir la estructura: `Armazon` con barra lateral flotante que se puede ocultar, barra superior en vidrio, `TituloDePagina`, `BarraDePestanas` en el celular, hoja en tablet y pie discreto. Verificar a 375, 768 y 1280 px, solo con el teclado.
- [x] 1.7 Dar la apariencia nueva a los componentes de shadcn/ui (botón, tarjeta, insignia, campo, select, diálogo, hoja, paleta, tabla, tooltip, skeleton, popover, menú, casilla y área de texto) y agregar `tabs.tsx` como control segmentado. Verificar que typecheck y las pruebas pasan sin cambiar props.
- [x] 1.8 Dar la apariencia nueva a `PrioridadBadge`, `EstadoRevisionBadge` y `SinDatos` con las mismas props. Verificar con una prueba de componente que muestran ícono y texto.
- [x] 1.9 Actualizar `docs/diseno/sistema-de-diseno.md` (color, tipografía, materiales, estructura y componentes) y "Cómo crear una pantalla" en `web/README.md` con una plantilla de página Prisma. Verificar que los tokens y componentes citados existen en el código.
- [ ] 1.10 Abrir el PR de la parte 5 con capturas de antes y después y avisar a Sebastián y André. Verificar que el PR lista las comprobaciones en verde.

## 2. B6 · Parte 6: panel y bandeja (lun 16, rama `lote-b/parte-6-prisma-panel-y-bandeja`)

- [ ] 2.1 Rediseñar el panel: título grande con la entidad, cifras como widgets, aviso de S05, gráficos con título que dice la conclusión y proveedores en lista agrupada. Verificar en claro y oscuro a 375 y 1280 px.
- [ ] 2.2 Rediseñar la bandeja: barra de filtros fija en vidrio con control segmentado de prioridad, botones emergentes, fechas en un popover y "Limpiar filtros" plano; tabla en estilo lista en escritorio y filas con chevron en el celular. Verificar que los filtros siguen pasando `bandeja.test.ts`.
- [ ] 2.3 Estados de carga y vacíos del panel y la bandeja con ícono, título breve y acción. Verificar en el navegador con un filtro sin resultados.
- [ ] 2.4 Tarea 4.2 del Lote B: pruebas de componente de los filtros con Testing Library. Verificar con `npm test -- filtros`.

## 3. Verificación del lote

- [ ] 3.1 Desde `web/`: `npm run typecheck`, `npm run lint`, `npm test` y `npm run build` en verde; revisar claro y oscuro a 375, 768 y 1280 px, solo con el teclado, con zoom al 200 % y con reducir movimiento, reducir transparencia y alto contraste. Verificar con `git ls-files` que no hay archivos de SF Pro, SF Symbols ni recursos de Apple.

## Workflow follow-up

- Archivar el change con `openspec-archive-change` cuando las partes 5 y 6 estén en `main`.
