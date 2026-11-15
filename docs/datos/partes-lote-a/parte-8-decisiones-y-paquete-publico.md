# Parte 8 · Decisiones de señales y paquete público (tareas 1.6 y 5.4)

**Rama:** `lote-a/parte-8-decisiones-y-paquete-publico`, desde `main`. **PR:** la propuesta de decisiones fue el #11, solo de documentos, aprobado y fusionado el 14 de noviembre. La configuración y el paquete público van en un segundo PR desde la misma rama.

**Encargo:** [`docs/plan/fase-1/lote-a-stefano.md`](../../plan/fase-1/lote-a-stefano.md), secciones 2 y 3.

## Objetivo

Que el equipo decida cada señal con los datos del spike, y que para el H2 (jueves 19) la web use el paquete público de La Libertad con esas decisiones aplicadas.

## Tareas

- [x] 1.6 Revisar con el Lote B el contrato v1 (`docs/arquitectura/contrato-paquete-de-datos.md`) y ajustarlo a lo que mostró el spike. Verificar con la aprobación de los cuatro integrantes en el PR.
- [ ] 5.4 Generar el paquete público de La Libertad en `web/data/publico/` y el local en `web/data/local/`. Verificar con el Lote B que la web carga el paquete público y que `git status` no muestra el local. *El paquete está generado y validado (ver el resultado). Falta que se fusione su PR y que Joaquín confirme que la web lo carga en Vercel.*

**Cómo se cerró la 1.6:** los cuatro aprobaron la propuesta en el PR #11 (Joaquín y Stefano por escrito; Sebastián y André de forma verbal, según registró Joaquín en el PR). El ajuste del contrato es el contrato 1.1 de Joaquín (PR #13, en `main`): `nomenclatura` y el significado de `numero_postores`.

## Propuesta de decisiones (tarea 1.6)

**Para aprobar hasta el lunes 16.** Cada uno comenta en el PR "Apruebo", o el número de la decisión que cambiaría y por qué. Las decisiones que tocan el contrato se acuerdan con Joaquín, porque el documento del contrato, el schema, los tipos y el fixture son suyos.

Las cifras son de La Libertad 2025–2026 (5 036 procesos, datos al 4 de octubre de 2026). Q1–Q8 son las preguntas del [spike](../fuente-de-datos.md#spike-de-datos-primer-paso-del-lote-a).

| # | Tema | Recomendación | Por qué | Qué cambia si se aprueba |
|---|---|---|---|---|
| 1 | S01 · nombre | Llamarla "Un solo participante registrado". El campo `numero_postores` conserva su nombre, y el contrato aclara que cuenta participantes registrados, no ofertas | La fuente no trae `bids`, y hay procesos desiertos con 81, 74 y 64 "postores" (Q3) | `unidad` y `descripcion_umbral` de `[S01]` en `senales.toml`, el catálogo, el texto de S01 (Sebastián), la metodología (André) y la descripción del campo en el contrato (Joaquín). El schema no cambia |
| 2 | S01 · procesos desiertos | Evaluar S01 solo en procesos con al menos una adjudicación | 33 de las 69 señales son de procesos desiertos, sin contrato que revisar. Quedarían 33 señales (si solo se sacan los desiertos, 36) | Un parámetro nuevo en `[S01]` y la versión S01@2. El contraste con Cardinal R018 explicará esos 33 casos como diferencia |
| 3 | S02 | Dejarla desactivada con el motivo que ya tiene ("La fuente no trae el plazo de presentación de ofertas…") y subir S05 al núcleo | `tenderPeriod` empieza y termina el día de la convocatoria en el 99,99 % de los procesos, y Cardinal R003 marca casi todo (Q2) | El catálogo pasa S05 a núcleo y la metodología lo explica. El código no cambia |
| 4 | Pesos en el manifiesto | Publicar solo los pesos de las señales activas | Hoy `manifest.prioridad.pesos` también lista S02, S04, S06 y S07, que no suman | `export` (pipeline) y lo que muestra la metodología |
| 5 | S04 | Verificar los umbrales en la norma oficial, con la cita y la fecha, y activarla solo si la calibración da un volumen que se pueda revisar. Si no se llega para el H2, sigue desactivada | Con montos de referencia sin verificar, marcaría 287 grupos y 843 procesos (17 %); con una ventana de 30 días y productos de 8 dígitos, 203 grupos y 542 procesos ([detalle](#detalle-de-s04)). Cada proceso marcado llega al menos a prioridad media | `S04.umbrales`, `ventana_dias` y `digitos_clasificacion` en `senales.toml`, el catálogo y la metodología. Los 5 casos de S04 de la tarea 4.5 salen de la estimación |
| 6 | S06 | Mantenerla desactivada | Solo 290 de 3 177 contratos (9,1 %) tienen monto final y el mínimo es 10 % (Q6). Con un mínimo de 5 % marcaría 61 contratos con el factor 1,15, que habría que calibrar (la mediana nacional de la razón es 1,11) | Nada: el manifiesto ya la lista como desactivada, con su cobertura |
| 7 | S03 · mínimos | Confirmar el mínimo de 3 adjudicaciones y agregar `participacion_minima = 0.05` | Cuando casi todos los proveedores de una entidad ganan un solo proceso, la valla queda entre 1 % y 3 %. Con el 5 % quedan 29 de las 46 señales | `senales.toml` y la versión S03@2 |
| 8 | S05 · mínimos | Confirmar `minimo_directas = 3` y agregar `proporcion_minima = 0.05` | 56 de las 84 municipalidades no hacen contrataciones directas, y la valla del monto queda en 0,9 %. Con el 5 % quedan 7 de las 9 señales | `senales.toml` y la versión S05@2 |
| 9 | Métodos | Clasificar los 55 nombres como en la [tabla de métodos](#clasificación-de-métodos). Los dudosos quedan sin señal | 32 nombres se usan en 2025–2026; 6 de ellos son dudosos. Los otros 23 son de normas anteriores | `[metodos]` de `senales.toml`. El manifiesto lista los dudosos en `metodos_sin_clasificar` |
| 10 | Contrato · nomenclatura | Agregar `nomenclatura` (`tender.title`) a cada proceso, si Joaquín puede incluirla antes del miércoles 18 | Con ella se busca el proceso en el SEACE: la fuente no trae una URL por proceso y `url_seace` va en `null`. También sirve para la verificación de las tareas 3.4 y 4.5 | Documento del contrato, schema, tipos y fixture (Joaquín), y `export` (pipeline) |
| 11 | Tamaño del paquete | Escribir el JSON sin sangría y dejar un documento por tipo en cada proceso | Hoy pesa 12,9 MB (14 MB con `du -sh`), sobre el límite de 10 MB. Sin sangría pesaría 10,2 MB, y con un documento por tipo, 8,3 MB (19 778 de 30 517 documentos) | `export` (pipeline). La ficha del proceso muestra menos documentos (Sebastián). El contrato no cambia |

**Lo que no cambia del contrato:** `fechas.inicio_presentacion` y `fin_presentacion` siguen en `null` porque la fuente no las trae, `url_seace` sigue en `null`, y los consorcios siguen como `tipo: "desconocido"`, sin un tipo nuevo.

### Detalle de S04

**Umbrales propuestos, con su norma.** El umbral de cada método es el monto desde el que corresponde el método superior. Los fija el artículo 14 de las leyes de presupuesto, leído en sus textos consolidados del portal de leyes del Congreso el 15 de noviembre de 2026:

- **Ley 32185 (2025), artículo 14.1, márgenes de la Ley 30225:** licitación pública de obras si el valor referencial es igual o superior a S/ 5 000 000,00, y adjudicación simplificada si es inferior; licitación pública de bienes y concurso público de servicios si el valor estimado es igual o superior a S/ 485 000,00, y adjudicación simplificada si es inferior.
- **Ley 32185 (2025), artículo 14.2, márgenes de la Ley 32069**, desde su entrada en vigencia: los mismos montos, con la licitación pública abreviada (obras y bienes) y el concurso público abreviado (servicios) por debajo.
- **Ley 32513 (2026), artículo 14, márgenes de la Ley 32069:** los mismos montos.

Están cargados en `S04.umbrales` con su norma y la fecha de lectura, y S04 sigue desactivada hasta que Joaquín confirme los montos y el equipo elija una calibración. Comparación de Precios no tiene umbral en esas leyes, así que no se evalúa.

| Grupo de procesos | Objeto | Umbral que se compara |
|---|---|---|
| Licitación Pública Abreviada | Bienes y obras | Monto desde el que corresponde la Licitación Pública |
| Concurso Público Abreviado | Servicios | Monto desde el que corresponde el Concurso Público |
| Adjudicación Simplificada (Ley 30225, procesos de 2025) | Bienes, servicios y obras | Monto desde el que corresponde la Licitación Pública o el Concurso Público |

**Estimación del volumen.** Con esos montos, calculada en una copia aparte de las tablas (sin tocar las salidas reales). La estimación del 14 de noviembre daba un grupo más (287) porque también usaba umbrales de Adjudicación Simplificada para 2026, que la Ley 32513 no fija.

| Calibración | Grupos S04 | Procesos marcados |
|---|---:|---:|
| Ventana de 60 días, clase de 6 dígitos (configuración actual) | 286 | 841 |
| Ventana de 30 días, clase de 6 dígitos | 224 | 632 |
| Ventana de 60 días, producto de 8 dígitos | 256 | 734 |
| Ventana de 30 días, producto de 8 dígitos | 202 | 540 |

Con la configuración actual, 145 de los 286 grupos son de concursos abreviados de servicios. Son demasiados para la bandeja: con las reglas aprobadas hay 154 procesos con señales.

### Clasificación de métodos

Los 55 nombres de método del archivo `2026.jsonl.gz` se reparten así:

- **32 se usan en convocatorias de 2025–2026** (19 en La Libertad), y están en la tabla de abajo.
- **23 son de normas anteriores** y no tienen convocatorias en 2025–2026: métodos del DL 1017, variantes de la Adjudicación Simplificada por decretos de urgencia y la Contratación Directa de Petroperú, entre otros. Se proponen sin clasificar, porque no cambian nada en la demo; se clasificarían si se amplía el periodo.
- **Un proceso nacional no trae método**, y se cuenta como "proceso sin método".

Lo que cambia es que 6 nombres pasan a "dudoso: sin señal". Para S01 no cambia nada, porque ya quedaban fuera, pero el manifiesto los cuenta y los nombra. En La Libertad son 175 procesos.

| Método | Procesos en el país (2025–2026) | En La Libertad | Hoy | Propuesta | Por qué es dudoso |
|---|---:|---:|---|---|---|
| Licitación Pública Abreviada | 32 328 | 1 533 | competitivo | competitivo | — |
| Concurso Público Abreviado | 28 717 | 1 050 | competitivo | competitivo | — |
| Subasta Inversa Electrónica | 15 890 | 494 | competitivo | competitivo | — |
| Adjudicación Simplificada | 15 824 | 585 | competitivo | competitivo | — |
| Comparación de Precios | 9 805 | 180 | competitivo | competitivo | — |
| Contratación Directa | 7 880 | 377 | no competitivo | no competitivo (es la que cuenta S05) | — |
| Licitación Pública | 7 774 | 362 | competitivo | competitivo | — |
| Concurso Público de Servicios | 4 710 | 146 | competitivo | competitivo | — |
| Regímen Especial (así viene escrito) | 4 190 | 82 | no competitivo | **dudoso: sin señal** | Posiblemente obras por impuestos u otro régimen especial; no se sabe si hubo competencia |
| Convenio | 3 094 | 11 | no competitivo | **dudoso: sin señal** | Posiblemente convenios entre entidades; no se sabe si hubo selección de postores |
| Contratación Internacional | 1 767 | 82 | no competitivo | **dudoso: sin señal** | Posiblemente compras en el extranjero o con organismos internacionales, con otras reglas |
| Concurso Público para Consultoría | 1 724 | 67 | competitivo | competitivo | — |
| Concurso Público | 1 235 | 43 | competitivo | competitivo | — |
| Adjudicación Abreviada | 649 | 0 | sin clasificar | **dudoso: sin señal** | Régimen no identificado; no hay en La Libertad |
| Adjudicación Selectiva | 540 | 0 | sin clasificar | **dudoso: sin señal** | Régimen no identificado; no hay en La Libertad |
| Adjudicación Simplificada-Homologación | 233 | 7 | variante de Adjudicación Simplificada | igual | — |
| Licitación Pública Abreviada Homologación | 180 | 2 | variante de Licitación Pública Abreviada | igual | — |
| Procedimiento Especial de Contratación | 126 | 11 | competitivo | competitivo | — |
| Concurso Público Abreviado Homologación | 102 | 0 | variante de Concurso Público Abreviado | igual | — |
| Procedimiento Especial de Contratación-Nueva Convocatoria por Desierto | 53 | 1 | variante de Procedimiento Especial de Contratación | igual | — |
| Contratos Estandarizados | 35 | 0 | sin clasificar | **dudoso: sin señal** | Modalidad no identificada; no hay en La Libertad |
| Concurso Público Abreviado Séptima DCF Ley N°32069 | 30 | 0 | variante de Concurso Público Abreviado | igual | — |
| Licitación Pública Abreviada - Ley N°31589 | 20 | 2 | variante de Licitación Pública Abreviada | igual | — |
| Adjudicación para Contrato Marco | 11 | 0 | competitivo | competitivo | — |
| Licitación Pública Abreviada - Ley N°26859 | 11 | 1 | variante de Licitación Pública Abreviada | igual | — |
| Concurso Público Abreviado - Ley N°26859 | 10 | 0 | variante de Concurso Público Abreviado | igual | — |
| Concurso Público Abreviado - Ley N°31589 | 9 | 0 | variante de Concurso Público Abreviado | igual | — |
| Licitación Pública Abreviada Séptima DCF Ley N°32069 | 4 | 0 | variante de Licitación Pública Abreviada | igual | — |
| Proceso por Competencia | 4 | 0 | competitivo | competitivo | — |
| Selección de Consultores Individuales | 3 | 0 | competitivo | competitivo | — |
| Adjudicación Simplificada - Séptima Disposición Complementaria Final Reg. Ley 30225 | 1 | 0 | variante de Adjudicación Simplificada | igual | — |
| Concurso Público para Evaluadores Expertos | 1 | 0 | competitivo | competitivo | — |

## Resultado: decisiones aplicadas (15 de noviembre)

| # | Cómo quedó |
|---|---|
| 1 | S01 se llama "Un solo participante registrado"; `unidad` = "participantes registrados" |
| 2 | S01@2 solo evalúa procesos con adjudicación (`solo_con_adjudicacion`); los demás se cuentan como "proceso sin adjudicación" |
| 3 | S02 sigue desactivada y S05 pasa al núcleo en el catálogo |
| 4 | `manifest.prioridad.pesos` lista solo S01, S03 y S08, las señales activas con peso |
| 5 | Umbrales de S04 cargados con su norma; S04 sigue desactivada hasta la confirmación y la calibración |
| 6 | S06 sigue desactivada por cobertura (9.1%) |
| 7 | S03@2 con `participacion_minima = 0.05` |
| 8 | S05@2 con `proporcion_minima = 0.05` |
| 9 | `metodos.dudosos` con los 6 nombres; S01 los cuenta aparte ("método dudoso (sin señal)") |
| 10 | Cada proceso trae `nomenclatura` y el manifiesto declara el contrato 1.1 |
| 11 | JSON sin sangría y un documento por tipo en cada proceso (`paquete.documentos_por_tipo` en `pipeline.toml`) |

Las reglas pasan a `2026.11.2`. También se ajustaron la spec de S01 y S03, las decisiones 3 y 5 de `design.md` y la cita de DuckDB y jsonschema en `docs/producto/referentes-internacionales.md`.

**Paquete de La Libertad 2025–2026:**

- **Señales:** 76 (antes 130): S01 = 33, S03 = 30, S05 = 7 y S08 = 6 (simuladas).
- **Prioridad:** 154 procesos con señales, 1 en prioridad alta y 153 en media.
- **Contraste con Cardinal:** R018 coincide en los 33 casos de S01 y marca 38 más, todos con su motivo (36 sin adjudicación y 2 cancelados).
- **Contenido:** 19 778 documentos; los 5 036 procesos traen su nomenclatura.
- **Tamaño:** 8,8 MB con `du -sh`, bajo el límite de 10 MB.

**Verificación:**

- `uv run pytest`: 158 passed; `uv run ruff check` y `uv run ruff format --check`, sin observaciones; `openspec validate --all --strict`, sin errores.
- Desde `web/`: `PAQUETE_DIR=data/publico npm test -- paquete` y `PAQUETE_DIR=data/local npm test -- paquete`, 10 de 10 en cada uno.
- `PAQUETE_DATOS=publico npm run build` y `npm run start`: el panel muestra la entidad con sus procesos, la señal S05, las categorías, la tendencia y los proveedores con seudónimo; la bandeja lista sus 21 procesos con señales, con prioridad, método, señal, fecha y monto.
- **Privacidad:** 0 números con forma de RUC y 0 nombres de personas naturales o jurídicas en el paquete público (quedan 12 nombres de consorcios que son nombres de lugares, como en la parte 5). `git status` no muestra `web/data/local/`.
- **Huellas:** dos ejecuciones completas de la cadena dan huellas idénticas en los 537 archivos.
- **Con la web actual de `main`** (`fce1475`, con la ficha del proceso y la del proveedor, 15 de noviembre): `npm run typecheck`, `npm run lint`, `npm test` (333 pruebas) y la prueba de contrato del paquete, en verde. La ficha del proceso y la del proveedor cargan con los datos reales; el texto de S03 ya dice "Obtuvo 13 de los 36 procesos adjudicados".

**Pendiente:**

- Joaquín confirma los umbrales de S04, y el equipo elige si se activa y con qué calibración.
- Fusionar el PR del paquete. Después, Joaquín activa `PAQUETE_DATOS=publico` en Vercel y confirma que la web carga el paquete: eso cierra la 5.4.
- **Sebastián:**
  - el texto de S01, que todavía dice "Oferta única" y "Este proceso recibió 1 oferta";
  - mostrar la `nomenclatura` en la ficha del proceso, para buscarlo en el SEACE. Hoy dice "La fuente no publica un enlace para este proceso".

## Ya verificado en `main` (pendiente de la parte 7)

- **Pruebas:** con `main` en `a53b161`, `uv sync` y `uv run pytest` dan 146 passed. `uv run ruff check` y `uv run ruff format --check` no tienen observaciones.
- **Reproducibilidad:** la cadena completa (`ingest`, `normalize`, `signals`, `cardinal` y `export` público y local) se corrió dos veces.
  - `uv run pipeline fingerprint --out` y `--compare` dan huellas idénticas en los 537 archivos.
  - Además coinciden con las de la parte 7: `main` reproduce exactamente sus salidas.

## Pasos de la tarea 5.4 (hechos, salvo el último)

1. Aplicar las decisiones aprobadas en `pipeline/config/senales.toml` (y en el código, las que lo piden: 2, 4, 7, 8, 9, 10 y 11), con sus pruebas. Después, regenerar con `ingest`, `normalize`, `signals`, `export --modo publico` y `export --modo local`.
2. **Validar:**
   - desde `web/`, `PAQUETE_DIR=data/publico npm test -- paquete`;
   - `PAQUETE_DATOS=publico npm run build && PAQUETE_DATOS=publico npm run start`, recorriendo el panel y la bandeja.
3. **Privacidad:** ningún RUC ni nombre real en `web/data/publico/`, y `git status` no muestra `web/data/local/`.
4. **Tamaño:** anotar el peso con `du -sh`. Si pasa de 10 MB, avisar a Joaquín antes de subirlo.
5. **Huellas:** dos ejecuciones con `fingerprint --out` y `--compare`.
6. **PR del paquete.** Cuando se fusione, Joaquín activa `PAQUETE_DATOS=publico` en Vercel.

## Verificación y entrega

- **1.6:** la aprobación de los cuatro en el PR de esta propuesta.
- **5.4:** las comprobaciones de arriba, anotadas en el PR del paquete, y la confirmación de Joaquín de que la web carga el paquete público.

## Archivos

Primer PR (#11): esta ficha y el índice de las partes. Segundo PR: `pipeline/config/` (`senales.toml` y `pipeline.toml`), `pipeline/src/pipeline/` (S01, S03, S05, S06, `format.py`, `settings.py`, `compute.py`, `cardinal.py`, `config.py` y `export.py`), `pipeline/tests/`, `docs/datos/catalogo-de-senales.md`, esta ficha, la spec y el `design.md` del change, `docs/producto/referentes-internacionales.md` y `web/data/publico/` (generado).
