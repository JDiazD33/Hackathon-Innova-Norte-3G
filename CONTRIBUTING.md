# Cómo contribuir

Reglas para todas las personas y agentes que trabajan en este repositorio. Los motivos de cada decisión están en [`docs/adr/`](docs/adr/README.md).

## Stack elegido

Las versiones exactas se fijan al crear cada proyecto (Lote A y Lote B) y se anotan aquí.

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
- Antes de pedir revisión, ejecuta las comprobaciones del proyecto que tocaste y anota el resultado en el PR.

## Comandos disponibles hoy

```bash
openspec list
openspec validate --all --strict
```

Los comandos de `pipeline/` y `web/` se agregan aquí cuando esos proyectos existan.

## Datos y seguridad

- Fuente y atribución obligatoria: [`docs/datos/fuente-de-datos.md`](docs/datos/fuente-de-datos.md).
- Sin scraping del SEACE ni uso de APIs que exijan credenciales que no tengamos.
- Secretos en `.env` (fuera del repositorio); cada variable nueva se documenta en un `.env.example`.
- En el enlace público, los proveedores van seudonimizados y las personas naturales nunca aparecen con nombre.
