# Explicación de señales · Lote C (Sebastián)

El corazón del producto: cada señal se explica en seis bloques (qué encontramos, con qué lo comparamos, por qué importa, qué revisar, qué no significa y qué datos usamos).

- **Código (ahora):** una plantilla por señal (S01–S06 y S08) que recibe la `Senal` del paquete y devuelve los seis bloques. Si falta un dato, la frase se omite (nunca "null", "undefined" ni "NaN"). Incluye además el texto del desglose de la prioridad ("Alta · S01 (3) + S03 (3) = 6") y la frase de comparación. Usa `src/lib/format.ts`.
- **Interfaz:** tarjeta de señal desplegable, variante `print` para el reporte del Lote D y comparaciones visuales de S01, S02, S03, S04 y S06.
- **Spec:** `openspec/changes/lote-c-fichas-y-explicacion/specs/app/explicacion-de-senales/spec.md`

## API de la parte 1

Exportaciones desde `index.ts`:

- `explainSignal(signal, context?)`: devuelve `finding`, `comparison`, `importance`, `review` (lista), `limitation` y `dataUsed` (lista), en el orden de los seis bloques. Hay una plantilla por código en `textos/`; S07 devuelve `null` mientras no tenga fuente y regla.
- `context.manifest`: permite incluir el nombre de la fuente, la licencia y la fecha de corte reales del paquete. `context.process` permite incluir su enlace al SEACE o el aviso de que falta. La plantilla no presupone que el fixture venga del OECE.
- `describePriority(process.prioridad)`: muestra nivel, pesos y puntaje tal como llegan del pipeline. Una prioridad nula se presenta como "Sin señales".
- `describeComparison(signal)`: devuelve la frase del percentil o `null` cuando falta o es inválido. En S02, p4 se presenta dentro del 5 % más corto y p9,7 dentro del 10 % más corto; el redondeo de presentación no cambia el umbral de activación. En participaciones se conserva la descripción "igual o menor" para no atribuir posiciones únicas cuando puede haber empates.

Las funciones son puras y no leen archivos. Las pruebas obtienen el fixture mediante `StaticDataSource`. Los nombres de las propiedades están en inglés y los textos resultantes están en español.

## API de la parte 2

`SignalCard`, en `ui/signal-card.tsx`, recibe `signal`, `context` (fuente, corte y proceso), `priority`, `weight` y `variant` (`default` o `print`). Reutiliza las plantillas y `PrioridadBadge`, sin recalcular los pesos. La versión normal permite abrir la explicación, marcar una lista de revisión temporal y desplegar los datos y las notas de calidad. Estas marcas son ayudas de lectura, no decisiones del almacén de revisión.

La variante `print` expone los seis bloques completos, sin botones ni casillas interactivas. Incluye las notas de calidad y un enlace oficial cuando existe. André puede importar el componente desde esa ruta para su reporte.

La etiqueta "Dato simulado" es el componente `SimulatedDataBadge` del Lote D, que se importa desde `@/features/etica`. La etiqueta provisional de esta carpeta se retiró al integrar las pantallas del Lote D.

La lectura de comprensión por otra persona del equipo y la decisión del nombre de S01 siguen pendientes. No se cambió la redacción de S01 antes de que el equipo apruebe la propuesta de Stefano.

## API de la parte 3

`buildComparisonChart(signal, caseOcid?)`, en `comparison-chart.ts`, prepara los valores y el resumen equivalente. `ComparisonChart`, en `ui/comparison-chart.tsx`, los presenta con `ChartContainer` y Recharts, usando los tokens comunes. Los gráficos se montan al desplegar la tarjeta; en móvil y en la variante `print` se mantiene la frase completa.

- S01 compara «hasta 1» frente a «2 o más» participantes. El complemento del segundo grupo puede incluir cero; no se presenta como exactamente uno sin ese dato.
- S02 coloca el percentil exacto del caso en una franja de 0 a 100.
- S03 compara el caso con la mediana y el cuartil superior publicados y marca la valla superior si existe. Son referencias del grupo, no proveedores individuales. Esta presentación usa los datos disponibles, según el criterio delegado por Sebastián, sin reconstruir participaciones ausentes.
- S04 ordena las compras y muestra su monto acumulado frente al umbral, con el proceso de la ficha marcado. Las fechas y los montos deben estar completos y alineados con los ocids.
- S06 compara los montos contratado y final en la moneda de las entradas.

No se inventa un gráfico cuando faltan los valores necesarios. El resumen contiene los datos de la imagen y el SVG no se anuncia por duplicado. La revisión del árbol accesible está registrada en `../fichas/evidence/part-3/accessibility.md`; sigue pendiente el recorrido real con lector de pantalla de S02 y S03 (4.1).
