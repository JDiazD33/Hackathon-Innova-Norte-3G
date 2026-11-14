# Parte 8 · Decisiones de señales y paquete público (tareas 1.6 y 5.4)

**Rama:** `lote-a/parte-8-decisiones-y-paquete-publico`, desde `main`. **PR:** primero uno solo de documentos, con esta propuesta de decisiones. Cuando se apruebe, en la misma rama van la configuración y el paquete público, en otro PR.

**Encargo:** [`docs/plan/fase-1/lote-a-stefano.md`](../../plan/fase-1/lote-a-stefano.md), secciones 2 y 3.

## Objetivo

Que el equipo decida cada señal con los datos del spike, y que para el H2 (jueves 19) la web use el paquete público de La Libertad con esas decisiones aplicadas.

## Tareas

- [ ] 1.6 Revisar con el Lote B el contrato v1 (`docs/arquitectura/contrato-paquete-de-datos.md`) y ajustarlo a lo que mostró el spike. Verificar con la aprobación de los cuatro integrantes en el PR.
- [ ] 5.4 Generar el paquete público de La Libertad en `web/data/publico/` y el local en `web/data/local/`. Verificar con el Lote B que la web carga el paquete público y que `git status` no muestra el local.

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

**Qué hay que verificar.** El umbral de cada método es el monto desde el que corresponde el método superior. Están en la Ley 32069 (artículo 54.2), en su reglamento (Decreto Supremo 009-2025-EF, artículos 93 y 94, modificado por el Decreto Supremo 001-2026-EF) y en la Ley de Presupuesto de cada año. Los procesos de 2025 convocados antes de la Ley 32069 se rigen por la Ley 30225.

| Grupo de procesos | Objeto | Umbral que se compara |
|---|---|---|
| Licitación Pública Abreviada | Bienes y obras | Monto desde el que corresponde la Licitación Pública |
| Concurso Público Abreviado | Servicios | Monto desde el que corresponde el Concurso Público |
| Adjudicación Simplificada (Ley 30225, procesos de 2025) | Bienes, servicios y obras | Monto desde el que corresponde la Licitación Pública o el Concurso Público |
| Comparación de Precios | Bienes y servicios | Su tope |

**Estimación.** Se hizo con montos que citan fuentes secundarias, sin verificar: S/ 485 000 para bienes y servicios y S/ 5 000 000 para obras (por ejemplo, [Licitaciones Perú](https://licitacionesperu.pe/guia/ley-contrataciones-32069/)). Esas fuentes no coinciden entre sí en todos los rangos, así que **no se cargan hasta verificarlos en el texto oficial**. Se calculó en una copia aparte de las tablas, sin tocar las salidas reales.

| Calibración | Grupos S04 | Procesos marcados |
|---|---:|---:|
| Ventana de 60 días, clase de 6 dígitos (configuración actual) | 287 | 843 |
| Ventana de 30 días, clase de 6 dígitos | 225 | 634 |
| Ventana de 60 días, producto de 8 dígitos | 257 | 736 |
| Ventana de 30 días, producto de 8 dígitos | 203 | 542 |

Con la configuración actual, 145 de los 287 grupos son de concursos abreviados de servicios. Son demasiados para la bandeja: hoy hay 247 procesos con señales.

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

## Ya verificado en `main` (pendiente de la parte 7)

- **Pruebas:** con `main` en `a53b161`, `uv sync` y `uv run pytest` dan 146 passed. `uv run ruff check` y `uv run ruff format --check` no tienen observaciones.
- **Reproducibilidad:** la cadena completa (`ingest`, `normalize`, `signals`, `cardinal` y `export` público y local) se corrió dos veces.
  - `uv run pipeline fingerprint --out` y `--compare` dan huellas idénticas en los 537 archivos.
  - Además coinciden con las de la parte 7: `main` reproduce exactamente sus salidas.

## Después de la aprobación (tarea 5.4)

1. Aplicar las decisiones aprobadas en `pipeline/config/senales.toml` (y en el código, las que lo piden: 2, 4, 7, 8, 10 y 11), con sus pruebas. Después, regenerar con `ingest`, `normalize`, `signals`, `export --modo publico` y `export --modo local`.
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

Esta ficha y el índice `docs/datos/partes-lote-a/README.md`. Después de la aprobación: `pipeline/config/senales.toml`, `pipeline/src/pipeline/` (S01, `export`), `pipeline/tests/`, `docs/datos/catalogo-de-senales.md` y `web/data/publico/` (generado).
