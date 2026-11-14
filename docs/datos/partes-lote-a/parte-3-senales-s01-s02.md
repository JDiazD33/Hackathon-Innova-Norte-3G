# Parte 3 · Configuración de señales, S01 y S02 (tareas 3.1 a 3.4)

**Rama:** `lote-a/parte-3-senales-s01-s02`, desde `lote-a/parte-2-ingesta` (o desde `main` si la parte 2 ya está fusionada). **PR:** hacia `main`.

## Objetivo

Construir el marco común de las señales y las dos primeras señales de proceso:

- configuración versionada;
- una sola estructura de resultado;
- grupos de comparación con respaldo nacional;
- S01 (oferta única) y S02 (plazo corto).

## Entradas

- Tablas de `data/derived/tablas/`, sobre todo `procesos`: `metodo`, `anio_convocatoria`, `categoria`, `numero_postores` y fechas ([columnas](../tablas-normalizadas.md)).
- Reglas del [catálogo](../catalogo-de-senales.md) y spec [`calculo-de-senales`](../../../openspec/changes/lote-a-datos-y-senales/specs/senales/calculo-de-senales/spec.md).
- Estructura de cada señal en el [contrato](../../arquitectura/contrato-paquete-de-datos.md#senalesentidad_idjson): `id`, `codigo`, `categoria`, `nivel`, `objeto`, `ocids`, `valor`, `unidad`, `umbral`, `comparacion`, `referencia`, `version_regla`, `entradas`, `calidad` y `simulado`.

## Tareas

- [ ] 3.1 Crear `config/senales.toml` con los parámetros y pesos iniciales del catálogo. Verificar que el cálculo se detiene con un mensaje claro si falta un parámetro.
- [ ] 3.2 Implementar S01 con la estructura de resultado común. Verificar con pruebas positiva, negativa (contratación directa) y sin dato de postores.
- [ ] 3.3 Implementar S02 con el percentil por grupo y el respaldo nacional. Verificar con pruebas de un caso bajo el percentil y de un grupo pequeño.
- [ ] 3.4 Verificar a mano 5 resultados reales de S01 y 5 de S02 contra el SEACE y anotar la verificación en el PR.

## Diseño propuesto

1. **`pipeline/config/senales.toml`**
   - **Por señal:** `activa`, `version` (S01@1…) y sus parámetros:
     - S01: tabla de métodos competitivos;
     - S02: `percentil = 10`;
     - S03: `ventana_meses = 12` y `minimo_adjudicaciones = 3`;
     - S04: `ventana_dias = 60`, `digitos_clasificacion` y umbrales por método;
     - S06: `factor = 1.15` y `cobertura_minima = 0.10`.
   - **Comunes:** `factor_tukey = 1.5` y `minimo_grupo = 30`.
   - **Prioridad:** pesos S01 = 3, S02 = 2, S03 = 3, S04 = 3, S06 = 2, S07 = 3, S08 = 3, y cortes alta = 5, media = 3.
   - **Validación:** reutilizar `get_value`, `get_text` y demás funciones de `pipeline/config.py`, para que el error nombre el parámetro que falta.
2. **Tabla de métodos.** Por nombre de `procurementMethodDetails` se anota si el método es competitivo y su método base, para agrupar variantes como "Homologación" o "Ley N° 31589". No usar `procurementMethod`, que falta en las licitaciones y concursos abreviados. Hay que decidir cómo tratar el Régimen Especial, la Contratación Internacional y los convenios.
3. **Grupos de comparación.**
   - Mismo método base y mismo año (y mismo tipo de objeto si hay al menos 30 casos).
   - Con menos de 30 casos regionales se usa el grupo nacional y el resultado dice `ambito: "nacional"`.
   - **Falta el insumo nacional:** agregar a la ingesta una tabla liviana con todos los procesos del país en los años configurados (por ejemplo, `data/interim/procesos-nacionales.parquet`, con `ocid`, entidad, método, año, categoría, `numero_postores` y fechas de plazos).
4. **Resultado común.**
   - Una fila por señal con los campos del contrato, en `data/derived/senales/senales.parquet` (o JSON por líneas).
   - Al lado, un `manifiesto.json` con las exclusiones por señal, como "sin dato de postores".
   - Comando nuevo: `uv run pipeline signals`.
5. **S01.**
   - Método competitivo con `numero_postores = 1`. La contratación directa queda fuera.
   - Sin dato de postores no se evalúa y se cuenta la exclusión.
   - Campos: `valor` = 1; `comparacion.proporcion_referencia` = proporción del grupo con un solo participante; `referencia` = `{"cardinal": "R018", "ocp": "Single bid received"}`.
   - **Decidir antes:** el spec pide la unidad "postores", pero los datos son participantes registrados. Si el equipo cambia la unidad a "participantes registrados", hay que actualizar el spec.
6. **S02.**
   - Regla: el plazo en días calendario está bajo el percentil configurado de su grupo, con respaldo nacional.
   - **La fuente no trae plazo de presentación** (inicio = fin).
   - Implementar la regla sobre una columna de plazo y dejar `activa = false`, con el motivo en `senales_desactivadas`, salvo que el equipo decida usar el plazo de consultas (`fecha_inicio_consultas` → `fecha_fin_consultas`).
   - Las pruebas usan datos sintéticos con plazo.

## Pruebas

- **S01:**
  - adjudicación simplificada con un postor → valor 1;
  - contratación directa con un postor → sin S01;
  - sin dato de postores → no se evalúa y se cuenta la exclusión.
- **S02:**
  - el percentil 10 del grupo es 5 días y el caso tiene 2 → señal con valor 2 y umbral 5;
  - grupo regional con menos de 30 casos → comparación nacional.
- **Configuración:**
  - falta el percentil de S02 → error que lo nombra;
  - cambiar un parámetro cambia el resultado sin tocar el código y registra la nueva versión de la regla.
- **Reproducibilidad:** dos ejecuciones con los mismos insumos dan el mismo resultado.

## Verificación y entrega

- **Comprobaciones:** `uv run pytest`, `uv run ruff check` y `uv run pipeline signals` sobre los datos reales; anotar las cifras en el PR.
- **Tarea 3.4 (Stefano):** verificar a mano en el SEACE 5 casos de S01 y 5 de S02, o anotar que S02 quedó desactivada. Los casos de la consulta `casos_para_verificar_en_el_seace` del spike sirven de punto de partida.
- **Documentación:** actualizar el catálogo (reglas, parámetros y lo que no significa cada señal) y `CONTRIBUTING.md`.

## Archivos

`pipeline/config/senales.toml`, `pipeline/src/pipeline/signals/` (por ejemplo `base.py`, `groups.py`, `s01.py` y `s02.py`), `pipeline/src/pipeline/ingest.py` (tabla nacional), `pipeline/src/pipeline/cli.py`, `pipeline/tests/`, `docs/datos/catalogo-de-senales.md` y `CONTRIBUTING.md`.
