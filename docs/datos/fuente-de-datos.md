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

## Límites que hay que decir en voz alta

- **Contratos sin procedimiento de selección:** no están, incluidos los menores a 8 UIT y otros umbrales. Esto limita la detección de fraccionamiento por debajo de ese monto.
- **Pagos, hitos y modificaciones contractuales:** no están. Con esta fuente no se pueden medir ampliaciones de plazo ni prestaciones adicionales; solo se puede comparar el monto contratado con el final cuando existe la culminación del contrato.
- **Responsables internos:** no está quién solicitó, evaluó o dio conformidad. Para el flujo de trazabilidad interna del desafío 2 usamos datos sintéticos, como permiten las bases.

## Calidad de los datos

Problemas señalados por el registro (revisión de diciembre de 2023):

- Identificadores duplicados en postores y partes.
- Contratos sin estado.
- Códigos de `documentType` que no están documentados.
- Adjudicaciones sin contrato vinculado, y viceversa.

Cada señal debe manejar estos casos e indicar cuándo excluyó un proceso por la calidad de los datos.

## Cómo obtener los datos

- **Descarga:** desde el OCP Data Registry, sin credenciales. Primero un solo año (2026 o 2025) para el spike.
- **Lo que no hacemos:** usar la API del portal del OECE sin credenciales oficiales ni hacer scraping del SEACE. FUNES sufrió bloqueos por obtener datos así.
- **Dónde se guardan:** los archivos van a `data/raw/` y nunca se suben al repositorio.

## Spike de datos (primer paso del Lote A)

Antes de construir las señales, hay que responder con evidencia:

1. ¿Cómo se identifica el departamento (La Libertad) de cada proceso? ¿Por el comprador, por el lugar de entrega o por la extensión de departamento?
2. ¿Existe `tender.tenderPeriod` con fecha de inicio y de fin? (S02)
3. ¿Hay número de postores (`tender.numberOfTenderers` o `tender.tenderers`) o datos de ofertas (`bids`)? (S01 y cobertura de Cardinal)
4. ¿Qué esquema de clasificación usan los ítems (CUBSO, UNSPSC u otro)? (S04)
5. ¿Cómo viene el método de contratación (`tender.procurementMethodDetails`)? (S05)
6. ¿Cuántos contratos tienen culminación con monto final? (S06)
7. ¿Cuántos procesos de La Libertad hay en 2025 y 2026? Esto define el tamaño del conjunto de la demo.
8. ¿Qué devuelven `ocdscardinal coverage` y `ocdscardinal prepare` sobre una muestra?

Las respuestas se anotan en este documento y en el catálogo de señales.

## Atribución obligatoria

Texto sugerido para el pie de la aplicación, la ficha técnica y el pitch:

> Datos: OECE – Contrataciones Abiertas (SEACE), vía OCP Data Registry, licencia CC BY 4.0. Datos filtrados y transformados por el equipo para calcular señales de revisión.
