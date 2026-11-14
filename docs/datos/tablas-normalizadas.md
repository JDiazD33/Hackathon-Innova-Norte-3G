# Tablas normalizadas

Las genera el pipeline del Lote A con `uv run pipeline normalize` (desde `pipeline/`) a partir de lo que dejó `uv run pipeline ingest`. Van a `data/derived/tablas/` en Parquet, junto con `manifiesto.json`, y **no se suben**: tienen nombres y RUC de proveedores. El paquete público que lee la web sale después de ellas, seudonimizado.

**Alcance:** los procesos cuyo comprador está en el departamento configurado y cuya convocatoria es de los años configurados (`pipeline/config/pipeline.toml`; por defecto, La Libertad 2025–2026). Todas las tablas se vinculan por `ocid` y conservan los identificadores OCDS tal cual (ADR 0006). Las fechas son días en hora de Lima.

## `procesos`

Una fila por proceso.

| Columna | Campo OCDS |
|---|---|
| `ocid` | `ocid` |
| `entidad_id` | `buyer.id` |
| `nomenclatura` | `tender.title` (con ella se busca el proceso en el SEACE) |
| `descripcion` | `tender.description` |
| `metodo` | `tender.procurementMethodDetails` |
| `metodo_ocds` | `tender.procurementMethod` (falta en los métodos de la Ley 32069) |
| `categoria` | `tender.mainProcurementCategory` (`goods`, `services` o `works`) |
| `moneda`, `monto_referencial` | `tender.value.currency`, `tender.value.amount` |
| `monto_referencial_pen` | `tender.value.amount_PEN` (convertido por la fuente) |
| `fecha_convocatoria`, `anio_convocatoria` | `tender.datePublished` |
| `fecha_inicio_presentacion`, `fecha_fin_presentacion` | `tender.tenderPeriod.startDate` y `endDate` (en la fuente coinciden con la convocatoria) |
| `fecha_inicio_consultas`, `fecha_fin_consultas` | `tender.enquiryPeriod.startDate` y `endDate` |
| `numero_postores` | `tender.numberOfTenderers` (participantes registrados, según el spike) |
| `estado` | Valores distintos de `tender.items[].statusDetails`, ordenados y separados por comas (no existe `tender.status`) |
| `departamento`, `provincia`, `distrito` | `address.department`, `address.region` y `address.locality` de la entrada de `parties` cuyo `id` es `buyer.id` |
| `archivo` | Archivo anual de donde salió el proceso |
| `fecha_actualizacion` | `date` del release compilado |

## `entidades`

Una fila por comprador.

| Columna | Campo OCDS |
|---|---|
| `entidad_id` | `buyer.id` |
| `nombre` | `buyer.name` |
| `ruc` | `parties[].additionalIdentifiers[]` con esquema `PE-RUC`, en la entrada del comprador |
| `departamento`, `provincia`, `distrito` | Dirección del comprador en `parties` |
| `procesos` | Número de procesos de la entidad en el alcance |

## `postores`

Una fila por proceso y participante, sin duplicados.

| Columna | Campo OCDS |
|---|---|
| `ocid` | `ocid` |
| `proveedor_id` | `tender.tenderers[].id` |

## `adjudicaciones`

Una fila por adjudicación y proveedor. Un proceso con dos adjudicaciones tiene dos filas con el mismo `ocid`.

| Columna | Campo OCDS |
|---|---|
| `ocid` | `ocid` |
| `adjudicacion_id` | `awards[].id` |
| `proveedor_id` | `awards[].suppliers[].id` (vacío si la adjudicación no trae proveedor) |
| `fecha_adjudicacion` | `awards[].date` |
| `monto`, `moneda` | `awards[].value.amount`, `awards[].value.currency` |
| `tiene_contrato` | Verdadero si algún `contracts[].awardID` es igual a `awards[].id` |

## `contratos`

Una fila por contrato.

| Columna | Campo OCDS |
|---|---|
| `ocid` | `ocid` |
| `contrato_id` | `contracts[].id` |
| `adjudicacion_id` | `contracts[].awardID` |
| `adjudicacion_vinculada` | Verdadero si `contracts[].awardID` coincide con algún `awards[].id` |
| `estado` | `contracts[].status`, o "sin estado" si falta |
| `estado_detalle` | `contracts[].statusDetails` |
| `fecha_firma` | `contracts[].dateSigned` |
| `monto`, `moneda` | `contracts[].value.amount`, `contracts[].value.currency` |
| `monto_final`, `moneda_monto_final` | `contracts[].implementation.finalValue` (extensión de culminación) |
| `fecha_culminacion` | `contracts[].implementation.endDate` |

## `proveedores`

Una fila por participante o proveedor adjudicado.

| Columna | Campo OCDS |
|---|---|
| `proveedor_id` | `tender.tenderers[].id` y `awards[].suppliers[].id` |
| `ruc` | Los 11 dígitos, solo si el identificador es `PE-RUC-` seguido de 11 dígitos |
| `nombre` | El `name` más reciente con que aparece |
| `tipo` | `persona_natural` o `persona_juridica` según los dos primeros dígitos del RUC (`[proveedores]` de la configuración); `desconocido` si no hay RUC. En La Libertad 2025–2026 son `desconocido` 3 495 proveedores con código corto de 7 dígitos, que son consorcios (3 395 llevan "CONSORCIO" en el nombre), 80 proveedores extranjeros con código "L" y 10 dígitos (79 son personas) y 7 empresas extranjeras con código de 11 dígitos que empieza con 99 |

## `items`

Una fila por ítem de la convocatoria.

| Columna | Campo OCDS |
|---|---|
| `ocid` | `ocid` |
| `item_id` | `tender.items[].id` |
| `descripcion`, `cantidad`, `unidad` | `description`, `quantity`, `unit.name` |
| `estado`, `estado_detalle` | `status`, `statusDetails` |
| `cubso` | `classification.id` cuando el esquema es `CUBSO` |
| `unspsc` | `additionalClassifications[].id` con esquema `UNSPSC` |
| `monto`, `moneda` | `totalValue.amount`, `totalValue.currency` |

## `documentos`

Una fila por documento de la convocatoria o de un contrato.

| Columna | Campo OCDS |
|---|---|
| `ocid` | `ocid` |
| `seccion` | `tender` o `contracts` |
| `contrato_id` | `contracts[].id` (solo en los documentos de contratos) |
| `documento_id` | `documents[].id` |
| `tipo` | `documents[].documentType`, o "sin tipo" si falta |
| `titulo`, `url`, `fecha_publicacion`, `formato` | `title`, `url`, `datePublished`, `format` |

## `procesos_nacionales`

Una fila por proceso de **todo el país** convocado en los años configurados, con pocas columnas. Las señales la usan como grupo de comparación nacional cuando el grupo regional tiene menos de `minimo_grupo` casos.

| Columna | Campo OCDS |
|---|---|
| `ocid`, `entidad_id`, `departamento`, `anio_convocatoria` | Como en `procesos` (`departamento` puede ser vacío) |
| `entidad_nombre` | `buyer.name` o, si falta, el nombre de la parte compradora. S05 lo usa para saber el tipo de entidad (2 911 entidades en 2025–2026) |
| `metodo`, `categoria`, `numero_postores`, `estado` | Como en `procesos` |
| `fecha_convocatoria`, `fecha_inicio_presentacion`, `fecha_fin_presentacion`, `fecha_inicio_consultas`, `fecha_fin_consultas` | Como en `procesos` |
| `monto_referencial_pen` | `tender.value.amount_PEN` |
| `archivo` | Archivo anual de donde salió el proceso |

## Exclusiones y correcciones

Ningún problema de calidad descarta un proceso completo. El manifiesto cuenta cada caso.

| En el manifiesto | Qué pasa | La Libertad 2025–2026 |
|---|---|---:|
| Exclusión "región indeterminada" | El comprador no tiene entrada en `parties` o no trae `department`: el proceso queda fuera | 0 |
| Exclusión "año de convocatoria indeterminado" | Falta `tender.datePublished` | 0 |
| Corrección "proceso repetido entre archivos" | Se conserva la versión con el `date` más reciente | 0 |
| Corrección "postor duplicado" | El participante se registra una sola vez en `postores` | 0 |
| Corrección "contrato sin estado" | `estado` = "sin estado" | 3 177 |
| Corrección "adjudicación sin contrato" | Se conserva con `tiene_contrato` = falso | 639 |
| Corrección "contrato sin adjudicación vinculada" | Se conserva con `adjudicacion_vinculada` = falso | 0 |
| Corrección "adjudicación sin proveedor" | Se conserva con `proveedor_id` vacío | 2 |
| Corrección "documento sin tipo" | `tipo` = "sin tipo" | 538 |

## Manifiesto de la ejecución

`data/derived/tablas/manifiesto.json` trae:

- la versión del pipeline y la de las reglas (`version_reglas` de la configuración);
- la fuente con su licencia y su atribución;
- cada archivo con su URL, fecha de descarga, tamaño, SHA-256 y fecha de última modificación;
- la fecha de corte (la última modificación más reciente), la región y los años;
- los procesos leídos por archivo, los conteos por tabla, y las exclusiones y correcciones por motivo.

Una prueba automática comprueba que los conteos coinciden con las filas de cada tabla.

Ejecución del 13 de noviembre de 2026 con `2025.jsonl.gz` y `2026.jsonl.gz`:

| Tabla | Filas |
|---|---:|
| `procesos` | 5 036 |
| `entidades` | 127 |
| `postores` | 51 424 |
| `adjudicaciones` | 3 679 |
| `contratos` | 3 177 |
| `proveedores` | 11 945 |
| `items` | 5 537 |
| `documentos` | 31 055 |
| `procesos_nacionales` | 136 961 |
