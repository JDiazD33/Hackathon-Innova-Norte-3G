# Design

## Context

Proyecto nuevo: aún no existe `pipeline/`. La fuente, sus límites y sus problemas de calidad están en `docs/datos/fuente-de-datos.md`, y las reglas de las señales en `docs/datos/catalogo-de-senales.md`. Cada año de datos pesa unos 150 MB comprimido y todo debe correr en una laptop. El paquete que se exporta debe cumplir `docs/arquitectura/contrato-paquete-de-datos.md`, porque los lotes B, C y D dependen de él. La motivación está en `proposal.md`.

## Goals / Non-Goals

**Goals:**

- Pasos independientes y reejecutables: `ingest`, `normalize`, `cardinal`, `signals`, `priority` y `export`.
- Que cada señal se pueda leer como una consulta SQL y explicar desde sus entradas.
- Resultados idénticos con los mismos datos, la misma configuración y el mismo secreto.

**Non-Goals:**

- Actualización automática mensual (fase 2 de la ruta de escalamiento).
- Fuentes adicionales: sanciones (S07), INFOBRAS o registros internos reales.
- Un servidor o una API: el pipeline solo escribe archivos.

## Decisions

1. **Pasos con archivos intermedios, no un solo script.** Cada paso lee lo que dejó el anterior (`data/interim`, `data/derived`) y se ejecuta con su propio comando de uv. Así se puede probar y repetir un paso sin rehacer la descarga.
   - *Alternativa:* un notebook. Se descartó porque es difícil de probar y de revisar en un PR.
2. **DuckDB lee el `.jsonl.gz` y filtra la región lo antes posible.** El filtro por departamento se aplica al leer, y la normalización trabaja solo con La Libertad.
   - *Alternativa:* pandas con todo en memoria. Se descartó porque el archivo descomprimido ocupa varios GB.
3. **Determinación del departamento**, en este orden: extensión de departamento del proceso, dirección del comprador en `parties`, y si no hay ninguna, exclusión con el motivo "región indeterminada". El spike (Q1) confirma o corrige este orden antes de implementarlo.
4. **Señales en SQL con parámetros de `config/senales.toml`.**
   - Todas las reglas devuelven filas con la misma estructura: código, objeto, valor, umbral, comparación, entradas, versión y calidad.
   - Los percentiles y las vallas de Tukey (Q3 + 1,5 × RIC) se calculan por grupo con funciones de DuckDB.
   - Los grupos con menos de 30 casos pasan al ámbito nacional.
5. **Cardinal como herramienta externa.** Se instala `ocdscardinal` con uv y se ejecutan `prepare`, `coverage` e `indicators` con un `settings.ini` propio, sin copiar ni modificar su código. Sus resultados solo se usan para el informe de contraste; las señales de la aplicación salen de nuestras reglas.
   - *Alternativa:* usar Cardinal como fuente de S01 y S02. Se descartó mientras el spike no confirme que los datos tienen los campos `bids` que necesita.
6. **Seudónimos con HMAC.** Se calcula HMAC-SHA256 del RUC con un secreto local (`PSEUDONYM_SECRET` en `.env`, que no se sube). Los proveedores se ordenan por ese valor y reciben números correlativos (P0001 → "Proveedor 0001"). Los seudónimos son estables mientras no cambien el conjunto de datos ni el secreto, y nadie puede revertirlos sin el secreto.
   - *Alternativa:* numerar según el orden del RUC. Se descartó porque permite deducir la identidad.
7. **Expedientes simulados con semilla fija.** Se generan de 5 a 10 expedientes para procesos elegidos para el caso práctico, con `simulado: true`, y siempre salen iguales.
8. **Validación antes de escribir.** La exportación valida cada archivo con `jsonschema` contra `contracts/paquete-de-datos.schema.json`, que escribe el Lote B, y solo entonces escribe en la carpeta de datos de la web. El paquete público va a `web/data/publico/` y se puede versionar después de revisarlo. El paquete local va a `web/data/local/` y nunca se versiona.

## Risks / Trade-offs

- [El spike muestra que no existe el número de postores] → S01 pasa a contar `tender.tenderers`. Si tampoco existe, S01 se reemplaza por S05 en el núcleo y se avisa al equipo.
- [Los umbrales legales por método no están en los datos] → se cargan a mano en `config/senales.toml` con la norma citada y la fecha de verificación.
- [El paquete público pesa demasiado para el repositorio] → reducir el periodo a 2026 o cambiar el formato a SQLite sin cambiar la forma del contrato (ADR 0002).
- [Falsos positivos en S03 con proveedores únicos del rubro] → la explicación lo advierte, y la revisión "justificada" sirve para ajustar el umbral.
- [Cardinal no compila o no se instala en alguna máquina] → el contraste es opcional para la demo; la falla se documenta en el informe.

## Migration Plan

No aplica: es un proyecto nuevo. Para volver atrás, se regenera el paquete con la versión anterior de `config/senales.toml`.

## Open Questions

- El formato exacto del enlace a la Ficha Única del Proveedor se verifica en el spike. No cambia las specs, porque en modo público el enlace no se muestra.
