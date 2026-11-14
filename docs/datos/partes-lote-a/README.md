# Partes del Lote A

El Lote A (datos y señales) se divide en partes. Cada parte tiene su ficha, su rama y su PR hacia `main`. Las tareas son las de [`tasks.md`](../../../openspec/changes/lote-a-datos-y-senales/tasks.md); la ficha agrega el contexto, el diseño propuesto y cómo verificarla.

## Estado

| Parte | Tareas | Rama | Estado | Depende de |
|---|---|---|---|---|
| 1 · Spike de datos | 1.1–1.6 | `lote-a/parte-1-spike-datos` | PR #1. Falta 1.6 (contrato, con el equipo) | — |
| 2 · Ingesta y normalización | 2.1–2.5 | `lote-a/parte-2-ingesta` | PR #2 | Parte 1 |
| [3 · Señales S01 y S02](parte-3-senales-s01-s02.md) | 3.1–3.4 | `lote-a/parte-3-senales-s01-s02` | 3.1–3.3 hechas, en PR. Falta 3.4 (verificación en el SEACE) | Parte 2 |
| [4 · S03, S04, S08 y Cardinal](parte-4-s03-s04-s08-cardinal.md) | 4.1–4.5 | `lote-a/parte-4-s03-s04-s08-cardinal` | 4.1–4.4 hechas, en PR. Falta 4.5 (verificación en el SEACE); S04 espera sus umbrales | Parte 3 |
| [5 · Prioridad y paquete](parte-5-prioridad-y-paquete.md) | 5.1–5.4 | `lote-a/parte-5-prioridad-y-paquete` | 5.1–5.3 hechas, en PR. Falta 5.4 (Joaquín confirma que la web carga el paquete público; el equipo lo revisa antes de subirlo) | Partes 3 y 4; tarea 1.6 |
| [6 · S05, S06 e integración](parte-6-opcionales-e-integracion.md) | 6.1–6.2 | `lote-a/parte-6-opcionales-e-integracion` | 6.1 hecha, en PR. 6.2: integración de prueba hecha (sin conflictos); falta que B, C y D abran y aprueben sus PR y que existan las pantallas | Parte 3 (6.1); PR de B, C y D (6.2) |
| [7 · Verificación final](parte-7-verificacion-final.md) | 7.1 | `lote-a/parte-7-verificacion` | 7.1 hecha, en PR (sobre la rama de la parte 6, porque `main` aún no tiene el Lote A). Repetir las huellas en `main` después de fusionar | Todas |

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

## Qué falta, por qué y quién (14 de noviembre)

Lo que queda del Lote A no depende de más código del lote: depende de la integración con los otros lotes, de decisiones del equipo o de revisiones manuales. El detalle está en cada ficha.

### Bloqueado por la integración

| Qué falta | Por qué no se hizo | Qué hace falta | Quién |
|---|---|---|---|
| Fusionar en `main` los PR del Lote A (#1 a #7) | Cada PR necesita la revisión de otra persona del equipo, y se decidió no fusionar nada por ahora | Revisarlos y fusionarlos en orden, del #1 al #7 | Equipo; fusiona Stefano |
| 6.2 · Integrar B, C y D y recorrer la demo | No hay PR de B, C ni D, y la web solo tiene la página provisional de la Fase 0. La integración de prueba (`main` + A + las ramas de C y D) pasó sin conflictos ([parte 6](parte-6-opcionales-e-integracion.md#integración-de-prueba-tarea-62-14-de-noviembre)) | Que B, C y D abran sus PR y otra persona los apruebe, que existan las pantallas (bandeja, ficha, explicación, decisión y reporte) y que se fusionen en `main`. Después, regenerar el paquete y recorrer la demo con el paquete público y con el fixture | B, C y D; fusiona Stefano |
| 5.4 · Confirmar que la web carga el paquete público | Lo confirma el Lote B | Que Joaquín pruebe la web con `PAQUETE_DATOS=publico`. El build ya funciona y muestra los datos reales | Joaquín |
| Subir `web/data/publico/` | Se sube solo después de revisarlo | Revisión del equipo y un commit aparte | Equipo |
| Repetir la comparación de huellas desde `main` | La 7.1 se verificó sobre la rama de la parte 6, porque `main` aún no tiene el Lote A | Después de fusionar, correr la cadena dos veces y comparar con `uv run pipeline fingerprint --compare` | Stefano |
| Ajustar dos textos del Lote C | El contrato no fijaba las claves de `entradas`; ahora están en el [catálogo](../catalogo-de-senales.md#entradas-de-cada-señal) | Que S03 lea `procesos_ganados` y `procesos_entidad` (hoy falta la frase "Obtuvo X de Y" en las 46 señales) y que S01 diga "participantes registrados" en lugar de "ofertas" | Sebastián |
| `npm run typecheck` en una copia nueva | Falla con `LayoutProps` hasta que Next.js genera sus tipos, también en `main` | Generar los tipos (`npm run build`) antes del chequeo, o incluirlo en el script | Joaquín |

### Decisiones del equipo

| Qué falta | Por qué no se hizo | Qué hace falta | Quién |
|---|---|---|---|
| 1.6 · Ajustar el contrato | Necesita el acuerdo de los lotes B y C, y la aprobación de los cuatro integrantes | Revisar la tabla "Impacto en el contrato" de la [fuente de datos](../fuente-de-datos.md): significado de `numero_postores`, fechas de presentación nulas, `url_seace` y `nomenclatura`, tipo `consorcio` | Stefano con Joaquín y Sebastián |
| S02 | La fuente no trae el plazo de presentación | Dejarla desactivada o redefinirla con el plazo de consultas | Equipo |
| S04 | Faltan los umbrales de la Ley 32069 y su reglamento | Cargarlos en `S04.umbrales`, con la norma verificada | Equipo |
| S06 | Solo el 9.1% de los contratos tiene monto final y el mínimo es 10% | Dejarla desactivada, o bajar la cobertura mínima y calibrar el factor | Equipo |
| Proporciones mínimas de S03 y S05 | Las vallas quedan muy bajas cuando casi todos los casos valen cero | Aprobar `participacion_minima` y `proporcion_minima` en `senales.toml` | Equipo |
| Métodos dudosos | Contratación Internacional, Régimen Especial y Convenio están como no competitivos, sin confirmar | Confirmar su clasificación en `senales.toml` | Equipo |

### Revisiones manuales y documentación

| Qué falta | Por qué no se hizo | Qué hace falta | Quién |
|---|---|---|---|
| 3.4 · Verificar en el SEACE 5 casos de S01 y 5 de S02 | Es una revisión manual en el portal, que el pipeline no puede automatizar sin hacer scraping. S02 está desactivada | Revisar los casos de S01 y confirmar que `numero_postores` son participantes registrados | Stefano |
| 4.5 · Verificar en el SEACE 5 casos de S03 y 5 de S04 | Revisión manual. S04 está desactivada hasta tener sus umbrales | Revisar los casos de S03 listados en el PR #4 | Stefano |
| Decisiones 3 (departamento) y 5 (Cardinal) de `design.md` | El spike las cambió, y `design.md` no estaba entre los archivos de este trabajo | Ajustarlas: el departamento sale de la parte compradora, y `prepare` e `indicators` de Cardinal se compilan desde su código fuente | Stefano |
| Citar DuckDB y jsonschema (MIT) | `docs/producto/` no estaba entre los archivos de este trabajo | Agregarlas en `docs/producto/referentes-internacionales.md` | Stefano |
| Archivar el change de OpenSpec | Siguen abiertas 1.6, 3.4, 4.5, 5.4 y 6.2, y falta confirmar la entrega del Stage-Gate 1 | `/opsx:archive` cuando todo esté cerrado | Stefano |
