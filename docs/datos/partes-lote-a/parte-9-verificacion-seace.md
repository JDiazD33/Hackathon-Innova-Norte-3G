# Parte 9 · Verificación en el SEACE (tareas 3.4 y 4.5)

**Rama:** `lote-a/parte-9-verificacion-seace`, desde la parte 8 (PR #26) mientras esa no esté en `main`. **PR:** hacia `main`, solo de documentos.

**Encargo:** [`docs/plan/fase-1/lote-a-stefano.md`](../../plan/fase-1/lote-a-stefano.md), sección 4. **Fechas:** miércoles 18 a viernes 20.

## Objetivo

Comprobar a mano, contra el buscador público del SEACE, que las señales que mostramos dicen lo que creemos, y ajustar las reglas con lo que salga.

## Tareas

- [ ] 3.4 Verificar a mano 5 resultados reales de S01 y 5 de S02 contra el SEACE y anotar la verificación en el PR. *S02 está desactivada (decisión 3 de la parte 8), así que solo se verifica S01.*
- [ ] 4.5 Verificar a mano 5 resultados de S03 y 5 de S04 y actualizar `docs/datos/catalogo-de-senales.md` con las reglas finales. *S04 sigue desactivada: sus 5 casos salen de la estimación con los umbrales oficiales.*

## Cómo verificar

1. Busca cada caso por su **nomenclatura** en el buscador público del SEACE. Es una consulta manual: sin scraping ni automatización.
2. Compara con lo que dice Prisma (la tabla del caso) y anota en la tabla de resultados si coincide, qué no coincide y por qué.
3. **Privacidad:** el repositorio es público, así que en esta ficha y en el PR los proveedores van solo con su seudónimo (`P0516`). Si necesitas saber quién es, míralo en el paquete local (`web/data/local/proveedores.json`, que no se sube) o compara el ganador entre los procesos del caso.

Los casos salen del paquete público de la parte 8 (reglas `2026.11.2`, datos al 4 de octubre de 2026). Para cada señal se tomaron los casos más grandes, de métodos y entidades distintos.

## S01 · Un solo participante registrado (tarea 3.4)

| N.° | Nomenclatura | Entidad | Método | Monto referencial | Estado | Ganador |
|---|---|---|---|---:|---|---|
| S01-1 | `CP SER-SM-1-2026-IREN NORTE-1` | GOBIERNO REGIONAL DE LA LIBERTAD - INST.REG.DE ENFERMEDADES… | Concurso Público de Servicios | S/ 11 102 352 | CONSENTIDO | P0957 |
| S01-2 | `LP-ABR-1-2026-MDEP/OC-BIENES-2` | MUNICIPALIDAD DISTRITAL DE EL PORVENIR - TRUJILLO | Licitación Pública Abreviada | S/ 1 653 248 | CONTRATADO, DESIERTO | P1178 |
| S01-3 | `CP-ABR-11-2026-UTES N°6 S.P.T.-1` | GOBIERNO REGIONAL DE LA LIBERTAD-SALUD UTES TRUJILLO ESTE | Concurso Público Abreviado | S/ 1 018 197 | CONSENTIDO | P2468 |
| S01-4 | `COMPRE-SM-1-2025-MPSCH/OEC-1` | MUNICIPALIDAD PROVINCIAL DE SANTIAGO DE CHUCO | Comparación de Precios | S/ 70 626 | CONTRATADO | P2070 |
| S01-5 | `AS-SM-1-2025-MDO/OEC-1` | MUNICIPALIDAD DISTRITAL DE ONGON | Adjudicación Simplificada | S/ 63 622 | NULO | P0577 |

Ocids: S01-1: `ocds-dgv273-seacev3-1211219`; S01-2: `ocds-dgv273-seacev3-2026-1192-2`; S01-3: `ocds-dgv273-seacev3-1247001`; S01-4: `ocds-dgv273-seacev3-1108594`; S01-5: `ocds-dgv273-seacev3-2025-1238-1`

**Qué verificar:** cuántos participantes registrados tuvo (Prisma dice 1), cuántas ofertas se presentaron, si se adjudicó a ese participante y en qué estado quedó. S01-5 figura como `NULO` pero tiene adjudicación: confirma qué pasó.

| N.° | ¿Coincide? (sí, no o en parte) | Qué no coincide | Por qué |
|---|---|---|---|
| S01-1 |  |  |  |
| S01-2 |  |  |  |
| S01-3 |  |  |  |
| S01-4 |  |  |  |
| S01-5 |  |  |  |

## S03 · Proveedor recurrente atípico en una entidad (tarea 4.5)

| N.° | Entidad | Proveedor | Participación | Procesos ganados | Tres procesos para abrir |
|---|---|---|---:|---:|---|
| S03-1 | GOBIERNO REGIONAL DE LA LIBERTAD-INSTITUTO REGIONAL DE OFTA… | P0516 | 46.3% del monto | 13 de 36 | `DIRECTA-DIRECTA-12-2025-IRO-1`; `DIRECTA-DIRECTA-1-2026-IRO-1`; `DIRECTA-DIRECTA-2-2026-IRO-1` |
| S03-2 | MUNICIPALIDAD DISTRITAL DE CONDORMARCA | P0365 | 37.5% de los procesos | 3 de 8 | `LP-ABR-2-2025-MDC/DEC-1`; `LP-ABR-2-2025-MDC/DEC-1`; `LP-ABR-2-2025-MDC/DEC-1` |
| S03-3 | GOBIERNO REGIONAL DE LA LIBERTAD-SALUD UTES OTUZCO | P0297 | 37.4% del monto | 3 de 10 | `CP-ABR-1-2025-CS-RIS OTUZCO-1`; `CP-ABR-3-2026-RIS OTUZCO/CS-1`; `CP-ABR-5-2026-RIS OTUZCO/CS-1` |
| S03-4 | MUNICIPALIDAD PROVINCIAL DE PACASMAYO - SAN PEDRO DE LLOC | P1657 | 25.0% de los procesos | 3 de 12 | `SIE-SIE-4-2025-MPP-SPLL/CS-1`; `SIE-SIE-5-2025-MPP/CS-1`; `SIE-SIE-6-2025-MPP/CS-1` |
| S03-5 | MUNICIPALIDAD PROVINCIAL DE CHEPEN | P0240 | 24.4% del monto | 3 de 19 | `SIE-SIE-4-2025-MPCH-1`; `SIE-SIE-5-2025-MPCH-2`; `DIRECTA-DIRECTA-1-2026-MPCH/DEC-1` |

**Qué verificar:** que el mismo proveedor ganó esos procesos en la entidad, y cuántos procesos adjudicó la entidad en la ventana (del 5 de octubre de 2025 al 4 de octubre de 2026). En S03-2 los tres procesos tienen la misma nomenclatura y el mismo monto: dos están en estado NULO y uno CONTRATADO. Confirma si son versiones de un mismo procedimiento ([ver abajo](#versiones-de-un-mismo-procedimiento)).

| N.° | ¿Coincide? (sí, no o en parte) | Qué no coincide | Por qué |
|---|---|---|---|
| S03-1 |  |  |  |
| S03-2 |  |  |  |
| S03-3 |  |  |  |
| S03-4 |  |  |  |
| S03-5 |  |  |  |

## S04 · Compras similares cercanas en el tiempo (tarea 4.5)

| N.° | Entidad | Método y objeto | Clase UNSPSC | Procesos y fechas | Suma | Umbral |
|---|---|---|---|---|---:|---:|
| S04-1 | EMPRESA REGIONAL DE SERVICIO PUBLICO DE ELECTRICI… | Adjudicación Simplificada, servicios (2025) | 831115 | `AS-SM-106-2024-HDNA-2` (2025-02-18); `AS-SM-106-2024-HDNA-2` (2025-02-18) | S/ 56 573 937 | S/ 485 000 |
| S04-2 | GOBIERNO REGIONAL DE LA LIBERTAD - PROYECTO ESPEC… | Concurso Público Abreviado, servicios (2026) | 921015 | `CP-ABR-1-2026-PECH-1` (2026-04-06); `CP-ABR-1-2026-PECH-1` (2026-04-06) | S/ 13 110 021 | S/ 485 000 |
| S04-3 | GOBIERNO REGIONAL DE LA LIBERTAD Sede Central | Adjudicación Simplificada, obras (2025) | 721214 | `AS-SM-15-2025-GRLL-GRCO-1` (2025-06-18); `AS-SM-13-2025-GRLL-GRCO-1` (2025-06-18); `AS-SM-13-2025-GRLL-GRCO-1` (2025-06-18); `AS-SM-14-2025-GRLL-GRCO-1` (2025-06-19); `AS-SM-16-2025-GRLL-GRCO-1` (2025-06-20); `AS-SM-20-2025-GRLL-GRCO-1` (2025-06-20); `AS-SM-17-2025-GRLL-GRCO-2` (2025-06-20); `AS-SM-18-2025-GRLL-GRCO-1` (2025-06-23); `AS-SM-21-2025-GRLL-GRCO-1` (2025-06-23); `AS-SM-19-2025-GRLL-GRCO-1` (2025-06-23) | S/ 122 811 337 | S/ 5 000 000 |
| S04-4 | GOBIERNO REGIONAL DE LA LIBERTAD Sede Central | Licitación Pública Abreviada, obras (2026) | 721411 | `LP-ABR-1-2026-GRLL - GRCO-1` (2026-02-06); `LP-ABR-1-2026-GRLL - GRCO-1` (2026-02-06); `LP-ABR-1-2026-GRLL - GRCO-2` (2026-03-26) | S/ 114 876 881 | S/ 5 000 000 |
| S04-5 | MUNICIPALIDAD PROVINCIAL DE TRUJILLO | Adjudicación Simplificada, bienes (2025) | 151015 | `AS-SM-19-2025-MPT/OEC-1` (2025-04-25); `AS-SM-20-2025-MPT/OEC-1` (2025-05-05); `AS-SM-19-2025-MPT/OEC-2` (2025-05-14) | S/ 3 597 335 | S/ 485 000 |

**Qué verificar:** si son compras comparables de la misma necesidad, si son ítems o reconvocatorias de un mismo procedimiento (misma nomenclatura, o la misma con `-1` y `-2`), si cada proceso ya supera el umbral por sí solo, y si la necesidad era previsible. En S04-1 y S04-2 los dos `ocid` son versiones de un mismo procedimiento: uno NULO y el otro vigente (CONSENTIDO o CONTRATADO). S04-3 y S04-4 también repiten una nomenclatura.

| N.° | ¿Coincide? (sí, no o en parte) | Qué no coincide | Por qué |
|---|---|---|---|
| S04-1 |  |  |  |
| S04-2 |  |  |  |
| S04-3 |  |  |  |
| S04-4 |  |  |  |
| S04-5 |  |  |  |

## Hallazgos al elegir los casos

- **Nomenclaturas repetidas:** 540 nomenclaturas aparecen en más de un `ocid` (1 333 procesos). Si se quita el número final de convocatoria, son 878 (2 209 procesos). La mayoría son versiones de un mismo procedimiento y otras son de entidades distintas con las mismas siglas ([ver abajo](#versiones-de-un-mismo-procedimiento)). Afectan los conteos de S03 y S05 y los grupos de S04.
- **Grupos de S04:** de los 286 de la estimación:
  - 43 tienen un proceso que ya supera el umbral por sí solo, así que no es una división para quedar por debajo;
  - 100 repiten una nomenclatura;
  - 90 son de una sola convocatoria.
  - Si se exige que cada proceso esté bajo el umbral y que haya al menos dos procedimientos distintos, quedarían 162 grupos.
- **Propuesta para decidir con la verificación:**
  - no evaluar las versiones anteriores de un procedimiento (ver abajo);
  - S04 cuenta procedimientos (la nomenclatura sin el número de convocatoria), no `ocid`, y solo procesos bajo el umbral;
  - S03 también cuenta procedimientos.

### Versiones de un mismo procedimiento

Análisis del 15 de noviembre, con las tablas de la parte 10 (5 036 procesos).

- **Entre entidades:** 134 de las 540 nomenclaturas repetidas son de entidades distintas que usan las mismas siglas. Son procedimientos distintos, así que cualquier agrupación va por entidad y nomenclatura.
- **En una misma entidad:** 475 nomenclaturas tienen más de un `ocid` (1 055 procesos).
  - 325 comparten la fecha de convocatoria (704 procesos): 313 con la misma descripción y 217 con el mismo monto.
  - 150 tienen fechas distintas (351 procesos).
  - En 463 de las 475 los `ocid` tienen estados distintos, y 337 incluyen uno en estado NULO o RETROTRAIDO_POR_RESOLUCION.
- **Lectura, por confirmar en el SEACE:** no parecen ítems, porque un mismo `ocid` ya agrupa sus ítems (hay estados combinados, como "CONTRATADO, DESIERTO"). Parecen versiones: cuando un procedimiento se declara nulo o se retrotrae por resolución, la fuente lo vuelve a publicar con otro `ocid` y la misma nomenclatura, y solo la última versión tiene el estado vigente. Por ejemplo:
  - `CP-ABR-3-2025-MDM/ C-1`, de la Municipalidad Distrital de Marcabal: cuatro `ocid` con el mismo monto, tres en estado NULO (convocados el 19 de septiembre, el 9 de octubre y el 26 de noviembre de 2025) y el último CONTRATADO;
  - `LP-SM-5-2025-MPT-1`, de la Municipalidad Provincial de Trujillo: cuatro `ocid` del 9 de mayo de 2025, uno DESIERTO y NULO, dos RETROTRAIDO_POR_RESOLUCION y el último CONTRATADO. El monto baja de S/ 1 465 413 a S/ 1 171 707 cuando queda un solo ítem;
  - `LP-SM-1-2026-IRO/COMITE-1`, del Instituto Regional de Oftalmología: un `ocid` CONVOCADO sin monto y otro CONSENTIDO con S/ 668 000. En la pantalla de revisión del PR #29 aparecen como dos opciones con el mismo texto.
- **Hoy:** solo se excluye el estado CANCELADO (`comun.estados_excluidos`), así que cada versión se evalúa como un proceso aparte. En el paquete público, 4 señales S03 y 5 señales S05 incluyen versiones anteriores, y 5 procesos de la bandeja son versiones anteriores que heredan la señal S03. S01 no tiene duplicados: sus 33 señales son 33 procedimientos distintos.
- **Efecto medido:** se recalcularon las señales sobre una copia de las tablas, sin tocar el paquete, con S04 activada para contar sus grupos. Las versiones anteriores son 331 procesos (258 NULO y 73 RETROTRAIDO_POR_RESOLUCION) que tienen otro `ocid` posterior de la misma entidad y nomenclatura.

| Señal | Hoy | Sin las versiones anteriores | Sin los estados NULO ni RETROTRAIDO_POR_RESOLUCION |
|---|---:|---:|---:|
| S01 | 33 | 33 | 32 |
| S03 | 30 | 28 | 28 |
| S05 | 7 | 5 | 4 |
| S04 (desactivada) | 286 grupos (841 procesos) | 241 grupos (704 procesos) | 224 grupos (662 procesos) |

- **Propuesta:** no evaluar las versiones anteriores. Un proceso NULO o RETROTRAIDO_POR_RESOLUCION con un `ocid` posterior de la misma entidad y nomenclatura se cuenta como excluido, con el motivo "versión anterior del mismo procedimiento". Iría como parámetro en `pipeline/config/senales.toml`, con su lista de estados, y después se vuelve a generar el paquete. Es la columna del medio; la última también deja fuera los procesos nulos que no se volvieron a publicar.
- **Lo que no cubre:** 249 `ocid` que tampoco son la última versión, pero están en otro estado: 137 CONVOCADO (123 con la misma fecha que la última, como el de `LP-SM-1-2026-IRO/COMITE-1`), 73 CONTRATADO y 39 en otros estados. Los CONVOCADO parecen copias que la fuente no actualizó, y los CONTRATADO pueden ser ítems o procedimientos distintos: conviene mirar algunos en la verificación. Mientras tanto, ayuda que la web muestre la nomenclatura y el estado en los selectores.
- **Qué confirmar en el SEACE:** que `CP-ABR-3-2025-MDM/ C-1` y `LP-SM-5-2025-MPT-1` son un solo procedimiento con nulidades o retrotracciones en su historial, y no procedimientos distintos.

## Al terminar

- Anotar los resultados en las tablas de esta ficha y en el PR.
- Actualizar el catálogo con las reglas finales (4.5) y, si la verificación lo confirma, proponer el ajuste de S03 y S04.
- Si se confirman las versiones, implementar la exclusión de las versiones anteriores, volver a generar el paquete y repetir las huellas.
- Marcar 3.4 y 4.5 en `tasks.md`.

## Archivos

Esta ficha y su fila en el índice `docs/datos/partes-lote-a/README.md`.
