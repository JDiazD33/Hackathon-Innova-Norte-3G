# Tasks

Lote C · Fichas y explicación · **Sebastián** · ★★★ · carpetas `src/features/fichas/`, `src/features/explicacion/` y rutas de fichas en `web/` · plan en `docs/plan/cronograma-y-lotes.md`

## 1. C0 · Bocetos y textos (Fase 0, sáb 14)

- [ ] 1.1 Bocetar la ficha del proceso y la tarjeta de señal según el sistema de diseño. Verificar con los comentarios del equipo en el PR.
- [ ] 1.2 Escribir la versión 0 de los textos de S01–S04 y S08 en los seis bloques. Verificar que no usan vocabulario prohibido y que otra persona del equipo los entiende sin explicación.
  - Parte 1: plantillas implementadas para S01–S06 y S08; pruebas de los seis bloques y del vocabulario sobre todas las señales del fixture. Pendiente la lectura de comprensión por otra persona del equipo.

## 2. C1 · Ficha del proceso

- [ ] 2.1 Crear `/procesos/[ocid]` con el resumen y "Sin dato" en los valores nulos. Verificar con un proceso completo y otro con datos faltantes del fixture.
- [ ] 2.2 Mostrar "No encontramos este proceso" cuando el ocid no existe. Verificar abriendo un ocid inventado.
- [ ] 2.3 Construir la línea de tiempo con las fechas oficiales y las etapas simuladas marcadas. Verificar con el expediente simulado del fixture.
  - Parte 1: `buildProcessTimeline` combina y ordena fechas, conserva las fechas nulas como "Sin dato" y marca los datos simulados. Pruebas con el fixture, fechas empatadas y zonas horarias. Pendiente la presentación visual.
- [ ] 2.4 Listar los documentos oficiales con sus enlaces, o el mensaje cuando no hay. Verificar con el fixture.
- [ ] 2.5 Mostrar el historial del `ReviewStore` y el botón "Registrar revisión", que abre el diálogo del Lote D. Verificar que el botón aparece con el rol analista y no con el auditor.

## 3. C2 · Tarjeta de señal

- [ ] 3.1 Crear la tarjeta con los seis bloques, la referencia internacional y la variante `print`. Verificar con una prueba de componente por cada señal del fixture.
- [x] 3.2 Escribir los textos con plantillas que omiten las frases cuyos datos son nulos. Verificar con pruebas que ningún texto contiene "null", "undefined" ni "NaN".
- [ ] 3.3 Agregar las notas de calidad, la etiqueta "Dato simulado" en S08 y el enlace al SEACE o el aviso de que falta. Verificar con el fixture.
- [ ] 3.4 Mostrar el desglose de la prioridad con texto y tooltip, accesible con el teclado. Verificar llegando con la tecla Tab.
  - Parte 1: `describePriority` presenta nivel, pesos y puntaje del paquete sin recalcularlos. Pruebas con el fixture y con prioridad nula. Pendientes tooltip e interacción con teclado.

## 4. C3 · Comparación visual

- [ ] 4.1 Crear los minigráficos de S01, S02, S03, S04 y S06 con un marcador del caso y una frase equivalente; en el celular se muestra solo la frase. Verificar con el fixture y con un lector de pantalla en S02 y S03.
  - Parte 1: `describeComparison` genera la frase del percentil, omite percentiles ausentes o inválidos y conserva los empates al describir participaciones. Pendientes gráficos y verificación con lector de pantalla.

## 5. C4 · Ficha del proveedor

- [ ] 5.1 Crear `/proveedores/[id]` con la participación, los procesos ganados y la tarjeta de S03. Verificar con el fixture.
- [ ] 5.2 Aplicar las reglas de identidad según el modo (seudónimo en público; nombre, RUC y enlace en local; personas naturales siempre sin nombre). Verificar con un manifiesto de prueba de cada modo.
  - Parte 1: `getSupplierIdentity` aplica las reglas en ambos modos; pruebas de personas jurídicas, naturales, tipo desconocido y proveedores del fixture. Pendiente integrarla en la ficha visual.

## 6. Ajustes tras la validación (Fase 2)

- [ ] 6.1 Reescribir los textos que no se entendieron en la primera ronda de pruebas. Verificar en la segunda ronda que 4 de cada 5 personas explican bien la señal.

## 7. Verificación del lote

- [ ] 7.1 Ejecutar las pruebas de componentes y `npm run build` en verde, y recorrer una ficha completa con datos reales en modo claro y oscuro. Anotar los resultados en el PR de cierre del lote.

## Workflow follow-up

### Verificación de la parte 1 · Textos y lógica (13 de noviembre de 2026)

- Alcance: solo funciones puras y pruebas en las carpetas de explicación y fichas; sin pantallas ni estilos.
- `npm ci`: dependencias del lockfile instaladas. La máquina tiene Node 22.20; las comprobaciones finales se ejecutaron con Node 24.22.3 temporal, sin cambiar la instalación del sistema.
- Base antes del cambio: `npm test`, 25 pruebas aprobadas.
- Preparación de un clon nuevo: `next typegen` genera los tipos de rutas y `next-env.d.ts`, ambos ignorados por Git. Es necesario antes de `npm run typecheck` en este clon.
- `npm test`: 91 pruebas aprobadas en 8 archivos (66 pruebas nuevas).
- `npm run typecheck` y `npm run lint`: sin errores.
- Se mantienen abiertas las tareas que incluyen presentación visual o validación con otra persona; esta entrega completa su parte de lógica descrita en el plan.

- Archivar el change con `openspec-archive-change` cuando la entrega del Stage-Gate 1 esté confirmada.
