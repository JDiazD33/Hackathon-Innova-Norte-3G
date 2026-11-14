# Parte 7 · Verificación final del lote (tarea 7.1)

**Rama:** `lote-a/parte-7-verificacion`, desde `main` con las partes del Lote A ya integradas (o, mientras no lo estén, desde la parte 6). **PR:** hacia `main` (PR de cierre del lote).

## Tarea

- [x] 7.1 Ejecutar `uv run pytest` y `uv run ruff check` en verde, recalcular dos veces con los mismos insumos y comparar que los resultados son idénticos, y revisar el manifiesto final. Anotar los resultados en el PR de cierre del lote.

## Resultado (14 de noviembre)

**Rama:** el equipo decidió no fusionar nada en `main` por ahora, así que la rama salió de `lote-a/parte-6-opcionales-e-integracion`, que tiene todo el Lote A. Es el mismo código que llegará a `main`. Después de fusionar, conviene repetir el paso 2 desde `main`: correr la cadena dos veces y comparar con `fingerprint`.

1. **Pruebas y lint:** `uv run pytest` da 146 passed, incluida la integración real con Cardinal 0.0.9. `uv run ruff check` y `uv run ruff format --check` no tienen observaciones.
2. **Reproducibilidad:** la cadena completa (`ingest`, `normalize`, `signals`, `cardinal` y `export` público y local) se ejecutó dos veces, unos 20 s cada vez, con los mismos archivos, configuración y `PSEUDONYM_SECRET`.
   - **Comando nuevo:** `uv run pipeline fingerprint` calcula el SHA-256 de cada salida; en los JSON, sin `generado`, el único campo que cambia entre ejecuciones.
   - **Resultado:** las huellas de los 537 archivos son idénticas. Cubren 5 archivos intermedios (incluida la entrada de Cardinal), 10 de tablas, 4 de señales (con el contraste de Cardinal y los expedientes simulados), y 259 de cada paquete.
   - **Cómo repetirlo:** `uv run pipeline fingerprint --out ../data/derived/verificacion/huellas-1.json` después de la primera ejecución, y `--compare` con ese archivo después de la segunda.
3. **Manifiesto final** (`web/data/publico/manifest.json`):
   - **Fuente:** OECE – Contrataciones Abiertas (SEACE), vía OCP Data Registry; archivos `2025.jsonl.gz` y `2026.jsonl.gz`; licencia CC BY 4.0 con su atribución; fecha de corte 4 de octubre de 2026; La Libertad, 2025 y 2026; reglas `2026.11.1`; contrato 1.0.
   - **Conteos:** 5 036 procesos, 130 señales, 2 591 proveedores y 127 entidades. Las exclusiones y las correcciones llevan su cantidad.
   - **Señales:** activas S01, S03, S05 y S08. Desactivadas, con su motivo: S02 (sin plazo de presentación), S04 (faltan los umbrales) y S06 (9.1% de contratos con monto final). La prioridad lleva pesos y cortes.
   - **Observación:** `prioridad.pesos` también lista los pesos de las señales desactivadas (S02, S04, S06 y S07), que no suman a nada mientras estén apagadas.
4. **Privacidad:** el paquete público tiene 0 números con forma de RUC y 0 nombres de personas naturales o jurídicas. Solo quedan 12 nombres de consorcios que son nombres de lugares ("SAN MARTIN", "LOS ANGELES"…), como se explica en la [parte 5](parte-5-prioridad-y-paquete.md#privacidad). `git status` no muestra `web/data/local/`, `data/` ni `pipeline/.env`.
5. **Contrato:** desde `web/`, `PAQUETE_DIR=data/publico npm test -- paquete` y `PAQUETE_DIR=data/local npm test -- paquete` dan 10 de 10.

**Antes de archivar el change:** siguen abiertas las tareas 1.6 (contrato), 3.4 y 4.5 (verificación en el SEACE), 5.4 (confirmación del Lote B) y 6.2 (integración). El change se archiva cuando se cierren y se confirme la entrega del Stage-Gate 1.

## Cómo verificarlo

1. **Pruebas y lint:** `uv run pytest`, `uv run ruff check` y `uv run ruff format --check` desde `pipeline/`.
2. **Reproducibilidad:**
   - correr dos veces la cadena completa (`ingest`, `normalize`, `signals`, `cardinal` y `export`) con los mismos archivos, la misma configuración y el mismo `PSEUDONYM_SECRET`;
   - comparar los SHA-256 de las tablas, las señales y el paquete;
   - los únicos campos que pueden cambiar son las fechas de generación (`generado`), que se excluyen de la comparación.
3. **Manifiesto final:**
   - **Fuente:** la licencia, la atribución, la fecha de corte, la región y los años;
   - **Conteos y descarte:** los conteos, las exclusiones y las correcciones;
   - **Señales:** las activas y las desactivadas, con su motivo, y los pesos de la prioridad.
4. **Privacidad:** el paquete público no tiene RUC ni nombres de proveedores, y `web/data/local/` no aparece en `git status`.
5. **Contrato:** desde `web/`, `PAQUETE_DIR=data/publico npm test -- paquete` en verde.

## Después de la entrega

Cuando se confirme la entrega del Stage-Gate 1, archivar el change con `openspec-archive-change` (`/opsx:archive` en Claude Code).
