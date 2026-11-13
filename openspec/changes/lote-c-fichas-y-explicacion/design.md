# Design

## Context

Este lote construye sobre la base del Lote B: estructura, tema, `DataSource` y formatos en `src/lib/format.ts`. Las señales llegan con sus valores y comparaciones según el contrato del paquete de datos, pero sin textos. La explicación es la pieza que más evaluará el jurado: entra en los criterios de usuario, de innovación y de ética. La motivación está en `proposal.md` y la anatomía de la tarjeta en `docs/diseno/sistema-de-diseno.md#tarjeta-de-señal`.

## Goals / Non-Goals

**Goals:**

- Textos claros y fáciles de mejorar después de las pruebas con usuarios, sin tocar el pipeline.
- Una tarjeta de señal que se use igual en la ficha y en el reporte imprimible del Lote D.

**Non-Goals:**

- Generar textos con IA: todos los textos son plantillas escritas y revisadas por el equipo.
- Mostrar documentos dentro de la aplicación: solo se enlaza a la fuente oficial.

## Decisions

1. **Los textos viven en la web, no en el paquete.** Cada señal tiene una función en `src/features/explicacion/textos/` que recibe el objeto de la señal y devuelve los seis bloques. Si falta un valor, la frase que lo usa se omite.
   - *Alternativa:* que el pipeline genere los textos. Se descartó porque mezcla datos con lenguaje y obliga a regenerar el paquete por cada ajuste de redacción.
2. **Un gráfico adecuado a cada tipo de señal**, siempre con su frase en texto:

   | Señal | Gráfico |
   |---|---|
   | S01 | Barra de proporción: procesos con 1 oferta frente a procesos con 2 o más |
   | S02 | Franja de percentiles con un marcador del caso |
   | S03 | Barras de participación de los proveedores con la línea de la valla superior |
   | S04 | Línea de tiempo de las compras agrupadas con la línea del umbral |
   | S06 | Barras de monto contratado frente a monto final |

   Se usan los gráficos de shadcn/ui (Recharts).
3. **Tarjeta desplegable dentro de la ficha.** Muestra "Qué encontramos" y "Por qué importa", y el resto se abre con "Ver explicación completa". La variante `print` muestra todo abierto para el reporte.
   - *Alternativa:* abrir la explicación en un panel lateral. Se descartó porque no se puede reutilizar al imprimir.
4. **Línea de tiempo combinada.** Une las fechas oficiales del proceso con las etapas de `expedientes-simulados.json` y las ordena por fecha. Las etapas simuladas usan borde punteado y el componente "Dato simulado" del Lote D.
5. **El historial se lee del `ReviewStore`.** La ficha no guarda nada por su cuenta: muestra el historial y abre el diálogo de decisión del Lote D.

## Risks / Trade-offs

- [Los textos no se entienden en las pruebas] → la parte de ajustes de la Fase 2 está reservada para reescribirlos, y la meta es que 4 de cada 5 personas expliquen bien la señal.
- [El Lote D aún no publicó el componente "Dato simulado" ni el `ReviewStore`] → D los publica en su parte D0 (sábado 14). Mientras tanto, C usa una etiqueta provisional y una lista vacía.
- [Gráficos ilegibles en el celular] → en pantallas pequeñas se muestra solo la frase en texto.
