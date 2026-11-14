# Pipeline del Lote A

Convierte los datos abiertos de contrataciones del Perú (OCDS del OECE, vía el OCP Data Registry) en señales de revisión. Avance según el change [`lote-a-datos-y-senales`](../openspec/changes/lote-a-datos-y-senales/tasks.md).

Los comandos están en [`CONTRIBUTING.md`](../CONTRIBUTING.md#comandos-disponibles-hoy). Los resultados del spike, en [`docs/datos/fuente-de-datos.md`](../docs/datos/fuente-de-datos.md#spike-de-datos-primer-paso-del-lote-a), y las tablas, en [`docs/datos/tablas-normalizadas.md`](../docs/datos/tablas-normalizadas.md).

## Pasos

Cada paso tiene su comando y lee lo que dejó el anterior, así que se puede repetir uno sin rehacer los demás.

| Paso | Comando | Lee | Escribe |
|---|---|---|---|
| Descarga | `uv run pipeline download` | `config/pipeline.toml` | `data/raw/<archivo>` y `<archivo>.meta.json` (URL, fecha, tamaño y SHA-256) |
| Ingesta | `uv run pipeline ingest` | `data/raw/` | `data/interim/releases.parquet` (procesos de la región y los años) e `ingesta.json` |
| Normalización | `uv run pipeline normalize` | `data/interim/` | `data/derived/tablas/*.parquet` y `manifiesto.json` |
| Señales | `uv run pipeline signals` | `data/derived/tablas/` y `config/senales.toml` | `data/derived/senales/senales.parquet`, `expedientes-simulados.json` y `manifiesto.json` (activas, desactivadas, conteos y exclusiones) |
| Contraste con Cardinal | `uv run pipeline cardinal` | Tablas, señales y la herramienta de Cardinal (`.tools/` o el PATH) | `data/derived/senales/contraste-cardinal.json` |

## Estructura

| Ruta | Contenido |
|---|---|
| `config/pipeline.toml` | Fuente, fuentes permitidas, archivos, región, años y prefijos de RUC |
| `config/senales.toml` | Parámetros, versiones y pesos de las señales, y tabla de métodos competitivos |
| `src/pipeline/config.py` | Lectura y validación de la configuración |
| `src/pipeline/download.py` | Descarga con lista de fuentes permitidas, también para las redirecciones |
| `src/pipeline/ocds.py` | Campos OCDS que se leen, con sus tipos de DuckDB |
| `src/pipeline/ingest.py` | Filtro por departamento y años, exclusiones y procesos repetidos |
| `src/pipeline/normalize.py` | Tablas normalizadas, correcciones de calidad y manifiesto |
| `src/pipeline/signals/` | Configuración de las señales (`settings.py`), grupos de comparación (`groups.py`), reglas (`s01.py`, `s02.py`, `s03.py`, `s04.py`, `s08.py`) y cálculo (`compute.py`) |
| `src/pipeline/cardinal.py` | Contraste con los indicadores R018 y R003 de Cardinal, que se ejecuta como herramienta externa |
| `src/pipeline/spike.py` | Consultas del spike (Q1–Q7 y calidad), muestra por región y cobertura de Cardinal |
| `src/pipeline/cli.py` | Comando `uv run pipeline` |
| `tests/` | Pruebas con releases sintéticos (`tests/factories.py`), sin nombres ni RUC reales |
| `.tools/` | Herramientas locales, como la línea de comandos de Cardinal. No se sube |

## Salidas del spike

| Archivo | Contenido |
|---|---|
| `data/interim/spike-<años>.duckdb` | Base DuckDB con los releases cargados. Se reutiliza; `--reload` la vuelve a crear |
| `data/derived/spike-<años>.json` | Informe del spike: cada consulta con su pregunta, su SQL, sus columnas y sus filas |
| `data/interim/muestra-*.jsonl` | Procesos de una región y unos años, copiados sin cambios, para Cardinal |
