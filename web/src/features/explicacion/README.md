# Explicación de señales · Lote C (Sebastián)

El corazón del producto: cada señal se explica en seis bloques (qué encontramos, con qué lo comparamos, por qué importa, qué revisar, qué no significa y qué datos usamos).

- **Código (ahora):** una plantilla por señal (S01–S06 y S08) que recibe la `Senal` del paquete y devuelve los seis bloques. Si falta un dato, la frase se omite (nunca "null", "undefined" ni "NaN"). Incluye además el texto del desglose de la prioridad ("Alta · S01 (3) + S03 (3) = 6") y la frase de comparación. Usa `src/lib/format.ts`.
- **Interfaz (después):** tarjeta de señal, minigráfico de comparación y variante `print` para el reporte del Lote D.
- **Spec:** `openspec/changes/lote-c-fichas-y-explicacion/specs/app/explicacion-de-senales/spec.md`
