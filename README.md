# Prisma · Señales explicables para contrataciones públicas

> **Prisma** descompone los datos de contrataciones en señales que una persona puede entender y revisar, como un prisma descompone la luz ([ADR 0008](docs/adr/0008-prisma-y-diseno-inspirado-en-apple.md)). En el código, el nombre está en un solo lugar: `web/src/config/producto.ts`.

Plataforma web que analiza los datos abiertos de contrataciones públicas del Perú (estándar internacional OCDS). Detecta **señales que ameritan revisión** con una metodología probada en otros países y explica cada una para que una persona decida qué hacer. Una señal no es una acusación: la decisión siempre es humana.

Proyecto para la Hackathon Innova Norte 3G (UNT · Red Universitaria de Innovación, Nodo Norte · noviembre de 2026).

## Estado

| | |
|---|---|
| Fase | Fase 1 (dom 15 – jue 19, [qué hace cada uno](docs/plan/fase-1/README.md)). En `main` ya están el rediseño Prisma, el panel, la bandeja, las fichas del proceso y del proveedor y los datos reales. Las pantallas de Revisión, Metodología y Reporte del Lote D esperan aprobación en el [PR #29](https://github.com/JDiazD33/Hackathon-Innova-Norte-3G/pull/29). La verificación manual de señales en el SEACE es del miércoles 18 al viernes 20 |
| Demo en línea | [hackathon-innova-norte-3g.vercel.app](https://hackathon-innova-norte-3g.vercel.app), con el paquete público de La Libertad: 5 036 procesos convocados en 2025–2026, datos al 4 de octubre de 2026 y reglas `2026.11.2`. Se actualiza con cada push a `main` ([despliegue](CONTRIBUTING.md#despliegue)) |
| Desafío | **Por confirmar.** Recomendado: 2 · Integridad institucional y compliance. Alternativa: 1 · Contrataciones públicas y ejecución de obras ([encaje](docs/producto/vision-y-encaje.md#encaje-con-los-desafíos)) |
| Próximo hito | Entrega del Stage-Gate 1: **miércoles 25 de noviembre de 2026, 11:59 p. m.** (meta interna: 6:00 p. m.) |
| Equipo y lotes | A · Datos y señales: Stefano · B · Base web, panel y bandeja: Joaquín (líder) · C · Fichas y explicación: Sebastián · D · Revisión y transparencia: André ([fases y lotes](docs/plan/cronograma-y-lotes.md)) |
| Especificación | Un change de OpenSpec por lote en [`openspec/changes/`](openspec/changes/) |

## Empieza aquí

| Necesitas… | Lee |
|---|---|
| Qué exigen las bases, qué hay que entregar y cuándo | [docs/bases/requisitos-y-entregables.md](docs/bases/requisitos-y-entregables.md) |
| Qué construimos, para quién y cómo encaja en el desafío | [docs/producto/vision-y-encaje.md](docs/producto/vision-y-encaje.md) |
| Qué tomamos de Cardinal, Arachne y otros referentes (sin copiar) | [docs/producto/referentes-internacionales.md](docs/producto/referentes-internacionales.md) |
| De dónde salen los datos y cuáles son sus límites | [docs/datos/fuente-de-datos.md](docs/datos/fuente-de-datos.md) |
| Qué señales calculamos y cómo se explican | [docs/datos/catalogo-de-senales.md](docs/datos/catalogo-de-senales.md) |
| Arquitectura y decisiones técnicas | [docs/arquitectura/arquitectura.md](docs/arquitectura/arquitectura.md) · [docs/adr/](docs/adr/README.md) |
| El contrato de datos entre lotes | [docs/arquitectura/contrato-paquete-de-datos.md](docs/arquitectura/contrato-paquete-de-datos.md) |
| Cómo debe verse y sentirse la interfaz | [docs/diseno/sistema-de-diseno.md](docs/diseno/sistema-de-diseno.md) |
| Fases, lotes y quién hace qué | [docs/plan/cronograma-y-lotes.md](docs/plan/cronograma-y-lotes.md) |
| Tu lote en OpenSpec (propuesta, specs, diseño y tareas) | [`lote-a`](openspec/changes/lote-a-datos-y-senales/) · [`lote-b`](openspec/changes/lote-b-base-web-panel-y-bandeja/) · [`lote-c`](openspec/changes/lote-c-fichas-y-explicacion/) · [`lote-d`](openspec/changes/lote-d-revision-y-transparencia/) |
| Plantillas de los entregables | [docs/entregables/](docs/entregables/README.md) |
| Reglas para contribuir | [CONTRIBUTING.md](CONTRIBUTING.md) |

## Estructura

| Carpeta | Contenido | Estado |
|---|---|---|
| `docs/` | Bases, producto, datos, arquitectura, ADR, diseño, plan y entregables | Listo |
| `openspec/` | Un change por lote (OpenSpec, en español) | Listo |
| `contracts/` | JSON Schema del paquete de datos | Listo (contrato 1.1) |
| `pipeline/` | Descarga, normalización y cálculo de señales (Python + DuckDB) | Listo (Lote A): de la descarga al paquete de datos ([pasos](pipeline/README.md#pasos)). Falta la verificación manual en el SEACE y decidir los umbrales de S04 |
| `web/` | Aplicación web (Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui) | [Publicada](https://hackathon-innova-norte-3g.vercel.app) con el paquete público en `web/data/publico/`: panel, bandeja y fichas. Revisión, Metodología y Reporte, en el [PR #29](https://github.com/JDiazD33/Hackathon-Innova-Norte-3G/pull/29) |
| `data/` | Datos crudos y derivados que genera el pipeline; no se suben al repositorio | Se genera en local |

## Datos y licencias

- **Datos de contrataciones:** publicados por el Organismo Especializado para las Contrataciones Públicas Eficientes (OECE) en formato OCDS y redistribuidos por el [OCP Data Registry](https://data.open-contracting.org/en/publication/135) bajo licencia [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Los filtramos y calculamos indicadores a partir de ellos, y la aplicación debe indicarlo.
- **[Cardinal](https://github.com/open-contracting/cardinal-rs)** (Open Contracting Partnership) se usa como dependencia bajo licencia MIT, sin copiar su código.
- La licencia de este repositorio la decide el equipo. Según las bases, la autoría y la propiedad intelectual corresponden a sus creadores.
