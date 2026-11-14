# Pipeline del Lote A

Convierte los datos abiertos de contrataciones del Perú (OCDS del OECE, vía el OCP Data Registry) en señales de revisión. Por ahora contiene el **spike de datos** (tareas 1.1 a 1.5 del change [`lote-a-datos-y-senales`](../openspec/changes/lote-a-datos-y-senales/tasks.md)). La ingesta, las señales, la prioridad y la exportación del paquete llegan en las partes siguientes.

Los comandos están en [`CONTRIBUTING.md`](../CONTRIBUTING.md#comandos-disponibles-hoy) y los resultados del spike, en [`docs/datos/fuente-de-datos.md`](../docs/datos/fuente-de-datos.md#spike-de-datos-primer-paso-del-lote-a).

## Estructura

| Ruta | Contenido |
|---|---|
| `src/pipeline/spike.py` | Consultas DuckDB del spike (Q1–Q7 y calidad de los datos), muestra por región y años, y cobertura de Cardinal |
| `src/pipeline/cli.py` | Comando `uv run pipeline` con `spike`, `sample` y `coverage` |
| `tests/` | Pruebas con releases sintéticos, sin nombres ni RUC reales |
| `.tools/` | Herramientas locales, como la línea de comandos de Cardinal. No se sube |

## Salidas

Todas van a `data/`, que no se sube.

| Archivo | Contenido |
|---|---|
| `data/interim/spike-<años>.duckdb` | Base DuckDB con los releases cargados (por ejemplo, `spike-2025-2026.duckdb` con los dos archivos). Se reutiliza; `--reload` la vuelve a crear |
| `data/derived/spike-<años>.json` | Informe del spike: cada consulta con su pregunta, su SQL, sus columnas y sus filas |
| `data/interim/muestra-*.jsonl` | Procesos de una región y unos años, copiados sin cambios, para Cardinal |
