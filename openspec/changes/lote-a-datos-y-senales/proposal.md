# Proposal

## Why

Todas las pantallas dependen de datos confiables y de señales reproducibles. Sin un pipeline que convierta los datos abiertos del OECE en señales explicables, el MVP no puede demostrar su valor con datos reales, y ese es el principal diferencial frente a los equipos que usarán datos sintéticos. Este lote (Estefano, ★★★★) es el más exigente del proyecto y, además, integra el trabajo de los demás antes de la entrega del 25 de noviembre.

## What Changes

- Spike de datos que responde con cifras las preguntas Q1–Q8 de `docs/datos/fuente-de-datos.md`.
- Nuevo pipeline en `pipeline/` (Python + uv + DuckDB) que:
  - obtiene los datos del OCP Data Registry;
  - filtra La Libertad y los años configurados;
  - genera tablas normalizadas y un manifiesto.
- Cálculo de las señales S01–S04 (núcleo) y S05–S06 (si los datos alcanzan), con parámetros configurables y resultados reproducibles. Cardinal (`ocdscardinal`, MIT) se usa como dependencia para contrastar los indicadores equivalentes.
- Prioridad de revisión transparente, sin probabilidad de corrupción.
- Paquete de datos según el contrato v1, con seudonimización en modo público y expedientes simulados para S08.

## Capabilities

### New Capabilities

- `datos/ingesta-ocds`: obtención desde fuentes permitidas, filtro por región y periodo, tablas normalizadas, tratamiento de la calidad de datos y manifiesto.
- `senales/calculo-de-senales`: reglas de S01–S06, parámetros configurables, resultados reproducibles, contraste con Cardinal y prioridad de revisión.
- `datos/paquete-de-datos`: exportación conforme al contrato v1, modos público y local, seudonimización y datos simulados marcados.

### Modified Capabilities

Ninguna.

## Impact

- **Código nuevo:** `pipeline/`, con su configuración de señales versionada y sus fixtures sintéticos.
- **Dependencias:** DuckDB, `ocdscardinal`, pytest y ruff, administradas con uv sobre Python 3.12 o 3.13.
- **Datos:** unos 150 MB comprimidos por año en `data/`, que no se versionan.
- **Contrato:** produce el paquete que consumen los lotes B, C y D ([contrato del paquete de datos](../../../docs/arquitectura/contrato-paquete-de-datos.md)). Cualquier cambio de forma requiere actualizar el contrato, el JSON Schema y el fixture.
