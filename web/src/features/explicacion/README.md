# Explicación de señales · Lote C (Sebastián)

El corazón del producto: cada señal se explica en seis bloques (qué encontramos, con qué lo comparamos, por qué importa, qué revisar, qué no significa y qué datos usamos).

- **Código (ahora):** una plantilla por señal (S01–S06 y S08) que recibe la `Senal` del paquete y devuelve los seis bloques. Si falta un dato, la frase se omite (nunca "null", "undefined" ni "NaN"). Incluye además el texto del desglose de la prioridad ("Alta · S01 (3) + S03 (3) = 6") y la frase de comparación. Usa `src/lib/format.ts`.
- **Interfaz (después):** tarjeta de señal, minigráfico de comparación y variante `print` para el reporte del Lote D.
- **Spec:** `openspec/changes/lote-c-fichas-y-explicacion/specs/app/explicacion-de-senales/spec.md`

## API de la parte 1

Exportaciones desde `index.ts`:

- `explainSignal(signal, context?)`: devuelve `finding`, `comparison`, `importance`, `review` (lista), `limitation` y `dataUsed` (lista), en el orden de los seis bloques. Hay una plantilla por código en `textos/`; S07 devuelve `null` mientras no tenga fuente y regla.
- `context.manifest`: permite incluir el nombre de la fuente, la licencia y la fecha de corte reales del paquete. `context.process` permite incluir su enlace al SEACE o el aviso de que falta. La plantilla no presupone que el fixture venga del OECE.
- `describePriority(process.prioridad)`: muestra nivel, pesos y puntaje tal como llegan del pipeline. Una prioridad nula se presenta como "Sin señales".
- `describeComparison(signal)`: devuelve la frase del percentil o `null` cuando falta o es inválido. En S02, p4 se presenta dentro del 5 % más corto y p9,7 dentro del 10 % más corto; el redondeo de presentación no cambia el umbral de activación. En participaciones se conserva la descripción "igual o menor" para no atribuir posiciones únicas cuando puede haber empates.

Las funciones son puras y no leen archivos. Las pruebas obtienen el fixture mediante `StaticDataSource`. Los nombres de las propiedades están en inglés y los textos resultantes están en español.

Esta entrega no incluye la tarjeta visual, los gráficos ni el tooltip. La revisión de comprensión de los textos por otra persona del equipo sigue pendiente.
