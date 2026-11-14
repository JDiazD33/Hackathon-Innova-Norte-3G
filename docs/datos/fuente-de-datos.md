# Fuente de datos

## Fuente principal

**Perú: OECE (antes OSCE).** Es la publicación en formato OCDS de los procesos registrados en el SEACE, redistribuida por el **OCP Data Registry** de Open Contracting Partnership.

| | |
|---|---|
| Página del conjunto | <https://data.open-contracting.org/en/publication/135> |
| Origen oficial | <https://contratacionesabiertas.oece.gob.pe/descargas> (su API pide credenciales) |
| Licencia | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): se puede usar y adaptar citando la fuente e indicando los cambios |
| Prefijo OCID | `ocds-dgv273` |
| Cobertura | De enero de 2003 a octubre de 2026. El registro la recolecta cada mes (última recolección: 4 de octubre de 2026) |
| Formatos | JSON por líneas comprimido (`.jsonl.gz`, un proceso compilado por línea), CSV (`.csv.tar.gz`) y Excel (solo algunos años) |
| Métodos incluidos | Licitación pública, concurso público, adjudicación simplificada, subasta inversa electrónica, selección de consultores individuales, comparación de precios, contratación directa y concurso de proyectos de arquitectura |

### Tamaños comprimidos

| Archivo | Tamaño |
|---|---:|
| `2026.jsonl.gz` | 155 MB |
| `2025.jsonl.gz` | 149 MB |
| `2024.jsonl.gz` | 126 MB |
| `full.jsonl.gz` (todo el periodo) | 1 968 MB |
| `2026.csv.tar.gz` | 201 MB |

### Qué contiene (conteos de todo el periodo)

| Sección | Conteo |
|---|---:|
| Partes | 12 837 750 |
| Actividades de planificación | 794 515 |
| Licitaciones (`tender`) | 2 760 591 |
| Postores (`tenderers`) | 10 077 133 |
| Ítems de licitación | 5 145 770 |
| Adjudicaciones | 2 015 970 |
| Proveedores adjudicados | 2 006 734 |
| Contratos | 1 325 522 |
| Documentos | 13 244 820 |
| Transacciones (pagos) | **0** |
| Hitos | **0** |
| Modificaciones (`amendments`) | **0** |

**Extensiones publicadas:** moneda y tipo de cambio, valor total del ítem, culminación del contrato (fecha de término y monto final), departamento e información adicional del proceso.

### Cómo se reparten los procesos entre los archivos anuales

Cada archivo anual agrupa los procesos según la **fecha de su última actualización** (`date` del release compilado), no según el año de la convocatoria. En `2026.jsonl.gz`, todos los `date` están entre el 1 de enero y el 3 de octubre de 2026, pero las convocatorias (`tender.datePublished`) van de noviembre de 2013 a octubre de 2026: 57 856 son de 2026, 19 625 de 2025 y 15 492 de 2024 (`resumen` y `procesos_por_anio_de_convocatoria`). Consecuencias:

- El año de un proceso se toma de `tender.datePublished` (fecha de la convocatoria), nunca del nombre del archivo.
- `2026.jsonl.gz` tiene **todos** los procesos convocados en 2026 hasta la fecha de corte.
- Los procesos convocados en 2025 están repartidos entre `2025.jsonl.gz` (si su última actualización fue en 2025) y `2026.jsonl.gz` (si fue en 2026). Para tener 2025 completo hacen falta los dos archivos.
- Cada proceso aparece en un solo archivo. Con `2025.jsonl.gz` y `2026.jsonl.gz` juntos no se repite ningún `ocid` (`ocid_en_varios_archivos`), y en `2025.jsonl.gz` todos los `date` son de 2025 (`procesos_por_archivo`). La ingesta igual lo verifica y elimina duplicados por `ocid`.

## Límites que hay que decir en voz alta

- **Contratos sin procedimiento de selección:** no están, incluidos los menores a 8 UIT y otros umbrales. Esto limita la detección de fraccionamiento por debajo de ese monto.
- **Pagos, hitos y modificaciones contractuales:** no están. Con esta fuente no se pueden medir ampliaciones de plazo ni prestaciones adicionales; solo se puede comparar el monto contratado con el final cuando existe la culminación del contrato.
- **Responsables internos:** no está quién solicitó, evaluó o dio conformidad. Para el flujo de trazabilidad interna del desafío 2 usamos datos sintéticos, como permiten las bases.
- **Ofertas:** no hay `bids`. El número de "postores" (`tender.numberOfTenderers`) cuenta, según la evidencia del spike, a los **participantes registrados**, no las ofertas presentadas (ver Q3).
- **Plazo para presentar ofertas:** `tender.tenderPeriod` solo trae la fecha de la convocatoria, sin duración (ver Q2).
- **Ubicación:** el departamento es el de la dirección de la entidad compradora, no el del lugar de ejecución (ver Q1).

## Calidad de los datos

Problemas señalados por el registro (revisión de diciembre de 2023):

- Identificadores duplicados en postores y partes.
- Contratos sin estado.
- Códigos de `documentType` que no están documentados.
- Adjudicaciones sin contrato vinculado, y viceversa.

Cada señal debe manejar estos casos e indicar cuándo excluyó un proceso por la calidad de los datos.

**Lo que midió el spike en `2026.jsonl.gz`** (134 917 procesos; consultas `calidad.*` del informe):

| Problema | Cifra | Tratamiento propuesto |
|---|---:|---|
| Postores duplicados dentro de `tender.tenderers` | 0 procesos | Se mantiene la regla de deduplicar y contar (en otros años puede aparecer) |
| `parties` repetidas | 0 procesos | Igual que arriba |
| Contratos sin `status` | 75 856 de 104 571 (72,5 %). En La Libertad 2025–2026: todos | Estado "sin estado" |
| Adjudicaciones sin contrato vinculado (`contracts[].awardID`) | 23 410 de 114 656 (20,4 %) | Se conservan y se cuentan |
| Contratos cuyo `awardID` no coincide con ninguna adjudicación | 6 125 (5,9 %) | Se conservan y se cuentan |
| Adjudicaciones sin proveedor | 528 | Se excluyen de S03 y se cuentan |
| Adjudicaciones con varios proveedores | 0 | — |
| `documentType` | Solo `biddingDocuments`, `awardNotice`, `evaluationReports` y `clarifications`; 16 008 documentos sin tipo | Tipo "sin tipo" |
| Estado del proceso | No existe `tender.status` | Se deriva de `tender.items[].statusDetails` (CONTRATADO, DESIERTO, CONVOCADO, CONSENTIDO, NULO, ADJUDICADO, CANCELADO…) |
| Monedas | PEN en 132 545 procesos (98,2 %); USD 2 091, EUR 230 y otras 51 | `tender.value.amount_PEN` trae el monto convertido en el 100 % de los procesos |
| Texto | UTF-8 válido | En Windows hay que abrir los archivos con `encoding="utf-8"`; si no, aparecen caracteres corruptos |

**Identificadores de proveedores** (`awards[].suppliers[].id`, 114 128 proveedores adjudicados):

| Tipo | Adjudicaciones | Proveedores distintos |
|---|---:|---:|
| `PE-RUC-20…` (RUC de persona jurídica) | 67 452 (59,1 %) | 22 226 |
| Código corto que **no es un RUC** (1 a 8 dígitos; en su mayoría consorcios) | 26 570 (23,3 %) | 26 564 |
| `PE-RUC-10…` (RUC de persona natural) | 18 067 (15,8 %) | 12 042 |
| Otros formatos (por ejemplo, `PE-RUC-L…`) | 1 885 (1,7 %) | 1 395 |
| `PE-RUC-15…`, `16…` o `17…` (11 dígitos; confirmar el tipo con la SUNAT) | 154 (0,1 %) | 113 |

Los consorcios reciben prácticamente un código nuevo en cada adjudicación (26 564 códigos para 26 570 adjudicaciones), así que no se pueden seguir entre procesos.

**Enlace al SEACE:** los datos no traen una URL por proceso. `sources[].url` es la página general del buscador público y cada documento tiene su propio enlace de descarga (`prod1.seace.gob.pe/...`). Para encontrar un proceso en el buscador sirve la **nomenclatura**, que viene en `tender.title` (por ejemplo, `LP-ABR-1-2026-…`).

## Cómo obtener los datos

- **Descarga:** desde el OCP Data Registry, sin credenciales, con `uv run pipeline download` (desde `pipeline/`). Solo descarga desde las direcciones de `descarga.fuentes_permitidas` en `pipeline/config/pipeline.toml`, y solo sigue redirecciones hacia ellas. Cualquier otra se rechaza antes de descargar y el error la nombra. Cada archivo queda con un `<archivo>.meta.json` que registra la URL, la fecha, el tamaño, el SHA-256 y la última modificación.
- **Lo que no hacemos:** usar la API del portal del OECE sin credenciales oficiales ni hacer scraping del SEACE. FUNES sufrió bloqueos por obtener datos así.
- **Dónde se guardan:** los archivos van a `data/raw/` y nunca se suben al repositorio.

### Descargas registradas

| Archivo | URL | Fecha de descarga | Tamaño | Verificación |
|---|---|---|---:|---|
| `data/raw/2026.jsonl.gz` | <https://data.open-contracting.org/en/publication/135/download?name=2026.jsonl.gz> (redirige a `fastly.data.open-contracting.org/downloads/peru_oece_bulk/4263/2026.jsonl.gz`) | 13 de noviembre de 2026, 17:13 (hora de Lima) | 155 156 276 bytes (155 MB, igual al publicado); 1 485 344 603 bytes sin comprimir; 134 917 procesos | `Last-Modified`: 4 de octubre de 2026. SHA-256 `fc4a7a9b299e342d061aaffe7d13f9c3beced15d0bc985c0f84905b3ba8b8515`. `git status` no muestra el archivo |
| `data/raw/2025.jsonl.gz` | <https://data.open-contracting.org/en/publication/135/download?name=2025.jsonl.gz> (redirige a `fastly.data.open-contracting.org/downloads/peru_oece_bulk/4263/2025.jsonl.gz`) | 13 de noviembre de 2026, 17:48 (hora de Lima) | 148 719 573 bytes (149 MB, igual al publicado); 1 456 546 187 bytes sin comprimir; 124 538 procesos | `Last-Modified`: 4 de octubre de 2026. SHA-256 `65444cad90df5c559584d75124884734bff2875616de716d949aa5b858bd160b`. `git status` no muestra el archivo |

## Spike de datos (primer paso del Lote A)

Respondido el 13 de noviembre de 2026. Las cifras salen de las consultas DuckDB de `pipeline/src/pipeline/spike.py`; cada respuesta cita el nombre de su consulta. Las cifras nacionales son de `2026.jsonl.gz` (134 917 procesos), salvo que se diga otra cosa. Las de La Libertad salen de `2025.jsonl.gz` y `2026.jsonl.gz` juntos (259 455 procesos). Para repetirlas:

```bash
cd pipeline
uv run pipeline spike ../data/raw/2026.jsonl.gz                             # data/derived/spike-2026.json
uv run pipeline spike ../data/raw/2025.jsonl.gz ../data/raw/2026.jsonl.gz   # data/derived/spike-2025-2026.json
```

"La Libertad 2025–2026" significa: comprador de La Libertad y convocatoria (`tender.datePublished`) en 2025 o 2026, en los dos archivos. Son 5 036 procesos. La muestra de Cardinal (Q8) y las coberturas marcadas como "muestra de `2026.jsonl.gz`" usan solo los 2 888 de ese archivo.

### Resumen

| Pregunta | Respuesta corta | Efecto en las señales |
|---|---|---|
| Q1 · Departamento | Dirección del comprador: `parties[id = buyer.id].address.department` (100 %) | Filtro posible sin exclusiones en 2026 |
| Q2 · `tenderPeriod` | Existe, pero inicio = fin = día de la convocatoria (99,99 %) | **S02 no se puede calcular** como está definida |
| Q3 · Postores | No hay `bids`. `tender.numberOfTenderers` (91,1 %) cuenta participantes registrados | S01 pasa a "un solo participante registrado" |
| Q4 · Clasificación | CUBSO en `classification` y UNSPSC en `additionalClassifications` | S04 viable; conviene agrupar por clase o familia UNSPSC |
| Q5 · Método | `procurementMethodDetails` en el 100 %; `procurementMethod` incompleto | El carácter competitivo sale de una tabla propia en la configuración |
| Q6 · Culminación | `contracts[].implementation.finalValue` en el 10,3 % de los contratos (9,1 % en La Libertad 2025–2026) | **S06 queda bajo el mínimo del 10 %**: con la regla actual se desactiva |
| Q7 · Tamaño | La Libertad: 2 944 procesos convocados en 2025 y 2 092 en 2026 (5 036 en total) | Demo de unos 5 000 procesos |
| Q8 · Cardinal | R018 y R048 se pueden calcular; R003 se ejecuta pero marca todo; los otros 8 necesitan `bids` | Contraste solo para S01 |

### Q1 · ¿Cómo se identifica el departamento (La Libertad) de cada proceso?

**Por la dirección del comprador.** No hay un departamento a nivel del proceso ni un lugar de entrega en los ítems. La "extensión de departamento" es el campo `address.department` de `parties`.

- **Campo:** la entrada de `parties` cuyo `id` es igual a `buyer.id`, en `address.department`. Está en los 134 917 procesos, esa entrada nunca se repite y `tender.procuringEntity.id` siempre es igual a `buyer.id` (`cobertura_del_departamento`).
- `address.region` trae la **provincia** (por ejemplo, LA LIBERTAD → TRUJILLO) y `address.locality`, el distrito. Difieren de `department` en 65 857 procesos.
- Hay 25 valores de departamento (los 24 departamentos y el Callao). La Libertad tiene 4 671 procesos en `2026.jsonl.gz` (`procesos_por_departamento`) y 5 036 convocados en 2025–2026 entre los dos archivos. Con los dos archivos, la cobertura del departamento sigue siendo del 100 % (259 455 procesos). Provincias con más procesos en `2026.jsonl.gz`: Trujillo (2 391), Sánchez Carrión (633), Pataz (329), Santiago de Chuco (299) y Otuzco (265) (`provincias_del_departamento`).
- **Cambio para la decisión 3 del diseño:** el orden "extensión de departamento del proceso → dirección del comprador" se reduce a la dirección del comprador. "Región indeterminada" es un comprador sin entrada en `parties` o sin `department`: 0 casos en 2026, pero la regla se mantiene.
- **Límite:** es la ubicación de la entidad, no la del lugar de ejecución. Una entidad nacional con sede en Lima que compra para La Libertad queda fuera.

### Q2 · ¿Existe `tender.tenderPeriod` con fecha de inicio y de fin? (S02)

**Existe, pero no mide el plazo para presentar ofertas** (`cobertura_de_tenderPeriod`).

- `tender.tenderPeriod.startDate` y `endDate` están en 124 874 procesos (92,6 %), pero en 124 856 (99,99 %) **el inicio y el fin son iguales**, a las 00:00 del mismo día de la convocatoria (120 460 procesos). `durationInDays` solo aparece en 3. Con los dos archivos, el inicio es igual al fin en 241 667 de 241 709 procesos (99,98 %). En La Libertad 2025–2026, ninguno de los 5 036 procesos tiene un `tenderPeriod` con duración (`plazos_en_el_departamento`).
- `tender.enquiryPeriod` (formulación de consultas y observaciones) sí tiene duración real. Está en 84 186 procesos (62,4 %) y en 3 892 de los 5 036 de La Libertad 2025–2026 (77,3 %). Duración p10/p50/p90 en días: 3/5/7 en licitaciones y concursos abreviados; 9/11/16 en licitaciones públicas y concursos de servicios; 2/4/6 en adjudicaciones simplificadas (`plazos_por_metodo_en_los_anios`).
- **Sustituto descartado:** los días entre la convocatoria y la primera acta de evaluación (`evaluationReports`). En licitaciones y concursos abreviados el p10 es 0 días, y en 383 de esos procesos el acta es anterior a la convocatoria, probablemente porque arrastran documentos de convocatorias anteriores (`dias_hasta_la_primera_acta_de_evaluacion`).
- **Conclusión:** S02 no se puede calcular como está definida. Cardinal R003 da el mismo resultado: marca el 99,998 % de los procesos (Q8).
- **Opciones para el equipo:**
  1. Desactivar S02 con el motivo "tenderPeriod sin duración en la fuente" (el manifiesto ya lo admite) y subir S05 al núcleo, como prevé la tabla de riesgos. **Es la opción recomendada.**
  2. Redefinir S02 como "plazo corto de consultas y observaciones" con `enquiryPeriod`. Su variación refleja sobre todo la norma y los fines de semana, y no es el plazo para preparar ofertas.

### Q3 · ¿Hay número de postores o datos de ofertas (`bids`)? (S01 y cobertura de Cardinal)

**No hay `bids`. Hay número y lista de "postores", pero cuentan participantes registrados** (`cobertura_de_postores`).

- `bids` no existe en ningún proceso (`campos_de_primer_nivel`; en Cardinal, `/bids/details[]` = 0).
- `tender.numberOfTenderers` y `tender.tenderers[]` están en 122 894 procesos (91,1 %); en la muestra de La Libertad de `2026.jsonl.gz`, en 2 523 de 2 888 (87,4 %). El número coincide con el largo de la lista en 121 041 (98,5 %), nunca vale 0 y la lista no tiene duplicados. El ganador está en la lista en 113 829 de 114 128 adjudicaciones (99,7 %).
- **Evidencia de que son participantes y no ofertas:**
  - Los procesos con todos sus ítems desiertos tienen una mediana de 5 "postores" (q1 = 3, q3 = 12) y nunca 0 (`postores_en_procesos_desiertos`).
  - En los procesos adjudicados de 2025–2026, la mediana es de 10 en licitaciones abreviadas, 12 en concursos abreviados, 16 en licitaciones públicas, 17 en concursos de servicios y 23 en consultorías (`postores_por_metodo_en_los_anios`).
  - En La Libertad hay procesos desiertos con 81, 74 y 64 "postores" (`casos_para_verificar_en_el_seace`).
- **Verificación pendiente en el SEACE** (tarea 3.4), con los casos de `casos_para_verificar_en_el_seace`:
  - adjudicados con un solo participante: `COMPRE-SM-1-2025-MPSCH/OEC-1`, `LP-ABR-7-2025-UTES N°6 S.P.T.-1`, `LP-ABR-2-2025-HBT-1`, `LP-ABR-4-2025-MDA/CS-1` y `LP-ABR-11-2025-GRLL-GOB/PECH-2`;
  - desiertos con muchos participantes: `LP-SM-2-2026-GRLL-GRA-1` (81), `LP-SM-22-2025-GRLL-GRCO-1` (74), `LP-SM-10-2025-GRLL-GRCO-1` (64), `AS-SM-4-2025-GRELL/CS-01-1` (59) y `LP-SM-18-2025-GRLL-GRCO-1` (59).
- **Efecto en S01:** con `numberOfTenderers = 1`, la señal significa "un solo participante registrado". No da falsos positivos de oferta única, porque un solo participante implica a lo sumo una oferta, pero no ve los procesos con muchos registrados y una sola oferta. Su texto debe decir "participante registrado" hasta que el SEACE confirme otra cosa.
- En La Libertad 2025–2026 hay 35 licitaciones abreviadas, 8 concursos abreviados y 25 subastas inversas con un solo participante (`metodos_en_el_departamento`).

### Q4 · ¿Qué esquema de clasificación usan los ítems? (S04)

**CUBSO como clasificación principal y UNSPSC como clasificación adicional** (`esquemas_de_clasificacion`).

- `tender.items[].classification`: esquema `CUBSO` (Catálogo Único de Bienes, Servicios y Obras), normalmente de 16 dígitos (entre 2 y 18). Está en 144 417 ítems; el 86,4 % de los procesos tiene al menos un ítem clasificado. Hay 22 415 ítems sin clasificación, en 18 883 procesos.
- `tender.items[].additionalClassifications[]`: esquema `UNSPSC`, de 8 dígitos, en los mismos 144 417 ítems. El código CUBSO empieza con el código UNSPSC en el 99,6 % de los casos (`cubso_empieza_con_unspsc`). Los ítems de `awards` y `contracts` tienen la misma estructura de clasificación.
- En La Libertad 2025–2026 hay 4 417 de 5 036 procesos clasificados (87,7 %), con 53 segmentos (2 dígitos), 205 familias (4), 426 clases (6), 648 productos UNSPSC (8) y 1 141 códigos CUBSO (`niveles_de_clasificacion_en_el_departamento`).
- **Efecto en S04:** el "primer nivel del código" (segmento, 2 dígitos) es demasiado amplio; por ejemplo, el segmento 72 junta todos los servicios de construcción y mantenimiento. Se recomienda agrupar por clase (6 dígitos) o familia (4 dígitos) UNSPSC, con el nivel como parámetro en `pipeline/config/senales.toml`.

### Q5 · ¿Cómo viene el método de contratación (`tender.procurementMethodDetails`)? (S05)

**Como el nombre del método en español, en el 100 % de los procesos** (`metodos`).

- Hay 55 nombres distintos en el archivo: métodos del DL 1017 (adjudicación de menor cuantía, adjudicación directa selectiva o pública, exoneración), de la Ley 30225 (adjudicación simplificada, licitación pública, concurso público, comparación de precios, subasta inversa electrónica, contratación directa) y de la Ley 32069 (licitación pública abreviada, concurso público abreviado, concurso público de servicios o para consultoría), además de variantes por leyes especiales ("Homologación", "Ley N° 31589", decretos de urgencia).
- `tender.procurementMethod` (lista de códigos OCDS) es incompleto e inconsistente:
  - es nulo en las licitaciones abreviadas (22 015 de 22 101), los concursos abreviados (19 332 de 19 337) y los concursos de servicios o para consultoría;
  - vale `direct` en contratación directa, adjudicación directa selectiva o pública y exoneración;
  - en la muestra de La Libertad de `2026.jsonl.gz` solo lo tienen 957 de 2 888 procesos (cobertura de Cardinal).
- La Libertad 2025–2026 (`metodos_en_el_departamento` y `categorias_en_el_departamento`):

| Método | Procesos |
|---|---:|
| Licitación Pública Abreviada | 1 533 |
| Concurso Público Abreviado | 1 050 |
| Adjudicación Simplificada | 585 |
| Subasta Inversa Electrónica | 494 |
| Contratación Directa | 377 |
| Licitación Pública | 362 |
| Comparación de Precios | 180 |
| Concurso Público de Servicios | 146 |
| Contratación Internacional | 82 |
| Regímen Especial (así viene escrito en la fuente) | 82 |
| Concurso Público para Consultoría | 67 |
| Otros 8 nombres | 78 |

  Por objeto: 1 920 de servicios, 1 791 de bienes y 1 325 de obras (`tender.mainProcurementCategory`).

- **Efecto en S01, S04 y S05:** qué método es competitivo y cuál es "menos exigente" debe salir de una tabla propia en la configuración, por nombre de `procurementMethodDetails`. Hay que decidir cómo tratar el Régimen Especial (obras por impuestos), la Contratación Internacional y los convenios. S05 es viable: el método está en el 100 % de los procesos y en La Libertad 2025–2026 hay 377 contrataciones directas.

### Q6 · ¿Cuántos contratos tienen culminación con monto final? (S06)

**El 10,3 % de los contratos de `2026.jsonl.gz` y el 9,1 % de los de La Libertad 2025–2026.**

- **Campos:** `contracts[].implementation.finalValue.amount` (monto final) y `contracts[].implementation.endDate` (fecha de término), de la extensión de culminación.
- En todo el archivo hay 104 571 contratos. 10 737 tienen monto final y 6 816, fecha de término. Por año de convocatoria (`culminacion_por_anio_de_convocatoria`), tienen monto final el 24,3 % de los contratos de 2024, el 20,6 % de 2025 y el 3,0 % de 2026 (la mayoría sigue en ejecución).
- La Libertad 2025–2026: 290 de 3 177 contratos (9,1 %), **por debajo del 10 % mínimo** del catálogo (`culminacion_en_el_departamento`). Con la regla actual, S06 se desactiva y se registra en el manifiesto. Solo con `2026.jsonl.gz` daba 11,7 % (201 de 1 719), porque los contratos cuya culminación se registró en 2026 quedaron en ese archivo.
- **Razón entre el monto final y el contratado** (10 572 contratos en soles, `monto_final_frente_al_contratado`): p10 0,92; p25 1,02; mediana 1,11; p75 1,25; p90 1,34. El 80,9 % termina por encima de lo contratado. Con el factor 1,15 del catálogo se marcaría entre el 25 % y el 50 % de los contratos con monto final, así que hay que calibrar el umbral antes de usarlo (por ejemplo, con la valla de Tukey por tipo de objeto).

### Q7 · ¿Cuántos procesos de La Libertad hay en 2025 y 2026?

**2025: 2 944 procesos. 2026: 2 092 (completo hasta el corte). En total, 5 036** (`departamento_por_anio_de_convocatoria`, con los dos archivos).

| Año de convocatoria | Procesos | Entidades | Con adjudicación | Con contrato | Valor referencial (millones de soles) |
|---|---:|---:|---:|---:|---:|
| 2025 | 2 944 | 119 | 2 191 | 1 982 | 4 610,8 |
| 2026 (1 de enero – 2 de octubre) | 2 092 | 125 | 1 332 | 982 | 2 699,8 |

- Los procesos de 2025 están repartidos: 2 148 en `2025.jsonl.gz` y 796 en `2026.jsonl.gz` (`departamento_por_archivo_y_anio`). Con un solo archivo se habría perdido casi tres cuartos de 2025.
- De los 5 036 procesos, 4 671 tienen valor referencial mayor que cero, 8 están en otra moneda y todos tienen `amount_PEN` (`montos_en_el_departamento`).
- Las adjudicaciones de 2025–2026 tienen fecha en 108 427 de 108 430 casos (`awards[].date`; `fechas_de_adjudicacion`, nacional), lo que sirve para la ventana de 12 meses de S03.
- **Tamaño de la demo:** unos 5 000 procesos. Es un tamaño cómodo para un paquete estático por entidad.

### Q8 · ¿Qué devuelven `ocdscardinal coverage` y `ocdscardinal prepare` sobre una muestra?

**Muestra:** los 2 888 procesos de La Libertad 2025–2026 que están en `2026.jsonl.gz`, copiados sin cambios con `uv run pipeline sample`.

**Instalación:**

- El paquete de Python `ocdscardinal` 0.0.9, que se instala con uv, **solo expone `coverage`**. `prepare` e `indicators` existen únicamente en la herramienta de línea de comandos. El paso 5 del diseño ("se instala `ocdscardinal` con uv y se ejecutan `prepare`, `coverage` e `indicators`") hay que ajustarlo.
- La herramienta no está en crates.io. El binario de Windows de la release 0.0.9 se cerró al arrancar en nuestra prueba (código `0xC0000005`, incluso con `--version`).
- La compilamos desde el código oficial (etiqueta 0.0.9) con `cargo install`, en 1 min 40 s, y funciona. El comando está en `CONTRIBUTING.md`.

**`coverage`** (`uv run pipeline coverage`): cuántas veces aparece cada campo con un valor no vacío.

| Ruta | Conteo |
|---|---:|
| Procesos | 2 888 |
| `/buyer/id` y `/parties[]/address/department` | 2 888 |
| `/tender/tenderPeriod/startDate` y `endDate` | 2 694 |
| `/tender/enquiryPeriod/endDate` | 2 296 |
| `/tender/numberOfTenderers` | 2 523 |
| `/tender/tenderers[]/id` | 28 159 |
| `/bids/details[]` | **0** |
| `/tender/procurementMethod` | 957 |
| `/tender/procurementMethodDetails` | 2 888 |
| `/tender/items[]/classification/id` | 2 777 ítems |
| `/awards[]/suppliers[]/id` y `/awards[]/value/amount` | 2 104 |
| `/contracts[]/value/amount` | 1 719 |
| `/contracts[]/implementation/finalValue/amount` | 201 |
| `/contracts[]/status` | **0** |

**`prepare`:**

- Con la configuración por defecto de `ocdscardinal init` encontró 2 104 problemas en 2 012 procesos, **todos `/awards[]/status` "not set"**: la fuente no publica el estado de las adjudicaciones.
- Con `award_status = active` en `[defaults]`, encontró 0 problemas en la muestra y en el archivo nacional.

**`indicators`** (configuración de `init` más `award_status = active`):

| Indicador | ¿Se puede calcular? | Resultado |
|---|---|---|
| R003 · Plazo corto de presentación | Se ejecuta, pero no sirve | Marca 2 694 de 2 694 procesos de la muestra y 124 872 de 124 874 a nivel nacional, porque `tenderPeriod` siempre dura 0 días |
| R018 · Oferta única | **Sí**, con el límite de Q3 | 57 procesos en la muestra, los mismos que da nuestra consulta con la misma regla (`procurementMethod` open o selective y `numberOfTenderers = 1`). No ve 36 procesos con un solo participante porque sus licitaciones y concursos abreviados no traen `procurementMethod`. A nivel nacional: 12 551 |
| R048 · Proveedor heterogéneo | **Sí**, con 20 o más procesos por proveedor | Ninguno en la muestra (pocos proveedores llegan a 20 procesos). A nivel nacional marca 14 proveedores (q1 = 1, q3 = 4, valla superior = 8,5 segmentos) |
| R024, R025, R028, R030, R035, R036, R038 y R058 | No | Necesitan `bids` |

Para el contraste de la tarea 4.4 hay que completar `tender.procurementMethod` desde nuestra tabla de métodos antes de ejecutar Cardinal, para que R018 vea los métodos de la Ley 32069. El contraste de R003 se informa como "no fue posible".

### Impacto en el contrato del paquete de datos (tarea 1.6)

Ningún hallazgo **obliga** a cambiar el JSON Schema: los campos afectados ya admiten `null` y el manifiesto ya admite señales desactivadas con su motivo. Sí cambia el significado de algunos campos. Hay que acordarlo con el Lote B (Joaquín) y con el Lote C (Sebastián), que escribe los textos.

| Campo del contrato | Lo que mostró el spike | Propuesta | ¿Cambia el schema? |
|---|---|---|---|
| `procesos[].numero_postores` | Cuenta participantes registrados, no ofertas | Mantener el nombre en v1 y documentar el significado; los textos dicen "participantes registrados". Alternativa: renombrarlo a `numero_participantes` | No (sí, si se renombra) |
| `procesos[].fechas.inicio_presentacion` y `fin_presentacion` | `tenderPeriod` solo trae la fecha de la convocatoria | Exportarlos como `null`. Si se elige la opción 2 de Q2, agregar `fechas.inicio_consultas` y `fin_consultas` | No (sí, con la opción 2) |
| `procesos[].url_seace` | No hay URL por proceso | `null`, o la página del buscador público. **Se recomienda agregar `nomenclatura`** (`tender.title`), con la que se busca el proceso en el SEACE | Sí, si se agrega `nomenclatura` |
| `procesos[].estado` | No hay `tender.status` | Derivarlo de `tender.items[].statusDetails` | No |
| `proveedores[].tipo` y `ruc` | El 23,3 % de los proveedores adjudicados tiene un código que no es RUC (consorcios) | `tipo: "desconocido"` y `ruc: null`. Opcional: agregar el tipo `consorcio` | No (sí, con `consorcio`) |
| `manifest.senales_activas` y `senales_desactivadas` | S02 no se puede calcular y S06 queda bajo el mínimo de cobertura | S02 y S06 desactivadas con su motivo; S05 al núcleo | No |
| `manifest.fuente.archivos` | 2025 está repartido entre dos archivos | `["2025.jsonl.gz", "2026.jsonl.gz"]` | No |

## Atribución obligatoria

Texto sugerido para el pie de la aplicación, la ficha técnica y el pitch:

> Datos: OECE – Contrataciones Abiertas (SEACE), vía OCP Data Registry, licencia CC BY 4.0. Datos filtrados y transformados por el equipo para calcular señales de revisión.
