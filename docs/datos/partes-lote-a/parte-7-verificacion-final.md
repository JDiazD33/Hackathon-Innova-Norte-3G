# Parte 7 · Verificación final del lote (tarea 7.1)

**Rama:** `lote-a/parte-7-verificacion`, desde `main` con las partes del Lote A ya integradas. **PR:** hacia `main` (PR de cierre del lote).

## Tarea

- [ ] 7.1 Ejecutar `uv run pytest` y `uv run ruff check` en verde, recalcular dos veces con los mismos insumos y comparar que los resultados son idénticos, y revisar el manifiesto final. Anotar los resultados en el PR de cierre del lote.

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
