# Tasks

Lote C · Fichas y explicación · **Sebastián** · ★★★ · carpetas `src/features/fichas/`, `src/features/explicacion/` y rutas de fichas en `web/` · plan en `docs/plan/cronograma-y-lotes.md`

## 1. C0 · Bocetos y textos (Fase 0, sáb 14)

- [ ] 1.1 Bocetar la ficha del proceso y la tarjeta de señal según el sistema de diseño. Verificar con los comentarios del equipo en el PR.
- [ ] 1.2 Escribir la versión 0 de los textos de S01–S04 y S08 en los seis bloques. Verificar que no usan vocabulario prohibido y que otra persona del equipo los entiende sin explicación.
  - Parte 1: plantillas implementadas para S01–S06 y S08; pruebas de los seis bloques y del vocabulario sobre todas las señales del fixture. Pendiente la lectura de comprensión por otra persona del equipo.

## 2. C1 · Ficha del proceso

- [x] 2.1 Crear `/procesos/[ocid]` con el resumen y "Sin dato" en los valores nulos. Verificar con un proceso completo y otro con datos faltantes del fixture.
- [x] 2.2 Mostrar "No encontramos este proceso" cuando el ocid no existe. Verificar abriendo un ocid inventado.
- [x] 2.3 Construir la línea de tiempo con las fechas oficiales y las etapas simuladas marcadas. Verificar con el expediente simulado del fixture.
  - Parte 1: `buildProcessTimeline` combina y ordena fechas, conserva las fechas nulas como "Sin dato" y marca los datos simulados. Pruebas con el fixture, fechas empatadas y zonas horarias. Pendiente la presentación visual.
  - Parte 2: presentación visual y expediente simulado verificados con pruebas de componente; usa una etiqueta provisional hasta que André publique la suya.
- [x] 2.4 Listar los documentos oficiales con sus enlaces, o el mensaje cuando no hay. Verificar con el fixture.
- [x] 2.5 Mostrar el historial del `ReviewStore` y el botón "Registrar revisión", que abre el diálogo del Lote D. Verificar que el botón aparece con el rol analista y no con el auditor.
  - Parte 2: historial conectado a `useRevisiones()` y comprobado con una decisión sintética persistida en el navegador. Pendientes el diálogo y el selector de rol del Lote D, que todavía no están en `main`; no se marca como terminada.
  - Integración con el Lote D (15 de noviembre, rama `lote-b/parte-15-integracion-lote-d`): la tarjeta "Historial de revisión" usa `DecisionDialog`, `AssignmentDialog` y `ReviewHistory` del Lote D y enlaza al reporte. `process-history.test.tsx` comprueba que el analista ve "Registrar revisión" y que el auditor solo ve el historial. En el navegador, con el build de producción, se registró "Requiere atención" desde la ficha y el estado vigente cambió al instante; con el rol auditor no aparecen ni el botón ni la asignación.

## 3. C2 · Tarjeta de señal

- [x] 3.1 Crear la tarjeta con los seis bloques, la referencia internacional y la variante `print`. Verificar con una prueba de componente por cada señal del fixture.
- [x] 3.2 Escribir los textos con plantillas que omiten las frases cuyos datos son nulos. Verificar con pruebas que ningún texto contiene "null", "undefined" ni "NaN".
- [x] 3.3 Agregar las notas de calidad, la etiqueta "Dato simulado" en S08 y el enlace al SEACE o el aviso de que falta. Verificar con el fixture.
- [x] 3.4 Mostrar el desglose de la prioridad con texto y tooltip, accesible con el teclado. Verificar llegando con la tecla Tab.
  - Parte 1: `describePriority` presenta nivel, pesos y puntaje del paquete sin recalcularlos. Pruebas con el fixture y con prioridad nula. Pendientes tooltip e interacción con teclado.
  - Parte 2: reutiliza `PrioridadBadge`; desglose probado en el foco del componente y llegando con Tab en Edge.

## 4. C3 · Comparación visual

- [ ] 4.1 Crear los minigráficos de S01, S02, S03, S04 y S06 con un marcador del caso y una frase equivalente; en el celular se muestra solo la frase. Verificar con el fixture y con un lector de pantalla en S02 y S03.
  - Parte 1: `describeComparison` genera la frase del percentil, omite percentiles ausentes o inválidos y conserva los empates al describir participaciones. Pendientes gráficos y verificación con lector de pantalla.
  - Parte 3: gráficos de S01, S02, S03, S04 y S06 implementados y recorridos con el fixture en claro y oscuro; solo la frase en móvil. S03 usa el caso, la mediana y el cuartil superior publicados (criterio delegado por Sebastián), sin inventar participaciones individuales. S01 etiqueta el complemento como «hasta 1» porque puede incluir cero. Árbol accesible de S02 y S03 guardado en las evidencias; se mantiene abierta hasta el recorrido con lector de pantalla real.

## 5. C4 · Ficha del proveedor

- [x] 5.1 Crear `/proveedores/[id]` con la participación, los procesos ganados y la tarjeta de S03. Verificar con el fixture.
- [x] 5.2 Aplicar las reglas de identidad según el modo (seudónimo en público; nombre, RUC y enlace en local; personas naturales siempre sin nombre). Verificar con un manifiesto de prueba de cada modo.
  - Parte 1: `getSupplierIdentity` aplica las reglas en ambos modos; pruebas de personas jurídicas, naturales, tipo desconocido y proveedores del fixture. Pendiente integrarla en la ficha visual.
  - Parte 3: identidad integrada en la carga del servidor y en la ficha; pruebas con manifiestos público y local, incluida una persona natural cuyo nombre viene en la entrada y nunca aparece en el resultado ni en el HTML.

## 6. Ajustes tras la validación (Fase 2)

- [ ] 6.1 Reescribir los textos que no se entendieron en la primera ronda de pruebas. Verificar en la segunda ronda que 4 de cada 5 personas explican bien la señal.

## 7. Verificación del lote

- [ ] 7.1 Ejecutar las pruebas de componentes y `npm run build` en verde, y recorrer una ficha completa con datos reales en modo claro y oscuro. Anotar los resultados en el PR de cierre del lote.

## Workflow follow-up

### Verificación de la parte 3 · Comparación y ficha del proveedor (14 de noviembre de 2026)

- Tareas nuevas terminadas y verificadas: 5.1 y 5.2. Avance: 10/16. La implementación visual de 4.1 está lista; queda su comprobación con lector de pantalla.
- `npm run typecheck`, `npm run lint`, `npm test` (321 pruebas en 27 archivos) y `npm run build`, en verde con Node 24.22.3 temporal. No se modificaron dependencias ni archivos de otros lotes.
- Producción en Edge: cinco gráficos en ambos temas, frase equivalente en móvil, proveedor → proceso con entidad conservada, proveedor inexistente y aislamiento de entidades; sin errores de ejecución ni desborde después del ajuste de tamaño.
- Capturas claras y oscuras de las comparaciones y la ficha, a 375, 768 y 1280 px, y árbol accesible de S02 y S03 en `web/src/features/fichas/evidence/part-3/`.
- Rama basada en la parte 2 y PR hacia `main` dependiente del #17. Siguen abiertas las tareas que requieren al Lote D, revisión humana, lector de pantalla y datos reales.

### Verificación de la parte 2 · Tarjeta y ficha del proceso (14 de noviembre de 2026)

- Tareas terminadas y verificadas: 2.1–2.4, 3.1, 3.3 y 3.4. Avance del change: 8/16.
- `npm ci`: dependencias exactas instaladas, sin cambios en el lockfile. Comprobaciones con Node 24.22.3 temporal.
- Base: 274 pruebas en 21 archivos. Pruebas nuevas: 24 aprobadas en 3 archivos; una por cada señal del fixture, además de interacción, datos faltantes y fichas.
- Comprobaciones finales: `npm run typecheck`, `npm run lint`, `npm test` (298 pruebas en 24 archivos) y `npm run build`, todas en verde con Node 24. `openspec validate --all --strict`: 5 changes válidos.
- Recorrido de producción en Edge: bandeja → ficha → explicación; tooltip con Tab, detalles con Enter, datos persistidos del historial, ficha no prerenderizada y proceso inexistente con `noindex`; sin errores de hidratación.
- Capturas claras y oscuras a 375 y 1280 px, y oscura a 768 px, en `web/src/features/fichas/evidence/part-2/`; sin desborde horizontal.
- Siguen pendientes 1.1 y 1.2 hasta la revisión humana del diseño y los textos. Se conserva S01 hasta que el equipo apruebe la propuesta de Stefano. No se marca 2.5 por la dependencia del Lote D ni 7.1 sin datos reales.

### Verificación de la parte 1 · Textos y lógica (13 de noviembre de 2026)

- Alcance: solo funciones puras y pruebas en las carpetas de explicación y fichas; sin pantallas ni estilos.
- `npm ci`: dependencias del lockfile instaladas. La máquina tiene Node 22.20; las comprobaciones finales se ejecutaron con Node 24.22.3 temporal, sin cambiar la instalación del sistema.
- Base antes del cambio: `npm test`, 25 pruebas aprobadas.
- Preparación de un clon nuevo: `next typegen` genera los tipos de rutas y `next-env.d.ts`, ambos ignorados por Git. Es necesario antes de `npm run typecheck` en este clon.
- `npm test`: 91 pruebas aprobadas en 8 archivos (66 pruebas nuevas).
- `npm run typecheck` y `npm run lint`: sin errores.
- Se mantienen abiertas las tareas que incluyen presentación visual o validación con otra persona; esta entrega completa su parte de lógica descrita en el plan.

- Archivar el change con `openspec-archive-change` cuando la entrega del Stage-Gate 1 esté confirmada.
