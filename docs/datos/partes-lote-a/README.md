# Partes del Lote A

El Lote A (datos y señales) se divide en partes. Cada parte tiene su ficha, su rama y su PR hacia `main`. Las tareas son las de [`tasks.md`](../../../openspec/changes/lote-a-datos-y-senales/tasks.md); la ficha agrega el contexto, el diseño propuesto y cómo verificarla.

## Estado

| Parte | Tareas | Rama | Estado | Depende de |
|---|---|---|---|---|
| 1 · Spike de datos | 1.1–1.6 | `lote-a/parte-1-spike-datos` | PR #1. Falta 1.6 (contrato, con el equipo) | — |
| 2 · Ingesta y normalización | 2.1–2.5 | `lote-a/parte-2-ingesta` | PR #2 | Parte 1 |
| [3 · Señales S01 y S02](parte-3-senales-s01-s02.md) | 3.1–3.4 | `lote-a/parte-3-senales-s01-s02` | Pendiente | Parte 2 |
| [4 · S03, S04, S08 y Cardinal](parte-4-s03-s04-s08-cardinal.md) | 4.1–4.5 | `lote-a/parte-4-s03-s04-s08-cardinal` | Pendiente | Parte 3 |
| [5 · Prioridad y paquete](parte-5-prioridad-y-paquete.md) | 5.1–5.4 | `lote-a/parte-5-prioridad-y-paquete` | Pendiente | Partes 3 y 4; tarea 1.6 |
| [6 · S05, S06 e integración](parte-6-opcionales-e-integracion.md) | 6.1–6.2 | `lote-a/parte-6-opcionales-e-integracion` | Pendiente | Parte 3 (6.1); PR de B, C y D (6.2) |
| [7 · Verificación final](parte-7-verificacion-final.md) | 7.1 | `lote-a/parte-7-verificacion` | Pendiente | Todas |

## Cómo empezar una parte

Mientras el PR de la parte anterior no esté en `main`, la rama nueva sale de la rama anterior. Su PR va igual hacia `main` y dice de cuál depende: hasta que la anterior se fusione, también muestra sus commits.

```bash
git fetch origin
git switch -c lote-a/parte-3-senales-s01-s02 origin/lote-a/parte-2-ingesta
```

Cuando la parte anterior ya esté en `main`, la rama sale de `origin/main`. Con OpenSpec: `/opsx:apply lote-a-datos-y-senales` en Claude Code o `$openspec-apply-change` en Codex. En `tasks.md` solo se marca `[x]` lo terminado y verificado.

## Reglas para todas las partes

- **Carpetas:** solo `pipeline/`, `docs/datos/` y `tasks.md` del change. El paquete va a `web/data/publico/` (seudonimizado) y a `web/data/local/` (con nombres, nunca se sube). `contracts/` y el código de `web/` no se tocan sin acordarlo con Joaquín.
- **Fuentes:** solo las descargas del OCP Data Registry (`uv run pipeline download`). Sin scraping del SEACE ni la API del portal del OECE.
- **Lenguaje:** "señal", "amerita revisión" o "prioridad de revisión". Nunca "corrupción", "fraude" ni "irregular".
- **Parámetros:** los de las señales (umbrales, ventanas, percentiles, pesos y cortes) van en `pipeline/config/senales.toml`; los de los datos (fuente, región, años), en `pipeline/config/pipeline.toml`. Nunca fijos en el código.
- **Pruebas:** cada regla con un caso positivo, uno negativo y uno con datos faltantes, armados con `pipeline/tests/factories.py`.
- **Idioma:** código en inglés; tablas, columnas y documentación en español; campos OCDS sin traducir.
- **Commits:** solo Stefano como autor, sin `Co-Authored-By` ni firmas de herramientas de IA. Push solo de la rama de la parte, PR hacia `main`, sin fusionarlo y sin rebase.
- **Antes de cada push:** `uv run pytest`, `uv run ruff check` y `uv run ruff format --check` en verde (desde `pipeline/`).
- **Comandos:** un comando nuevo se documenta en `CONTRIBUTING.md` cuando ya funciona.
- **Al cerrar la parte se entrega:** la rama y el SHA del último commit; las tareas completadas y cómo se verificaron (comandos y resultados); los pendientes y bloqueos.

## Lo que ya existe (partes 1 y 2)

- **Datos:** `uv run pipeline download`, `ingest` y `normalize` dejan las tablas en `data/derived/tablas/` y su manifiesto ([tablas normalizadas](../tablas-normalizadas.md)). La Libertad 2025–2026 tiene 5 036 procesos y 127 entidades.
- **Hallazgos del spike que condicionan las señales** ([fuente de datos](../fuente-de-datos.md#spike-de-datos-primer-paso-del-lote-a)):
  - no hay `bids` y `numero_postores` cuenta participantes registrados;
  - `tender.tenderPeriod` no tiene duración;
  - `tender.procurementMethod` falta en los métodos de la Ley 32069;
  - los consorcios cambian de código en cada adjudicación;
  - el monto final cubre el 9,1 % de los contratos.

## Pendientes que no son de una parte

| Pendiente | Quién |
|---|---|
| Tarea 1.6: revisar el contrato con el Lote B (tabla "Impacto en el contrato" de la fuente de datos) y los textos de S01 con el Lote C | Stefano con Joaquín y Sebastián |
| Decidir S02 (desactivar o redefinir) y S06 (desactivar o bajar el mínimo) | Equipo |
| Verificar a mano en el SEACE que `numero_postores` son participantes registrados | Stefano |
| Ajustar en `design.md` las decisiones 3 (departamento) y 5 (Cardinal) | Stefano |
| Citar DuckDB (MIT) en `docs/producto/referentes-internacionales.md` | Stefano |
