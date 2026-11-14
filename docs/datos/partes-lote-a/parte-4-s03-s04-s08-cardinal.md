# Parte 4 · S03, S04, S08 y contraste con Cardinal (tareas 4.1 a 4.5)

**Rama:** `lote-a/parte-4-s03-s04-s08-cardinal`, desde `lote-a/parte-3-senales-s01-s02` (o desde `main` si la parte 3 ya está fusionada). **PR:** hacia `main`.

## Objetivo

Agregar estas piezas sobre el marco de la parte 3:

- la señal de concentración (S03);
- la de fraccionamiento (S04);
- los expedientes simulados con S08;
- el informe de contraste con Cardinal.

## Entradas

- Marco de señales, `senales.toml` y tabla de métodos de la parte 3.
- Tablas `adjudicaciones` (con `fecha_adjudicacion` en casi el 100 %), `proveedores`, `items` (CUBSO y UNSPSC en el 88 % de los procesos) y `procesos`.
- La línea de comandos de Cardinal, compilada desde la etiqueta 0.0.9 (`CONTRIBUTING.md`), y lo aprendido en Q8 del spike.

## Tareas

- [ ] 4.1 Implementar S03 (ventana de 12 meses, valla de Tukey, mínimo 3 adjudicaciones y herencia a los procesos). Verificar con pruebas de participación atípica y de pocas adjudicaciones.
- [ ] 4.2 Implementar S04 (misma clase de ítem, ventana configurable y suma sobre el umbral). Verificar con pruebas de compras dentro y fuera de la ventana.
- [ ] 4.3 Generar `expedientes-simulados.json` con semilla fija e implementar S08. Verificar que todos los resultados llevan `simulado: true` y que dos ejecuciones dan el mismo archivo.
- [ ] 4.4 Ejecutar Cardinal (R018 y R003) y generar el informe de contraste. Verificar que el informe lista las coincidencias y las diferencias, o el motivo si no fue posible.
- [ ] 4.5 Verificar a mano 5 resultados de S03 y 5 de S04 y actualizar `docs/datos/catalogo-de-senales.md` con las reglas finales.

## Diseño propuesto

1. **S03 · Proveedor recurrente atípico** (nivel `proveedor_entidad`).
   - Por entidad, en una ventana de `ventana_meses` (propuesta: los 12 meses que terminan en la fecha de corte del manifiesto), se calcula la participación de cada proveedor en el monto adjudicado o en el número de adjudicaciones.
   - Hay señal si la participación supera la valla de Tukey (Q3 + `factor_tukey` × RIC) de los proveedores de esa entidad y el proveedor tiene al menos `minimo_adjudicaciones`.
   - `ocids` lista los procesos que ganó y cada uno hereda la señal para su prioridad. Id sugerido: `S03-<proveedor>-<entidad>`.
   - **Exclusiones contadas:**
     - adjudicaciones sin proveedor;
     - montos en otra moneda, salvo que se puedan convertir con `monto_referencial_pen / monto_referencial` del proceso.
   - **Límite que debe decir la explicación:** los consorcios cambian de código en cada adjudicación y no acumulan.
2. **S04 · Compras similares cercanas** (nivel `grupo`).
   - Hay señal cuando la misma entidad convoca 2 o más procesos de la misma clase de ítem (UNSPSC con `digitos_clasificacion`; se propone 6), dentro de `ventana_dias`, con métodos menos exigentes, y la suma supera el umbral del método superior.
   - **Umbrales:** cargar a mano en `senales.toml` los de la Ley 32069 y su reglamento para 2025 y 2026, en UIT y en soles, con la norma citada y la fecha de verificación. Verificarlos antes de usarlos.
   - `valor` = suma, `umbral` = umbral del método superior y `ocids` = los procesos del grupo, que heredan la señal.
3. **S08 y expedientes simulados.**
   - Entre 5 y 10 expedientes con semilla fija, para procesos elegidos para el caso práctico, en el formato de `expedientes-simulados.json` del contrato.
   - Hay S08 si la misma persona solicita, evalúa y da conformidad, o si hay un pago sin conformidad documentada.
   - Todo lleva `simulado: true`. Un proceso sin expediente no se evalúa.
4. **Contraste con Cardinal.** Comando nuevo `uv run pipeline cardinal`.
   - **Preparación:** muestra de La Libertad con `tender.procurementMethod` completado desde la tabla de métodos (si no, R018 no ve las licitaciones ni los concursos abreviados), y `prepare` con `award_status = active`.
   - **Indicadores:** `indicators` con la configuración de `init`, que debe tener las secciones `[R003]` y `[R018]`.
   - **Informe:**
     - porcentaje de coincidencia de R018 con S01 y la lista de diferencias;
     - para R003, "no fue posible", porque `tenderPeriod` no tiene duración;
     - si la herramienta no está instalada, el informe lo dice y el resto del pipeline sigue.

## Pruebas

- **S03:**
  - un proveedor gana 9 de los 12 procesos de una entidad y supera la valla → señal con sus `ocids` y herencia a cada proceso;
  - 2 adjudicaciones → sin señal.
- **S04:**
  - dos compras de la misma clase con 20 días de diferencia que juntas superan el umbral → señal con ambos `ocids`, la suma y el umbral;
  - las mismas compras con 120 días de diferencia → sin señal.
- **S08:** funciones concentradas en una persona → señal con `simulado: true`; dos ejecuciones dan un archivo idéntico (mismo hash); un proceso sin expediente no se evalúa.
- **Contraste:**
  - S01 marca 120 y R018 115 de ellos → 115 coincidencias y los 5 casos que difieren;
  - datos insuficientes → informe con el motivo.

## Verificación y entrega

- **Comprobaciones:** `uv run pytest`, `uv run ruff check`, ejecución real de las señales y del contraste, con las cifras en el PR.
- **Tarea 4.5 (Stefano):** verificar a mano en el SEACE 5 casos de S03 y 5 de S04, anotarlos en el PR y dejar las reglas finales en el catálogo.

## Archivos

`pipeline/src/pipeline/signals/` (`s03.py`, `s04.py`, `s08.py`), `pipeline/src/pipeline/cardinal.py`, `pipeline/config/senales.toml`, `pipeline/src/pipeline/cli.py`, `pipeline/tests/`, `docs/datos/catalogo-de-senales.md` y `CONTRIBUTING.md`.
