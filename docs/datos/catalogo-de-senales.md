# Catálogo de señales

Una **señal** indica que un proceso, un proveedor o una entidad tiene una característica que **amerita revisión**. No prueba ninguna irregularidad ([ADR 0007](../adr/0007-senales-no-acusaciones.md)). Cada señal tiene un código propio, un referente internacional, una regla versionada, parámetros configurables y una explicación para la persona usuaria.

> **Estado:** versión 1 (borrador). La viabilidad de cada señal se confirma con el [spike de datos](fuente-de-datos.md#spike-de-datos-primer-paso-del-lote-a). Las preguntas del spike se citan como Q1–Q8.

## Resumen

| Código | Señal | Categoría | Nivel | Referente | Desafío | MVP |
|---|---|---|---|---|---|---|
| S01 | Oferta única | Competencia | Proceso | Cardinal R018 · guía OCP | 2 y 1 | Núcleo |
| S02 | Plazo corto para presentar ofertas | Tiempos | Proceso | Cardinal R003 · guía OCP | 2 y 1 | Núcleo |
| S03 | Proveedor recurrente atípico en una entidad | Concentración | Proveedor-entidad | Guía OCP · categoría de concentración de Arachne | 2 | Núcleo |
| S04 | Compras similares cercanas en el tiempo (posible fraccionamiento) | Fraccionamiento | Grupo de procesos | Guía OCP · texto del desafío 2 | 2 | Núcleo |
| S05 | Uso atípico de contratación directa | Competencia | Entidad | Guía OCP | 2 y 1 | Opcional |
| S06 | Monto final mayor que el contratado | Ejecución | Contrato | Guía OCP | 1 y 2 | Opcional |
| S07 | Proveedor con sanción vigente adjudicado | Reputacional | Proveedor | Categoría reputacional de Arachne · desafío 1 | 1 y 2 | Fase 2 (falta la fuente) |
| S08 | Conformidad o pago sin sustento, o funciones incompatibles | Trazabilidad interna | Expediente | Texto del desafío 2 | 2 | Datos sintéticos |

## Viabilidad según el spike (13 de noviembre)

Medida sobre los 5 036 procesos de La Libertad convocados en 2025–2026 (`2025.jsonl.gz` y `2026.jsonl.gz`). El detalle y las consultas están en el [spike de datos](fuente-de-datos.md#spike-de-datos-primer-paso-del-lote-a). Las reglas de abajo no cambian hasta que el equipo decida.

| Código | ¿Se puede calcular? | Datos y cobertura | Qué hay que decidir |
|---|---|---|---|
| S01 | Sí, como "un solo participante registrado" | No hay `bids`. `tender.numberOfTenderers` está en el 92,1 % de los procesos de los dos archivos y, según la evidencia, cuenta participantes registrados, no ofertas | Confirmar en el SEACE (tarea 3.4). Cambiar el texto a "1 participante registrado" en lugar de "1 oferta". Definir la tabla de métodos competitivos |
| S02 | **No**, como está definida | `tender.tenderPeriod` no tiene duración en el 99,99 % de los procesos: inicio y fin son el día de la convocatoria | Desactivarla y subir S05 al núcleo (recomendado), o redefinirla con `tender.enquiryPeriod` (plazo de consultas, 79,5 %) |
| S03 | Sí | `buyer.id`, `awards[].suppliers`, `awards[].value` y `awards[].date` (108 427 de 108 430 adjudicaciones de 2025–2026 tienen fecha) | Los consorcios reciben un código nuevo en cada adjudicación (23,3 % de los proveedores adjudicados), así que no acumulan adjudicaciones |
| S04 | Sí, cuando estén los umbrales | Ítems clasificados (CUBSO y UNSPSC) en 4 417 procesos (87,7 %); valor referencial en 4 671 | Cargar en `S04.umbrales` los umbrales de los métodos de la Ley 32069, verificados con la norma. Hoy está desactivada |
| S05 | Sí | `tender.procurementMethodDetails` en el 100 %; 377 contrataciones directas | Tabla de métodos y grupo de entidades comparables |
| S06 | **No**, con el mínimo actual | Monto final en 290 de 3 177 contratos (9,1 %), por debajo del 10 % mínimo. La razón final/contratado tiene mediana 1,11 y p75 1,25 | Desactivarla con su motivo, o bajar el mínimo y calibrar el factor 1,15, que marcaría entre el 25 % y el 50 % de los contratos con monto final |
| S07 | No | Falta la fuente | Sin cambios |
| S08 | Sí, con datos sintéticos | Expedientes simulados | Sin cambios |

## Método común

- **"Atípico"** significa que el valor supera la valla superior de Tukey (Q3 + 1,5 × RIC) de su grupo de comparación. Es el mismo enfoque de cuartiles y vallas que reporta Cardinal. El factor 1,5 es configurable.
- **Grupo de comparación:** procesos del mismo método de contratación, del mismo año y, cuando haya suficientes casos, del mismo tipo de objeto (bienes, servicios u obras). Si un grupo tiene menos de 30 casos, se amplía al nivel nacional y la explicación lo dice.
  - El método es el método base de `pipeline/config/senales.toml`: las variantes por ley u homologación se comparan con su método.
  - Se prueba en este orden: región con tipo de objeto, región y país. El mínimo (`minimo_grupo`) es configurable.
  - Cada resultado guarda el grupo usado (`comparacion.descripcion` y `comparacion.ambito`), su tamaño, sus cuartiles y el percentil del caso.
- **Exclusiones:** procesos cancelados, sin identificador del comprador o del proveedor, o con montos en otra moneda sin tipo de cambio. Cada exclusión se cuenta y se informa.
- **Trazabilidad del cálculo:** cada resultado guarda la versión de la regla, los valores de entrada, el grupo de comparación y sus estadísticas. Así, cualquiera puede reproducirlo.

## Prioridad de revisión

La prioridad ordena la bandeja. **No es una probabilidad de corrupción.**

- **Fórmula:** puntaje del proceso = suma de los pesos de sus señales. Pesos iniciales: S01 = 3, S02 = 2, S03 = 3, S04 = 3, S06 = 2, S07 = 3, S08 = 3. S05 se muestra en el panel de la entidad y no suma al proceso.
- **Niveles:** alta (5 o más), media (3 o 4) y baja (1 o 2).
- **Configuración:** los pesos y los cortes están en `pipeline/config/senales.toml`, junto con los parámetros y la versión de cada señal.
- **Transparencia:** la interfaz siempre muestra el desglose ("alta: S01 + S03 = 6").

## Fichas de las señales

### S01 · Oferta única

- **Pregunta:** ¿hubo competencia real?
- **Datos:** número de postores (`tender.numberOfTenderers`, `tender.tenderers` o `bids.details`) y método (`tender.procurementMethodDetails`). Q3 y Q5.
- **Regla v1:** procedimiento competitivo (todos menos la contratación directa) con exactamente un postor.
- **Agregado por entidad:** porcentaje de procesos con oferta única. Si es atípico frente a entidades similares, se muestra en el panel.
- **Qué revisar:** requisitos de calificación restrictivos, plazos, difusión de la convocatoria y especificaciones técnicas que favorezcan a un proveedor.
- **Qué no significa:** en mercados pequeños o con bienes muy especializados puede haber un solo proveedor capaz.
- **Spike:** no hay `bids` y `tender.numberOfTenderers` cuenta participantes registrados. Un solo participante implica a lo sumo una oferta, así que la señal no da falsos positivos de oferta única, pero no ve los procesos con varios registrados y una sola oferta. En la muestra de La Libertad de `2026.jsonl.gz`, Cardinal R018 marca los mismos 57 procesos que nuestra consulta con su regla, pero no ve las licitaciones y concursos abreviados porque no traen `tender.procurementMethod`.
- **Implementación (S01@1):** `uv run pipeline signals`.
  - **Métodos competitivos:** salen de la tabla de métodos de `senales.toml`, por nombre de `procurementMethodDetails`. La Contratación Internacional, el Régimen Especial y los convenios se tratan como no competitivos hasta que el equipo decida.
  - **Procesos que no se evalúan, y se cuentan:** los de métodos sin clasificar, los de estados excluidos (`CANCELADO`), los que no tienen comprador y los que no tienen dato de postores.
  - **Comparación:** `proporcion_referencia` es la parte del grupo con 2 o más postores, y `percentil_del_caso`, la parte con 1.
  - **La Libertad 2025–2026:** 69 señales (35 licitaciones públicas abreviadas, 24 subastas inversas, 7 concursos abreviados y 3 de otros métodos). Además, 504 procesos no se evaluaron por falta de dato de postores y 46 por estar cancelados.
- **Decisión pendiente:** 33 de esas 69 señales son de procesos que terminaron desiertos. Hay que decidir si S01 se limita a procesos con adjudicación, lo que dejaría 36.
- **Contraste con Cardinal (`uv run pipeline cardinal`):** R018 se ejecutó sobre los 5 036 procesos, con `tender.procurementMethod` completado desde la tabla de métodos. Marca los mismos 69 procesos que S01 (100 % de coincidencia) y 2 más, que son procesos cancelados que S01 no evalúa. El informe queda en `data/derived/senales/contraste-cardinal.json`.

### S02 · Plazo corto para presentar ofertas

- **Pregunta:** ¿hubo tiempo razonable para preparar ofertas?
- **Datos:** `tender.tenderPeriod.startDate` y `endDate`, y el método. Q2.
- **Regla v1:** la duración en días calendario está por debajo del percentil 10 de su grupo de comparación. El percentil es configurable. Si se verifica el mínimo legal de cada método en el reglamento vigente, se muestra como referencia.
- **Qué revisar:** si hubo prórrogas, si el plazo cumple la norma y cuántos postores participaron.
- **Qué no significa:** procesos simples o situaciones de urgencia pueden justificar plazos cortos.
- **Spike:** con esta fuente la regla no se puede calcular. `tender.tenderPeriod` trae como inicio y fin la fecha de la convocatoria en el 99,99 % de los procesos, y Cardinal R003 marca por eso a casi todos. Decisión pendiente: desactivar S02 o redefinirla con el plazo de consultas (`tender.enquiryPeriod`).
- **Implementación (S02@1):** la regla está programada y probada con datos sintéticos.
  - **Parámetros:** el percentil (`percentil`, 10) y las columnas del plazo (`plazo_inicio` y `plazo_fin`) se configuran en `senales.toml`. El grupo es por método y año, con respaldo nacional.
  - **Estado actual:** sale con `activa = false` y su motivo en el manifiesto, porque la fuente no trae el plazo de presentación.
  - **Para usar el plazo de consultas:** cambiar las columnas a `fecha_inicio_consultas` y `fecha_fin_consultas`, activarla, subir su versión y actualizar esta ficha.

### S03 · Proveedor recurrente atípico en una entidad

- **Pregunta:** ¿un proveedor concentra una parte inusual de las compras de la entidad?
- **Datos:** `buyer.id`, `awards.suppliers`, `awards.value` y fechas.
- **Regla v1:** en una ventana de 12 meses, la participación del proveedor en el monto adjudicado por la entidad (o en el número de adjudicaciones) es atípica frente a los demás proveedores de esa entidad, y además tiene al menos 3 adjudicaciones.
- **Se muestra en:** la ficha del proveedor, la ficha de cada proceso que ganó en esa entidad y el panel.
- **Qué revisar:** cómo se definieron los requerimientos, si se repiten los mismos evaluadores y si hay relación entre el proveedor y quienes deciden.
- **Qué no significa:** puede ser el único proveedor del rubro en la zona, tener un contrato marco o un buen desempeño comprobado.
- **Spike:** los consorcios tienen un código que no es RUC y que cambia en cada adjudicación, así que la señal solo puede seguir a proveedores con RUC.
- **Implementación (S03@1):**
  - **Ventana:** los 12 meses (`ventana_meses`) que terminan en la fecha de corte. Hoy va del 5 de octubre de 2025 al 4 de octubre de 2026.
  - **Medidas:** se calculan dos participaciones por proveedor en cada entidad, la de los procesos adjudicados y la del monto adjudicado en soles. Los montos en otra moneda se convierten con la tasa del proceso.
  - **Cuándo hay señal:** si una de las dos supera la valla de Tukey de los proveedores de esa entidad y el proveedor ganó al menos 3 procesos. `valor` es la participación que superó la valla y `ocids` lista los procesos ganados, que heredan la señal.
  - **No se evalúan, y se cuentan:** las adjudicaciones sin proveedor, sin fecha o fuera de la ventana, y las de procesos cancelados.
- **La Libertad 2025–2026:** 46 señales; 15 por monto y 31 por número de procesos.
- **Calibración pendiente:** cuando casi todos los proveedores de una entidad ganan un solo proceso, el rango intercuartílico es cero y la valla queda muy baja. Por eso hay señales con participaciones de 1 % a 3 %. Con una participación mínima quedarían 29 señales (5 %), 20 (10 %) u 8 (20 %). Se propone agregar `participacion_minima` a `senales.toml` si el equipo lo aprueba.

### S04 · Compras similares cercanas en el tiempo (posible fraccionamiento)

- **Pregunta:** ¿se dividió una necesidad en varios procesos para usar un método menos exigente?
- **Datos:** `buyer.id`, la clasificación de los ítems (primer nivel del código), la fecha de convocatoria, el método y los montos. Q4.
- **Regla v1:** la misma entidad hizo 2 o más procesos de la misma clase de ítem dentro de una ventana de 60 días (configurable), con métodos menos exigentes, y su suma supera el umbral del método superior. Los umbrales vigentes se toman de la normativa y se registran en la configuración.
- **Límite:** los datos no incluyen compras por debajo de 8 UIT, que es donde suele ocurrir el fraccionamiento clásico. Solo se detecta el que ocurre entre métodos que sí se publican.
- **Norma:** la normativa de contrataciones prohíbe el fraccionamiento. Antes de citar el artículo exacto de la Ley 32069 y su reglamento en la interfaz, hay que verificarlo.
- **Qué revisar:** el Plan Anual de Contrataciones, si la necesidad era previsible y si los requerimientos los hizo la misma área.
- **Qué no significa:** pudo haber necesidades nuevas que no eran previsibles, o compras programadas por etapas.
- **Spike:** los ítems traen CUBSO (16 dígitos) y UNSPSC (8 dígitos). El segmento UNSPSC (2 dígitos) es demasiado amplio; conviene la clase (6) o la familia (4), con el nivel como parámetro.
- **Implementación (S04@1):**
  - **Agrupación:** procesos de la misma entidad, la misma clase UNSPSC (`digitos_clasificacion` = 6), el mismo método y el mismo objeto, convocados dentro de `ventana_dias` (60) desde el primero del grupo.
  - **Cuándo hay señal:** con 2 o más procesos cuya suma supera el umbral del método superior. Se conservan solo los grupos que no están contenidos en otro mayor. `valor` es la suma en soles y `ocids` lista los procesos, que heredan la señal.
  - **Umbrales:** cada umbral se carga en `S04.umbrales` con su método, objeto, año, monto, norma y fecha de verificación. Un método sin umbral para ese objeto y año no se evalúa.
- **Estado:** desactivada hasta que se carguen los umbrales vigentes de la Ley 32069 y su reglamento, verificados con la norma. La regla está probada con umbrales de prueba (dentro y fuera de la ventana, y cambio de ventana con nueva versión).

### S05 · Uso atípico de contratación directa (opcional)

- **Pregunta:** ¿la entidad recurre a la contratación directa más que entidades similares?
- **Datos:** método por proceso y montos. Q5.
- **Regla v1:** la proporción de contratación directa de la entidad (por monto o por cantidad) es atípica frente a entidades del mismo tipo.
- **Qué revisar:** el supuesto legal invocado en cada caso.
- **Qué no significa:** hay supuestos legales válidos, como emergencias o proveedor único.

### S06 · Monto final mayor que el contratado (opcional)

- **Pregunta:** ¿el contrato terminó costando bastante más de lo pactado?
- **Datos:** el valor del contrato y el monto final de la extensión de culminación. Q6.
- **Regla v1:** el monto final es mayor o igual al contratado × 1,15 (configurable).
- **Qué revisar:** adicionales aprobados, su sustento y los plazos de aprobación.
- **Qué no significa:** los adicionales pueden ser legales y estar justificados.
- **Spike:** el monto final (`contracts[].implementation.finalValue`) está en el 9,1 % de los contratos de La Libertad 2025–2026, por debajo del 10 % mínimo, así que con la regla actual la señal se desactiva. Si se activa, hay que calibrar el factor 1,15: la razón final/contratado tiene mediana 1,11.

### S07 · Proveedor con sanción vigente adjudicado (fase 2)

- **Pregunta:** ¿se adjudicó a un proveedor inhabilitado o sancionado en esa fecha?
- **Fuente:** el registro de proveedores sancionados del OECE o del Tribunal. **Hay que confirmar que exista como dato abierto descargable.** Mientras tanto, la ficha del proveedor enlaza a la Ficha Única del Proveedor del OECE.

### S08 · Conformidad o pago sin sustento, o funciones incompatibles (datos sintéticos)

- **Pregunta:** ¿la misma persona solicitó, evaluó y dio conformidad, o hubo un pago sin conformidad registrada?
- **Datos:** un expediente interno **sintético**. Los datos abiertos no traen responsables internos ni pagos.
- **Uso:** demostrar en el caso práctico la parte de trazabilidad interna del desafío 2. La interfaz debe marcarlo claramente como "dato simulado".
- **Implementación (S08@1):**
  - **Expedientes:** `uv run pipeline signals` genera `expedientes-simulados.json` con una semilla fija (`semilla`). Son 8 expedientes (`cantidad_expedientes`) para procesos con contrato, o para los ocids de `S08.procesos`. Con la misma configuración salen siempre iguales.
  - **Variedad:** uno de cada tres repite a la misma persona en requerimiento, evaluación y conformidad; otro tiene un pago sin conformidad documentada.
  - **Cuándo hay señal:** si se cumple alguna de las dos condiciones. Todo lleva `simulado: true` y un proceso sin expediente no se evalúa.
  - **Resultado actual:** 6 señales simuladas.

## Plantilla de explicación

Cada señal se muestra con esta estructura ([diseño de la tarjeta](../diseno/sistema-de-diseno.md#tarjeta-de-señal)):

| Bloque | Ejemplo para S01 |
|---|---|
| Qué encontramos | Este proceso recibió **1 oferta**. |
| Con qué lo comparamos | En La Libertad, el 62 % de las adjudicaciones simplificadas de 2025 recibió 2 o más ofertas. *(Cifra ilustrativa.)* |
| Por qué importa | Con una sola oferta, la entidad no puede comparar precios ni calidad. Es un indicador internacional de baja competencia (OCP; Cardinal R018). |
| Qué revisar | Requisitos de calificación, plazo y difusión de la convocatoria, especificaciones técnicas. |
| Qué no significa | No prueba una irregularidad: hay mercados con pocos proveedores. |
| Datos usados | `tender.numberOfTenderers` · fuente OECE vía OCP (CC BY 4.0) · corte: 4 de octubre de 2026 · [ver en el SEACE] |

## Pruebas obligatorias por señal

- Fixtures sintéticos con un caso positivo, uno negativo y uno con datos faltantes o de mala calidad.
- Una muestra de 5 resultados reales verificada a mano contra el SEACE, con la verificación anotada en el PR.
- Si Cardinal calcula la misma señal, comparar ambos resultados y explicar las diferencias.
