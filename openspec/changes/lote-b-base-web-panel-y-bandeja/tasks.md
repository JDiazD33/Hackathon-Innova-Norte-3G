# Tasks

Lote B · Base web, panel y bandeja · **Joaquín (líder)** · ★★★ · carpetas de B en `web/` y `contracts/` · plan en `docs/plan/cronograma-y-lotes.md`

## 1. B1 · Base web (Fase 0, sáb 14)

- [x] 1.1 Crear `web/` con create-next-app (TypeScript, App Router, Tailwind CSS, ESLint, carpeta `src/`) y anotar en `CONTRIBUTING.md` la versión de Next.js y los comandos reales. Verificar que `npm run build` termina sin errores.
- [x] 1.2 Configurar Vitest y Testing Library. Verificar con una prueba de ejemplo que `npm test` pasa.
- [x] 1.3 Inicializar shadcn/ui y agregar los componentes base del sistema de diseño. Verificar que una página de prueba los muestra en modo claro y oscuro.
- [x] 1.4 Definir en `globals.css` los tokens de color, de prioridad y de estado, la tipografía y el modo oscuro. Verificar con una herramienta de contraste que todos los pares de texto llegan a 4,5:1.
- [x] 1.5 Construir la estructura común: barra lateral, cabecera (entidad, buscador, espacio para el rol, fecha de corte y modo demostración) y pie. Verificar navegando solo con el teclado y revisando la vista a 375, 768 y 1280 px.
- [x] 1.6 Crear `src/config/producto.ts` con el nombre provisional y la estructura de carpetas por lote del `design.md`. Verificar que el nombre aparece en la cabecera y en el título de la pestaña.

## 2. B2 · Contrato y acceso a datos (Fase 0, sáb 14)

- [x] 2.1 Escribir `contracts/paquete-de-datos.schema.json` a partir del contrato v1, junto con el Lote A. Verificar con `npm test -- paquete` que el fixture valida y que un paquete roto falla.
- [x] 2.2 Crear el fixture sintético en `web/data/fixture/`: 2 entidades, unos 40 procesos, todas las señales y un expediente simulado. Verificar que valida contra el schema.
- [x] 2.3 Definir la interfaz `DataSource` y los tipos del contrato, e implementar `StaticDataSource` con `PAQUETE_DATOS`. Verificar con pruebas unitarias sobre el fixture.

## 3. B3 · Panel de la entidad

- [x] 3.1 Implementar el selector de entidad, que actualiza todo el panel. Verificar alternando entre las dos entidades del fixture.
- [x] 3.2 Mostrar las cifras clave y las señales por categoría. Verificar contra conteos hechos a mano sobre el fixture.
- [x] 3.3 Mostrar la tendencia mensual y los cinco proveedores con mayor participación, cada gráfico con su resumen en texto. Verificar con el fixture y recorriendo la pantalla con el teclado.

## 4. B4 · Bandeja y búsqueda

- [x] 4.1 Implementar la bandeja ordenada por puntaje y fecha, con la prioridad (ícono y texto) y los chips de señales. Verificar el orden con una prueba sobre el fixture.
- [ ] 4.2 Agregar los filtros (prioridad, categoría, método, fechas y estado de revisión) y el estado vacío con "Limpiar filtros". Verificar cada filtro con pruebas de componente.
  - Parte 4: filtros y estado vacío listos. Cada filtro se verificó con pruebas de la lógica (`bandeja.test.ts`) y a mano en el navegador; faltan las pruebas de componente.
- [ ] 4.3 Mostrar el estado de revisión leyendo el `ReviewStore` del Lote D. Verificar que se ve "Sin revisar" por defecto y el estado nuevo después de registrar una decisión.
  - Parte 4: la bandeja muestra "Sin revisar" por defecto con `useRevisiones` (`src/lib/revisiones.ts`). Falta verificar el cambio de estado cuando exista el diálogo de decisión del Lote D.
- [ ] 4.4 Implementar el buscador global (Ctrl o Cmd + K) por descripción, ocid y seudónimo. Verificar que elegir un resultado abre la ficha correcta.
  - Parte 4: el buscador encuentra procesos y proveedores (probado con "mobiliario" y por ocid). Falta verificar que abre la ficha cuando el Lote C cree `/procesos/[ocid]` y `/proveedores/[id]`.

## 5. B5 · Despliegue y ejecución local

- [ ] 5.1 Desplegar en Vercel con `PAQUETE_DATOS=publico`. Verificar desde otro dispositivo que el enlace abre el panel, la bandeja y una ficha.
  - 14 de noviembre: publicado en <https://hackathon-innova-norte-3g.vercel.app> (proyecto `hackathon-innova-norte-3g`, carpeta raíz `web`, conectado a `main`), todavía con el fixture. Contra el enlace público, no contra localhost, se comprobó que el panel, la bandeja y `/api/busqueda` responden con datos (400 ante un id no válido), así que el despliegue incluye los JSON. Las vistas previas piden iniciar sesión en Vercel; el dominio de producción es público. Falta definir `PAQUETE_DATOS=publico` cuando el paquete esté en `main`, abrir una ficha cuando exista la pantalla del Lote C y repetir la revisión desde un celular.
- [ ] 5.2 Documentar en `CONTRIBUTING.md` la ejecución local para la demo (`npm run build` y `npm run start`). Verificar con el Wi-Fi apagado.

## 6. Verificación del lote

- [ ] 6.1 Ejecutar `npm run lint`, `npm test` y `npm run build` en verde, y recorrer bandeja → ficha con datos reales en modo claro y oscuro. Anotar los resultados en el PR de cierre del lote.

## Workflow follow-up

### Verificación de las partes 3 y 4 (14 de noviembre de 2026)

- Ramas: `lote-b/parte-3-logica-y-fixture` (lógica y fixture) y `lote-b/parte-4-interfaz` (interfaz, sobre la parte 3).
- `npm run typecheck`, `npm run lint`, `npm test` y `npm run build`: en verde. Las pruebas incluyen el contraste de los tokens (`src/app/theme-contrast.test.ts`, 4,5:1 en claro y oscuro).
- Revisión en el navegador con el build de producción: panel y bandeja en modo claro y oscuro, a 375 px (sin desplazamiento horizontal) y a 1280 px, recorrido con el teclado, cambio de entidad, filtro de prioridad y buscador con Ctrl + K.
- Los enlaces a `/procesos`, `/proveedores`, `/revision` y `/metodologia` devuelven 404 hasta que los lotes C y D creen esas pantallas.
- Pendiente: completar 5.1 (paquete público y ficha), 5.2 y la verificación de cierre 6.1 con datos reales. El enlace público ya funciona (ver 5.1).

- Archivar el change con `openspec-archive-change` cuando la entrega del Stage-Gate 1 esté confirmada.
