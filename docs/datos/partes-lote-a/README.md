# Partes del Lote A

El Lote A (datos y señales) se divide en partes. Cada parte tiene su ficha, su rama y su PR hacia `main`. Las tareas son las de [`tasks.md`](../../../openspec/changes/lote-a-datos-y-senales/tasks.md); la ficha agrega el contexto, el diseño propuesto y cómo verificarla.

## Estado

| Parte | Tareas | Rama | Estado | Depende de |
|---|---|---|---|---|
| 1 · Spike de datos | 1.1–1.6 | `lote-a/parte-1-spike-datos` | En `main`. La 1.6 pasa a la parte 8 | — |
| 2 · Ingesta y normalización | 2.1–2.5 | `lote-a/parte-2-ingesta` | En `main` | Parte 1 |
| [3 · Señales S01 y S02](parte-3-senales-s01-s02.md) | 3.1–3.4 | `lote-a/parte-3-senales-s01-s02` | En `main`. La 3.4 (verificación en el SEACE) pasa a la parte 9 | Parte 2 |
| [4 · S03, S04, S08 y Cardinal](parte-4-s03-s04-s08-cardinal.md) | 4.1–4.5 | `lote-a/parte-4-s03-s04-s08-cardinal` | En `main`. La 4.5 (verificación en el SEACE) pasa a la parte 9; S04 espera sus umbrales | Parte 3 |
| [5 · Prioridad y paquete](parte-5-prioridad-y-paquete.md) | 5.1–5.4 | `lote-a/parte-5-prioridad-y-paquete` | En `main`. La 5.4 (paquete público en la web) pasa a la parte 8 | Partes 3 y 4; tarea 1.6 |
| [6 · S05, S06 e integración](parte-6-opcionales-e-integracion.md) | 6.1–6.2 | `lote-a/parte-6-opcionales-e-integracion` | En `main`. 6.2: la demo completa se recorrió el 15 de noviembre sobre el PR #29 integrado con `main` (parte 11); falta que el #29 se apruebe y se fusione, y repetir el recorrido en `main` | Parte 3 (6.1); PR de B, C y D (6.2) |
| [7 · Verificación final](parte-7-verificacion-final.md) | 7.1 | `lote-a/parte-7-verificacion` | En `main`. Las huellas se repitieron en `main` y son idénticas (parte 8) | Todas |
| [8 · Decisiones y paquete público](parte-8-decisiones-y-paquete-publico.md) | 1.6 y 5.4 | `lote-a/parte-8-decisiones-y-paquete-publico` | En `main` (PR #26, con la parte 10). 1.6 hecha: decisiones aprobadas (PR #11) y contrato 1.1 (PR #13) | Partes 1 a 7 |
| [9 · Verificación en el SEACE](parte-9-verificacion-seace.md) | 3.4 y 4.5 | `lote-a/parte-9-verificacion-seace` | Lista de casos en `main` (PR #27); la parte 11 agrega el análisis de versiones de un mismo procedimiento. Falta la consulta manual del miércoles 18 al viernes 20 | Parte 8 |
| [10 · Paquete público](parte-10-paquete-publico.md) | 5.4 | `lote-a/parte-10-paquete-publico` | En `main` (PR #30). 5.4 cerrada: la web publicada en Vercel carga el paquete público | Parte 8 |
| [11 · Cierre del Lote A](parte-11-cierre-lote-a.md) | 5.4 y 6.2; análisis para 3.4 y 4.5 | `lote-a/parte-11-cierre-lote-a` | En PR: cierra la 5.4, recorre la demo sobre el PR #29 y documenta las versiones de un mismo procedimiento | Partes 9 y 10 |

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
  - el monto final cubre el 9,1 % de los contratos;
  - un procedimiento nulo o retrotraído se vuelve a publicar con otro `ocid` y la misma nomenclatura ([parte 9](parte-9-verificacion-seace.md#versiones-de-un-mismo-procedimiento)).

## Qué falta, por qué y quién (15 de noviembre)

Lo que queda del Lote A depende de decisiones del equipo, de las pantallas de los otros lotes o de revisiones manuales. El detalle está en cada ficha.

### Decisiones del equipo

| Qué falta | Por qué no se hizo | Qué hace falta | Quién |
|---|---|---|---|
| Umbrales de S04 | Están cargados con su norma (art. 14 de las leyes 32185 y 32513), pero S04 marcaría de 540 a 841 procesos según la calibración | Confirmar los montos y decidir si se activa y con qué calibración | Joaquín y el equipo |
| Versiones de un mismo procedimiento | Hay 331 versiones anteriores (nulas o retrotraídas) que se evalúan como procesos aparte. Cambian S03 (de 30 a 28), S05 (de 7 a 5) y S04 | Decidir con la verificación en el SEACE si se dejan de evaluar ([parte 9](parte-9-verificacion-seace.md#versiones-de-un-mismo-procedimiento)) | Stefano y el equipo |

### Bloqueado por las pantallas de los otros lotes

| Qué falta | Por qué no se hizo | Qué hace falta | Quién |
|---|---|---|---|
| 6.2 · Recorrer la demo completa | Las pantallas están en el PR #29, que no tiene aprobaciones, y el #22 tiene conflictos. Sobre el #29 integrado con `main`, el recorrido completo ya funciona con el paquete público ([parte 6](parte-6-opcionales-e-integracion.md)) | Aprobar y fusionar el #29; repetir el recorrido en `main` con el paquete público y con el fixture | Otra persona del equipo aprueba el #29; recorre Stefano |

### Revisiones manuales y documentación

| Qué falta | Por qué no se hizo | Qué hace falta | Quién |
|---|---|---|---|
| 3.4 · Verificar en el SEACE 5 casos de S01 (y de S02, si se activa) | Es una revisión manual en el portal, que el pipeline no puede automatizar sin hacer scraping. Está programada del miércoles 18 al viernes 20 | [Parte 9](parte-9-verificacion-seace.md): los 5 casos de S01 están listos; confirmar que `numero_postores` son participantes registrados | Stefano |
| 4.5 · Verificar en el SEACE 5 casos de S03 y 5 de S04 | Revisión manual, en la misma parte 9. S04 está desactivada hasta tener sus umbrales | [Parte 9](parte-9-verificacion-seace.md): los 5 casos de S03 y los 5 de S04 están listos, con lo que hay que mirar en cada uno | Stefano |
| Archivar el change de OpenSpec | Siguen abiertas 3.4, 4.5 y 6.2, y falta confirmar la entrega del Stage-Gate 1 | `/opsx:archive` cuando todo esté cerrado | Stefano |
