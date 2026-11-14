# Tasks

Lote A · Datos y señales · **Stefano** · ★★★★ · carpeta `pipeline/` · plan en `docs/plan/cronograma-y-lotes.md`

Cada parte tiene su ficha (contexto, diseño propuesto, verificación) y su rama en [`docs/datos/partes-lote-a/`](../../../docs/datos/partes-lote-a/README.md).

## 1. A1 · Spike de datos (Fase 0, sáb 14)

- [x] 1.1 Crear `pipeline/` con uv (Python 3.12 o 3.13), DuckDB, pytest y ruff, y anotar los comandos en `CONTRIBUTING.md`. Verificar que `uv run pytest` y `uv run ruff check` terminan sin errores.
- [x] 1.2 Descargar `2026.jsonl.gz` del OCP Data Registry en `data/raw/` y registrar la URL, la fecha y el tamaño. Verificar que el tamaño coincide con el publicado (unos 155 MB) y que `git status` no muestra el archivo.
- [x] 1.3 Responder Q1–Q4 (departamento, plazo de presentación, postores y clasificación de ítems) con consultas DuckDB. Verificar anotando los campos exactos y las cifras en `docs/datos/fuente-de-datos.md`.
- [x] 1.4 Responder Q5–Q7 (método, culminación y tamaño de La Libertad en 2025–2026). Verificar con las cifras anotadas en el mismo documento.
- [x] 1.5 Instalar `ocdscardinal` y ejecutar `coverage` y `prepare` sobre una muestra (Q8). Verificar anotando qué indicadores de Cardinal se pueden calcular con estos datos.
- [ ] 1.6 Revisar con el Lote B el contrato v1 (`docs/arquitectura/contrato-paquete-de-datos.md`) y ajustarlo a lo que mostró el spike. Verificar con la aprobación de los cuatro integrantes en el PR.

## 2. A2 · Ingesta y normalización

- [x] 2.1 Implementar la descarga con la lista de fuentes permitidas. Verificar con pruebas: una URL permitida pasa y una no permitida se detiene con un mensaje que la nombra.
- [x] 2.2 Implementar el filtro por departamento y años, con las exclusiones contadas. Verificar con un fixture sintético: el proceso de otra región queda fuera y la región indeterminada se cuenta.
- [x] 2.3 Generar las tablas normalizadas en Parquet. Verificar con una prueba en la que un proceso con dos adjudicaciones produce dos filas con el mismo `ocid`.
- [x] 2.4 Tratar los postores duplicados, los contratos sin estado y las adjudicaciones sin contrato. Verificar con pruebas y con los conteos de correcciones del manifiesto.
- [x] 2.5 Escribir el manifiesto de ejecución. Verificar con una prueba automática que sus conteos coinciden con las filas de cada tabla.

## 3. A3 · Señales S01 y S02

- [x] 3.1 Crear `config/senales.toml` con los parámetros y pesos iniciales del catálogo. Verificar que el cálculo se detiene con un mensaje claro si falta un parámetro.
- [x] 3.2 Implementar S01 con la estructura de resultado común. Verificar con pruebas positiva, negativa (contratación directa) y sin dato de postores.
- [x] 3.3 Implementar S02 con el percentil por grupo y el respaldo nacional. Verificar con pruebas de un caso bajo el percentil y de un grupo pequeño.
- [ ] 3.4 Verificar a mano 5 resultados reales de S01 y 5 de S02 contra el SEACE y anotar la verificación en el PR.

## 4. A4 · S03, S04, S08 y contraste con Cardinal

- [x] 4.1 Implementar S03 (ventana de 12 meses, valla de Tukey, mínimo 3 adjudicaciones y herencia a los procesos). Verificar con pruebas de participación atípica y de pocas adjudicaciones.
- [x] 4.2 Implementar S04 (misma clase de ítem, ventana configurable y suma sobre el umbral). Verificar con pruebas de compras dentro y fuera de la ventana.
- [x] 4.3 Generar `expedientes-simulados.json` con semilla fija e implementar S08. Verificar que todos los resultados llevan `simulado: true` y que dos ejecuciones dan el mismo archivo.
- [x] 4.4 Ejecutar Cardinal (R018 y R003) y generar el informe de contraste. Verificar que el informe lista las coincidencias y las diferencias, o el motivo si no fue posible.
- [ ] 4.5 Verificar a mano 5 resultados de S03 y 5 de S04 y actualizar `docs/datos/catalogo-de-senales.md` con las reglas finales.

## 5. A5 · Prioridad y paquete de datos

- [x] 5.1 Implementar la prioridad con su desglose. Verificar con pruebas: S01 + S03 da 6 (alta) y un proceso sin señales tiene prioridad nula.
- [x] 5.2 Implementar los seudónimos con HMAC (`PSEUDONYM_SECRET` en `.env`, documentado en `pipeline/.env.example`) y la regla de personas naturales. Verificar con una prueba que busca RUC y nombres en el paquete público y no encuentra ninguno.
- [x] 5.3 Exportar el paquete por entidad (con `indice.json` y los pesos de prioridad en el manifiesto) y validarlo contra `contracts/paquete-de-datos.schema.json`. Verificar que la validación pasa, que un `ocid` faltante hace fallar la exportación y que, desde `web/`, `PAQUETE_DIR=data/publico npm test -- paquete` termina en verde.
- [ ] 5.4 Generar el paquete público de La Libertad en `web/data/publico/` y el local en `web/data/local/`. Verificar con el Lote B que la web carga el paquete público y que `git status` no muestra el local.

## 6. A6 · Señales opcionales e integración (Fase 2)

- [x] 6.1 Implementar S05 y S06 solo si los datos alcanzan la cobertura mínima. Verificar con pruebas, o con la desactivación registrada en el manifiesto.
- [ ] 6.2 Integrar en `main` los PR de los lotes B, C y D que estén aprobados. Verificar recorriendo la demo completa en local: bandeja → ficha → explicación → decisión → reporte.

## 7. Verificación del lote

- [x] 7.1 Ejecutar `uv run pytest` y `uv run ruff check` en verde, recalcular dos veces con los mismos insumos y comparar que los resultados son idénticos, y revisar el manifiesto final. Anotar los resultados en el PR de cierre del lote.

## Workflow follow-up

- Archivar el change con `openspec-archive-change` cuando la entrega del Stage-Gate 1 esté confirmada.
