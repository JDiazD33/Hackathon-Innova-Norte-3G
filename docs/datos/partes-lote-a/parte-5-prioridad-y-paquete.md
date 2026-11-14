# Parte 5 · Prioridad, seudónimos y paquete de datos (tareas 5.1 a 5.4)

**Rama:** `lote-a/parte-5-prioridad-y-paquete`, desde `lote-a/parte-4-s03-s04-s08-cardinal` (o desde `main` si la parte 4 ya está fusionada). **PR:** hacia `main`.

## Objetivo

Ordenar los procesos con una prioridad de revisión transparente y exportar el paquete de datos que leen los lotes B, C y D: público y seudonimizado, y local con nombres.

## Entradas

- Señales de las partes 3 y 4, y pesos y cortes de `senales.toml`.
- [Contrato del paquete](../../arquitectura/contrato-paquete-de-datos.md), `contracts/paquete-de-datos.schema.json` y la spec [`paquete-de-datos`](../../../openspec/changes/lote-a-datos-y-senales/specs/datos/paquete-de-datos/spec.md).
- **Depende de la tarea 1.6:** lo que el equipo acuerde sobre el contrato (tabla "Impacto en el contrato" de la [fuente de datos](../fuente-de-datos.md)).

## Tareas

- [ ] 5.1 Implementar la prioridad con su desglose. Verificar con pruebas: S01 + S03 da 6 (alta) y un proceso sin señales tiene prioridad nula.
- [ ] 5.2 Implementar los seudónimos con HMAC (`PSEUDONYM_SECRET` en `.env`, documentado en `pipeline/.env.example`) y la regla de personas naturales. Verificar con una prueba que busca RUC y nombres en el paquete público y no encuentra ninguno.
- [ ] 5.3 Exportar el paquete por entidad (con `indice.json` y los pesos de prioridad en el manifiesto) y validarlo contra `contracts/paquete-de-datos.schema.json`. Verificar que la validación pasa, que un `ocid` faltante hace fallar la exportación y que, desde `web/`, `PAQUETE_DIR=data/publico npm test -- paquete` termina en verde.
- [ ] 5.4 Generar el paquete público de La Libertad en `web/data/publico/` y el local en `web/data/local/`. Verificar con el Lote B que la web carga el paquete público y que `git status` no muestra el local.

## Diseño propuesto

1. **Prioridad.**
   - El puntaje es la suma de los pesos de las señales del proceso, incluidas las heredadas de S03 y S04. S05 no suma.
   - Niveles según los cortes: alta (5 o más), media (3 o 4) y baja (1 o 2).
   - Se guarda el desglose (`[{codigo, peso}]`). Un proceso sin señales tiene `prioridad: null` y no entra a la bandeja.
   - Los pesos y cortes usados viajan en `manifest.prioridad`.
2. **Seudónimos.**
   - HMAC-SHA256 del RUC, o del identificador si no hay RUC, con `PSEUDONYM_SECRET`.
   - El secreto va en `pipeline/.env`, que no se sube (el `.gitignore` de la raíz ignora `.env`), y la variable se documenta sin valor en `pipeline/.env.example`.
   - Los proveedores se ordenan por el HMAC y reciben números correlativos: `P0001`, con alias "Proveedor 0001".
   - **Nombres:** los `persona_natural` de la tabla `proveedores` nunca llevan nombre, en ningún modo. Se propone tratar igual a los `desconocido`.
3. **Exportación.** Comando nuevo `uv run pipeline export --modo publico|local`.
   - **Archivos:** `manifest.json`, `entidades.json`, `procesos/<entidad_id>.json`, `senales/<entidad_id>.json`, `proveedores.json`, `expedientes-simulados.json` e `indice.json`.
   - **Validación:** cada archivo se valida con `jsonschema` (dependencia nueva, MIT: citarla) antes de escribirse. Un `ocid` faltante detiene la exportación con un error que nombra el archivo y el campo.
   - **Mapeos:**
     - `objeto` sale de `categoria`: goods → bienes, services → servicios, works → obras;
     - `entidad.tipo` sale del nombre: universidad, municipalidad, gobierno regional u otro;
     - `fechas.inicio_presentacion` y `fin_presentacion` van en `null` (spike);
     - `url_seace` va en `null` o con la página del buscador, salvo que el contrato agregue `nomenclatura`;
     - `documentos` sale de la tabla `documentos`.
   - **Identificadores:** el patrón `$defs.id` del schema (`^[A-Za-z0-9][A-Za-z0-9._-]*$`) admite `buyer.id` y `ocid` tal cual.
   - **Señales desactivadas:** S02 y S06 van en `senales_desactivadas` con su motivo, si así se decidió.
4. **Destinos.**
   - El paquete público va a `web/data/publico/` y se sube solo después de revisarlo.
   - El local va a `web/data/local/` y nunca se sube (el `.gitignore` ya lo excluye).
   - **Validación desde `web/`:** `npm ci && PAQUETE_DIR=data/publico npm test -- paquete`. `CONTRIBUTING.md` indica Node 24 y la laptop tiene Node 22: probarlo y, si falla, actualizar Node.

## Pruebas

- **Prioridad:** S01 + S03 → puntaje 6, nivel alta y desglose S01 + S03; un proceso sin señales → prioridad nula.
- **Seudónimos y privacidad:**
  - en el paquete público no aparece ningún RUC ni ningún nombre de proveedor de los datos de origen;
  - un mismo proveedor en dos procesos tiene el mismo seudónimo;
  - con el mismo secreto se obtienen los mismos seudónimos entre ejecuciones;
  - una persona natural en modo local → `nombre: null` y `tipo: "persona_natural"`;
  - el modo local lleva `"modo": "local"` y las personas jurídicas muestran su nombre y RUC.
- **Validación:** el paquete pasa el schema; un `ocid` faltante → error con el archivo y el campo; los datos simulados llevan `simulado: true`.

## Verificación y entrega

- **Comprobaciones:** `uv run pytest`, `uv run ruff check`, la exportación real y, desde `web/`, la prueba del paquete en verde; anotar los resultados en el PR.
- **Tarea 5.4:** Joaquín confirma que la web carga el paquete público, y `git status` no muestra `web/data/local/`.

## Archivos

`pipeline/src/pipeline/priority.py`, `pipeline/src/pipeline/pseudonyms.py`, `pipeline/src/pipeline/export.py`, `pipeline/.env.example`, `pipeline/pyproject.toml` (`jsonschema`), `pipeline/src/pipeline/cli.py`, `pipeline/tests/`, `web/data/publico/` (generado) y `CONTRIBUTING.md`.
