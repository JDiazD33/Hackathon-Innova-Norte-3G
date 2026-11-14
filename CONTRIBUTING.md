# Cómo contribuir

Reglas para todas las personas y agentes que trabajan en este repositorio. Los motivos de cada decisión están en [`docs/adr/`](docs/adr/README.md).

## Stack elegido

**Versiones de `web/`** (creado el 13 de noviembre): Node 24, Next.js 16.4.6 (App Router con Cache Components), React 19.3, TypeScript 5, Tailwind CSS 4.3 y Vitest 5.1. Desde el 14 de noviembre, también shadcn/ui (estilo radix-nova, sobre Radix), Recharts, lucide-react y next-themes.

**Versiones de `pipeline/`** (creado el 13 de noviembre): Python 3.13 (también funciona con 3.12), uv 0.11, DuckDB 2.0.0, `ocdscardinal` 0.0.9, pytest 9.2 y ruff 0.17. El paquete de Python de Cardinal solo trae `coverage`; `prepare` e `indicators` están en su herramienta de línea de comandos, que se compila desde la etiqueta 0.0.9 porque el binario de Windows publicado se cierra al arrancar.

| Parte | Tecnología | Por qué | ADR |
|---|---|---|---|
| Plataforma | Aplicación web responsiva (no Android ni iOS nativo) | Un enlace para el jurado, uso en escritorio y un solo código | [0001](docs/adr/0001-aplicacion-web-responsiva.md) |
| Datos | OCDS del OCP Data Registry, procesados por adelantado y de solo lectura | Datos reales y abiertos, demo que funciona sin internet | [0002](docs/adr/0002-datos-ocds-precalculados.md) |
| Señales | Cardinal (`ocdscardinal`, MIT) como dependencia + señales propias según la guía de OCP | Metodología internacional sin copiar código | [0003](docs/adr/0003-referentes-sin-copiar.md) · [0007](docs/adr/0007-senales-no-acusaciones.md) |
| Pipeline | Python ≥ 3.12 con uv + DuckDB + Parquet | Procesa archivos de varios GB en una laptop con SQL legible | [0004](docs/adr/0004-pipeline-python-duckdb.md) |
| Interfaz | Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui; gráficos con Recharts | Componentes accesibles y bonitos desde el inicio; despliegue gratuito | [0005](docs/adr/0005-web-nextjs-shadcn.md) |
| Especificaciones | OpenSpec 1.16 (en español) | Mismo método que en la hackathon anterior | — |

## Estructura

| Carpeta | Contenido |
|---|---|
| `pipeline/` | Ingesta del OCDS, tablas normalizadas, señales, prioridad, seudonimización y exportación (Lote A) |
| `contracts/` | JSON Schema del paquete de datos ([contrato](docs/arquitectura/contrato-paquete-de-datos.md)) (Lote B con A) |
| `web/` | Aplicación Next.js. Cada lote tiene sus carpetas; el mapa está en el `design.md` del Lote B |
| `web/data/` | `fixture/` (sintético, se sube), `publico/` (seudonimizado, se sube después de revisarlo) y `local/` (nunca se sube) |
| `data/` | `raw/` (descargas), `interim/` y `derived/` (resultados). Nunca se suben |
| `openspec/` | Specs y un change por lote. Las skills de OpenSpec están en `.claude/` (Claude Code) y en `.agents/` (Codex) |
| `docs/` | Bases, producto, datos, arquitectura, ADR, diseño, plan y entregables |

## Convenciones

- **Código en inglés:** nombres de archivos, funciones, variables, scripts y variables de entorno ([ADR 0006](docs/adr/0006-convencion-de-nombres.md)).
- **En español:** textos de la interfaz, documentación, specs y nombres de tablas y columnas de los datos derivados.
- **Identificadores OCDS** (`ocid`, `buyer.id`, `tender.tenderPeriod`…): se conservan tal cual.
- **Señales:** cada una tiene un código propio (`S01`, `S02`…) y, si existe, el código equivalente de Cardinal u OCP. Su definición vive en [`docs/datos/catalogo-de-senales.md`](docs/datos/catalogo-de-senales.md).
- **Parámetros:** umbrales y ventanas de tiempo van en archivos de configuración versionados, nunca fijos en el código.
- **Lenguaje de la interfaz:** "señal", "amerita revisión", "prioridad de revisión". Nunca "corrupción", "fraude" ni "irregular" para describir un caso ([ADR 0007](docs/adr/0007-senales-no-acusaciones.md)).

## Forma de trabajo

- Fases, lotes y responsables: [`docs/plan/cronograma-y-lotes.md`](docs/plan/cronograma-y-lotes.md). Cada persona trabaja su change de OpenSpec (`/opsx:apply <change>` en Claude Code o `$openspec-apply-change` en Codex).
- Una rama por parte de lote: `lote-a/parte-1-spike-datos`, `lote-b/parte-2-contrato`, etc.
- PR pequeños, revisados por otra persona del equipo.
- **Archivo de ramas:** cuando una parte ya está en `main`, su rama se guarda como tag `archivo/<rama>` y se borra del remoto, como en la hackathon anterior. Para retomarla: `git switch -c <rama> archivo/<rama>`.
- Antes de pedir revisión, ejecuta las comprobaciones del proyecto que tocaste y anota el resultado en el PR.

## Comandos disponibles hoy

```bash
# Especificaciones (desde la raíz)
openspec list
openspec validate --all --strict

# Web (desde web/)
npm ci                      # instala las dependencias exactas
npm run dev                 # http://localhost:3000 con el fixture
npm test                    # pruebas (Vitest)
npm run typecheck           # genera los tipos de rutas de Next (next typegen) y revisa los tipos
npm run lint                # ESLint
npm run build && npm run start   # demo local; ya construida, funciona sin internet
npm run fixture             # regenera web/data/fixture (datos ficticios)
PAQUETE_DATOS=publico npm run build              # usar el paquete real seudonimizado
PAQUETE_DIR=data/publico npm test -- paquete     # validar un paquete contra el contrato

# Pipeline (desde pipeline/). Parámetros en config/pipeline.toml; data/ nunca se sube
uv sync                       # crea .venv con Python 3.13 y las versiones exactas de uv.lock
uv run pytest                 # pruebas
uv run ruff check             # lint
uv run ruff format --check    # formato
uv run pipeline download      # descarga 2025 y 2026 a data/raw/, solo desde fuentes permitidas
uv run pipeline ingest        # La Libertad 2025–2026: data/interim/releases.parquet
uv run pipeline normalize     # tablas en data/derived/tablas/*.parquet y manifiesto.json
uv run pipeline signals       # señales activas (config/senales.toml): data/derived/senales/
uv run pipeline cardinal      # contraste de S01 y S02 con R018 y R003 (necesita la herramienta de Cardinal)
uv run pipeline export --modo publico   # paquete seudonimizado en web/data/publico/ (necesita PSEUDONYM_SECRET)
uv run pipeline export --modo local     # paquete con nombres de empresas en web/data/local/ (nunca se sube)
uv run pipeline fingerprint --out ../data/derived/verificacion/huellas-1.json   # huellas SHA-256 de las salidas de la cadena
uv run pipeline fingerprint --compare ../data/derived/verificacion/huellas-1.json   # compara con otra ejecución; falla si algo cambió
uv run pipeline spike ../data/raw/2026.jsonl.gz    # spike Q1–Q7: data/derived/spike-2026.json
uv run pipeline spike ../data/raw/2025.jsonl.gz ../data/raw/2026.jsonl.gz   # los dos años juntos: spike-2025-2026.json
uv run pipeline sample ../data/raw/2026.jsonl.gz ../data/interim/muestra-la-libertad-2026.jsonl
uv run pipeline coverage ../data/interim/muestra-la-libertad-2026.jsonl   # Cardinal coverage (Python)

# Cardinal prepare e indicators (desde pipeline/; necesita Rust y cargo; .tools/ no se sube)
cargo install --git https://github.com/open-contracting/cardinal-rs --tag 0.0.9 --locked --root .tools/cargo ocdscardinal
.tools/cargo/bin/ocdscardinal init ../data/interim/cardinal-settings.ini
.tools/cargo/bin/ocdscardinal prepare -s ../data/interim/cardinal-settings.ini -o ../data/interim/muestra-preparada.jsonl -e ../data/derived/cardinal-prepare-problemas.csv ../data/interim/muestra-la-libertad-2026.jsonl
.tools/cargo/bin/ocdscardinal indicators -s ../data/interim/cardinal-settings.ini --count ../data/interim/muestra-preparada.jsonl > ../data/derived/cardinal-indicadores.json
```

Antes de escribir código de Next.js, lee `web/AGENTS.md`: Next 16 trae cambios y sus guías están en `web/node_modules/next/dist/docs/`.

`export` lee `PSEUDONYM_SECRET` del entorno o de `pipeline/.env`: copia `pipeline/.env.example` a `pipeline/.env` y genera el secreto con `uv run python -c "import secrets; print(secrets.token_hex(32))"`. Con el mismo secreto y los mismos datos, los seudónimos no cambian entre ejecuciones. Cada archivo del paquete se valida contra `contracts/paquete-de-datos.schema.json` antes de escribirse; después, valídalo también desde `web/` con `PAQUETE_DIR=data/publico npm test -- paquete`.

En `pipeline/`, `--department` y `--years` cambian la región y los años del spike (por defecto, LA LIBERTAD, 2025 y 2026). Cardinal solo calcula los indicadores que tienen su sección (`[R003]`, `[R018]`…) en el archivo de configuración: parte siempre del que genera `init`. Los resultados del spike están en [`docs/datos/fuente-de-datos.md`](docs/datos/fuente-de-datos.md#spike-de-datos-primer-paso-del-lote-a).

## Datos y seguridad

- Fuente y atribución obligatoria: [`docs/datos/fuente-de-datos.md`](docs/datos/fuente-de-datos.md).
- Sin scraping del SEACE ni uso de APIs que exijan credenciales que no tengamos.
- Secretos en `.env` (fuera del repositorio); cada variable nueva se documenta en un `.env.example`.
- En el enlace público, los proveedores van seudonimizados y las personas naturales nunca aparecen con nombre.
