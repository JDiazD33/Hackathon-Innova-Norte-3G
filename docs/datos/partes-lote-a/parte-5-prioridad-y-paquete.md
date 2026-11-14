# Parte 5 · Prioridad, seudónimos y paquete de datos (tareas 5.1 a 5.4)

**Rama:** `lote-a/parte-5-prioridad-y-paquete`, desde `lote-a/parte-4-s03-s04-s08-cardinal` (o desde `main` si la parte 4 ya está fusionada). **PR:** hacia `main`.

## Objetivo

Ordenar los procesos con una prioridad de revisión transparente y exportar el paquete de datos que leen los lotes B, C y D: público y seudonimizado, y local con nombres.

## Entradas

- Señales de las partes 3 y 4, y pesos y cortes de `senales.toml`.
- [Contrato del paquete](../../arquitectura/contrato-paquete-de-datos.md), `contracts/paquete-de-datos.schema.json` y la spec [`paquete-de-datos`](../../../openspec/changes/lote-a-datos-y-senales/specs/datos/paquete-de-datos/spec.md).
- **Depende de la tarea 1.6:** lo que el equipo acuerde sobre el contrato (tabla "Impacto en el contrato" de la [fuente de datos](../fuente-de-datos.md)).

## Tareas

- [x] 5.1 Implementar la prioridad con su desglose. Verificar con pruebas: S01 + S03 da 6 (alta) y un proceso sin señales tiene prioridad nula.
- [x] 5.2 Implementar los seudónimos con HMAC (`PSEUDONYM_SECRET` en `.env`, documentado en `pipeline/.env.example`) y la regla de personas naturales. Verificar con una prueba que busca RUC y nombres en el paquete público y no encuentra ninguno.
- [x] 5.3 Exportar el paquete por entidad (con `indice.json` y los pesos de prioridad en el manifiesto) y validarlo contra `contracts/paquete-de-datos.schema.json`. Verificar que la validación pasa, que un `ocid` faltante hace fallar la exportación y que, desde `web/`, `PAQUETE_DIR=data/publico npm test -- paquete` termina en verde.
- [ ] 5.4 Generar el paquete público de La Libertad en `web/data/publico/` y el local en `web/data/local/`. Verificar con el Lote B que la web carga el paquete público y que `git status` no muestra el local. *Los dos paquetes ya están generados, pasan la prueba de la web y `git status` no muestra el local. Falta que Joaquín confirme que la web carga el público y que el equipo lo revise antes de subirlo.*

## Resultado (13 de noviembre)

Todo está en `pipeline/src/pipeline/export.py`, en lugar de los tres módulos propuestos: `priority()`, `pseudonyms()`, `redact()` y la exportación comparten los datos que se cargan una sola vez.

### Paquete real de La Libertad 2025–2026

| Dato | Valor |
|---|---|
| Procesos, entidades | 5 036 procesos de 127 entidades |
| Señales | 121: S01 = 69, S03 = 46 y S08 = 6 (simuladas). S02 y S04 van en `senales_desactivadas` con su motivo |
| Proveedores en `proveedores.json` | 2 591: los ganadores de algún proceso y los proveedores de S03 |
| Prioridad | 247 procesos con señales: 1 alta (S01 + S03 = 6) y 246 media (una señal de peso 3). Ninguno queda en baja, porque todas las señales activas pesan 3 |
| Tamaño | 259 archivos y 13,2 MB por paquete; cada exportación tarda unos 9 s |

Con las señales activas de hoy la prioridad es casi binaria (media o alta). Conviene revisar los pesos y cortes con el equipo cuando se decidan S02 y S04.

### Privacidad

- **Proveedores:** el identificador es siempre el seudónimo (`P0001`, alias "Proveedor 0001"), ordenado por HMAC-SHA256 del RUC, o del código si no hay RUC.
  - En modo público, ningún proveedor lleva nombre, RUC ni enlace a la Ficha Única.
  - En modo local, solo las personas jurídicas llevan nombre, RUC y enlace. Las personas naturales y los `desconocido` (consorcios y códigos sin RUC) nunca llevan nombre.
- **Textos libres** (descripción del proceso y títulos de documentos). Ocultan los nombres que el paquete no muestra: los de todos los proveedores en modo público, y los de todos menos las empresas en modo local.
  - Los números con forma de RUC se cambian por "[RUC omitido]" en los dos modos.
  - El nombre se cambia por "[proveedor]" en los procesos donde el proveedor participa y también en los demás textos (por ejemplo, la empresa beneficiaria de un plan de negocio que aparece en la descripción de otro proceso). Fuera de sus procesos, el nombre debe tener al menos dos palabras y ocho caracteres, para no ocultar palabras sueltas.
  - **Excepción, los consorcios:** reciben un código corto en cada adjudicación, no tienen RUC y suelen llamarse como el lugar de la obra ("SAN MARTIN", "LOS ANGELES"). Su nombre solo se oculta en sus propios procesos, para no borrar nombres de calles y centros poblados en los demás. Aun así, en 7 descripciones el lugar coincide con el nombre del consorcio que participa y queda oculto (por ejemplo, "CENTRO DE SALUD [proveedor] I-3").
  - **Proveedores extranjeros:** los 80 con código "L" y 10 dígitos son casi todos personas (79 de 80), y hay 7 empresas con código de 11 dígitos que empieza con 99. Quedan como `desconocido`: no llevan nombre en ningún modo, y su nombre se oculta en todos los textos.
  - La búsqueda es por palabras completas e ignora mayúsculas, tildes y espacios repetidos. Es un complemento: lo que protege a los proveedores son los campos estructurados, que en modo público nunca llevan nombres.
- **Revisión de los paquetes** (búsqueda de los 11 933 nombres de 8 o más caracteres de la tabla `proveedores` y de la expresión de RUC de la prueba de la web):
  - público: 0 números con forma de RUC, 0 nombres de personas naturales o jurídicas y 0 de proveedores extranjeros. Quedan 12 coincidencias con nombres de consorcios que son nombres de lugares ("SAN MARTIN", "LOS ANGELES", "GUADALUPITO"…), en descripciones de otros procesos o en el nombre de una municipalidad;
  - local: ninguna persona natural ni proveedor extranjero; las empresas aparecen con nombre, como corresponde a ese modo.

### Mapeo al contrato

- `objeto`: goods → bienes, services → servicios, works → obras (consultoría de obras si el método es de consultoría).
- `descripcion`: la de la fuente; si falta, la nomenclatura (`tender.title`).
- `fechas.inicio_presentacion` y `fin_presentacion`: `null` (el spike mostró que `tenderPeriod` solo trae la fecha de la convocatoria). `url_seace`: `null`.
- `numero_postores`: participantes registrados, como en las señales.
- `documentos`: solo los que tienen título y una URL http(s) válida.
- `entidades[].id`: el `buyer.id` de la fuente (`PE-CONSUCODE-…`), que cumple el patrón `$defs.id` del schema.
- `entidades[].resumen`: `monto_total` suma los montos referenciales en soles; `top_proveedores` ordena por participación en el monto adjudicado en soles; `tendencia_mensual` usa el mes de la convocatoria; `por_categoria` cuenta procesos por categoría de sus señales.
- Señales: los proveedores de S03 llevan su seudónimo en `objeto.id`, en `entradas.proveedor_id` y en el `id` de la señal (`S03-<seudónimo>-<entidad>`). La entidad solo decide el archivo.
- `manifest.exclusiones` junta las de las tablas y las de las señales con cantidad mayor que cero.

### Verificación

- `uv run pytest`: 123 pruebas en verde, incluidas las 16 de `tests/test_export.py`. `uv run ruff check` y `uv run ruff format --check`: sin observaciones. `openspec validate --all --strict`: 4 de 4.
- Exportación real: `uv run pipeline export --modo publico` y `--modo local`.
- Desde `web/`, con Node 22.19 (`CONTRIBUTING.md` pide Node 24; `npm ci` avisa, pero funciona): `npm ci`, `PAQUETE_DIR=data/publico npm test -- paquete` y `PAQUETE_DIR=data/local npm test -- paquete`, 10 de 10 pruebas en verde en cada uno.
- Desde `web/`, `PAQUETE_DATOS=publico npm run build` termina bien y la página generada muestra los 5.036 procesos y entidades del paquete real. Es una prueba previa: la confirmación de la tarea 5.4 es de Joaquín.
- `git status` muestra `web/data/publico/` sin subir y no muestra `web/data/local/` (lo ignora el `.gitignore`).

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

`pipeline/src/pipeline/export.py`, `pipeline/.env.example`, `pipeline/pyproject.toml` y `pipeline/uv.lock` (`jsonschema`), `pipeline/src/pipeline/cli.py`, `pipeline/tests/test_export.py`, `web/data/publico/` (generado, se sube después de revisarlo) y `CONTRIBUTING.md`.
