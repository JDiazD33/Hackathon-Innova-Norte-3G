# Parte 6 · S05, S06 e integración (tareas 6.1 y 6.2)

**Rama:** `lote-a/parte-6-opcionales-e-integracion`, desde la última parte del Lote A que no esté en `main` (o desde `main`). **PR:** hacia `main`.

La tarea 6.1 puede adelantarse a la parte 5 si se quiere que S05 salga en el primer paquete. La 6.2 espera a que los PR de los lotes B, C y D estén aprobados.

## Tareas

- [x] 6.1 Implementar S05 y S06 solo si los datos alcanzan la cobertura mínima. Verificar con pruebas, o con la desactivación registrada en el manifiesto.
- [ ] 6.2 Integrar en `main` los PR de los lotes B, C y D que estén aprobados. Verificar recorriendo la demo completa en local: bandeja → ficha → explicación → decisión → reporte. *Espera a que esos PR estén aprobados y a que Stefano los fusione.*

## Resultado de la tarea 6.1 (14 de noviembre)

- **S05 activa**, con 9 señales en La Libertad 2025–2026. Las reglas y las cifras están en el [catálogo](../catalogo-de-senales.md#s05--uso-atípico-de-contratación-directa-opcional).
  - **Comparación:** con entidades del mismo tipo, como propone el diseño. Las municipalidades se comparan con las 72 de La Libertad; las unidades del gobierno regional, las universidades y las demás, con las de todo el país, porque en la región son menos de 30.
  - **Tabla nacional:** para eso, `procesos_nacionales` tiene ahora la columna `entidad_nombre`. Hay que volver a ejecutar `ingest` y `normalize`.
  - **Tipo de entidad:** la clasificación por nombre pasó a `pipeline/src/pipeline/entities.py`, y la usan S05 y el paquete.
  - **Parámetro nuevo, `minimo_directas` (3):** sin él, 8 de las 14 entidades marcadas tenían menos de 3 contrataciones directas, porque la mayoría de las municipalidades no hace ninguna y la valla del monto queda en 0,9 %.
  - **En el paquete:** las señales van en `senales_entidad` de cada entidad y no suman a la prioridad. Pasa de 121 a 130 señales.
- **S06 desactivada por cobertura.** El manifiesto la lista con el motivo "Solo el 9,1 % de los contratos de La Libertad tiene monto final (contracts[].implementation.finalValue); el mínimo es 10 %".
  - **Implementación:** la regla está completa y probada. Si el equipo baja el mínimo, marcaría 61 contratos con el factor 1,15.
  - **Cómo se desactiva:** cuando los datos no alcanzan, una regla activa en `senales.toml` puede quedar desactivada con su motivo (`SignalUnavailable`).
- **Verificación:**
  - `uv run pytest`: 142 pruebas en verde, 19 de ellas en `tests/test_signals_s05_s06.py`. `uv run ruff check` y `uv run ruff format --check`: sin observaciones;
  - `uv run pipeline ingest`, `normalize`, `signals` y `export` (público y local) sobre los datos reales;
  - desde `web/`, `PAQUETE_DIR=data/publico npm test -- paquete` y `PAQUETE_DIR=data/local npm test -- paquete`: 10 de 10 en cada uno.
- **Pendiente del equipo:**
  - aprobar los grupos de comparación de S05;
  - decidir una proporción mínima (`proporcion_minima`): con 5 % quedarían 7 señales;
  - decidir si se baja la cobertura mínima de S06.

## Diseño propuesto

1. **S05 · Uso atípico de contratación directa** (nivel `entidad`).
   - Hay señal si la proporción de contratación directa de la entidad, por monto o por cantidad, supera la valla de Tukey de las entidades del mismo tipo.
   - Se muestra en el panel de la entidad y **no suma** a la prioridad del proceso.
   - **Datos:** el método está en el 100 % de los procesos y en La Libertad 2025–2026 hay 377 contrataciones directas.
   - **Comparación:** como La Libertad tiene 127 entidades, conviene comparar con entidades del mismo tipo de todo el país, usando la tabla nacional de la parte 3.
2. **S06 · Monto final mayor que el contratado** (nivel contrato).
   - Con la regla actual se desactiva: solo el 9,1 % de los contratos de La Libertad 2025–2026 tiene monto final y el mínimo es 10 %. Queda en `senales_desactivadas` con ese motivo.
   - Si el equipo baja el mínimo, hay que calibrar el factor 1,15, porque la razón final/contratado tiene una mediana de 1,11.
3. **Integración.**
   - Stefano fusiona en `main` los PR aprobados de B, C y D. Un agente no fusiona sin autorización expresa.
   - Después se regenera el paquete y se recorre la demo local con el paquete público y con el fixture.

## Pruebas

- **S05:**
  - entidad con una proporción de directas sobre la valla → señal de entidad que no entra en la prioridad;
  - entidad bajo la valla → sin señal;
  - entidad sin procesos con método → no se evalúa.
- **S06 desactivada:** el manifiesto la lista con el motivo y no hay resultados de S06. Si se activa: positivo con factor 1,15 o más, negativo debajo y contrato sin monto final.

## Verificación y entrega

- **6.1:** pruebas en verde y manifiesto con S05 activa o desactivada con su motivo, y S06 desactivada o activa.
- **6.2:** el recorrido completo funciona en local, con capturas o una nota de lo revisado en el PR.

## Archivos

`pipeline/src/pipeline/signals/s05.py`, `pipeline/src/pipeline/signals/s06.py`, `pipeline/src/pipeline/signals/` (`compute.py`, `settings.py`, `context.py`), `pipeline/src/pipeline/entities.py`, `pipeline/src/pipeline/ingest.py` y `normalize.py` (`entidad_nombre`), `pipeline/src/pipeline/export.py`, `pipeline/config/senales.toml`, `pipeline/tests/`, `docs/datos/catalogo-de-senales.md` y `docs/datos/tablas-normalizadas.md`.
