# Proposal

## Why

El diferencial del producto no es detectar señales, sino **explicarlas**: que una persona que no programa entienda qué se encontró, con qué se comparó, por qué importa, qué revisar y qué no significa. Así lo hacen los referentes internacionales (los principios de Arachne, la guía de OCP) y así cumplimos el criterio ético sin acusar a nadie. Este lote (Sebastián, ★★★) construye las fichas y la tarjeta de señal, que son el corazón de la demostración.

## What Changes

- **Ficha del proceso:**
  - resumen (objeto, entidad, método, montos y estado);
  - línea de tiempo con las fechas oficiales, más las etapas internas simuladas, marcadas como tales;
  - documentos oficiales;
  - señales del proceso con su prioridad desglosada;
  - espacio para el historial de revisión del Lote D.
- **Tarjeta de señal**, con seis bloques: qué encontramos, con qué lo comparamos, por qué importa, qué revisar, qué no significa y qué datos usamos. Además, notas de calidad de datos y referencia internacional.
- **Comparación visual** del caso dentro de su grupo, siempre acompañada de un resumen en texto.
- **Textos de explicación** para S01–S06 y S08, armados con los valores del paquete de datos.
- **Ficha del proveedor:** participación en la entidad, procesos ganados y S03, sin revelar su identidad en modo público.

## Capabilities

### New Capabilities

- `app/fichas-de-proceso-y-proveedor`: contenido y comportamiento de la ficha del proceso y de la ficha del proveedor.
- `app/explicacion-de-senales`: estructura, contenido y presentación de la explicación de cada señal, incluida la comparación visual y el desglose de la prioridad.

### Modified Capabilities

Ninguna.

## Impact

- **Código nuevo:** en `web/`, rutas `/procesos/[ocid]` y `/proveedores/[id]`, más el componente de tarjeta de señal y los textos de explicación.
- **Usa:** `DataSource` y la base del Lote B. Lee el historial desde el `ReviewStore` del Lote D.
- **Expone:** la tarjeta de señal, que el reporte de trazabilidad del Lote D reutiliza.
