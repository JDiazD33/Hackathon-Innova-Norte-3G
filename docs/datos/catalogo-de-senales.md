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

## Método común

- **"Atípico"** significa que el valor supera la valla superior de Tukey (Q3 + 1,5 × RIC) de su grupo de comparación. Es el mismo enfoque de cuartiles y vallas que reporta Cardinal. El factor 1,5 es configurable.
- **Grupo de comparación:** procesos del mismo método de contratación, del mismo año y, cuando haya suficientes casos, del mismo tipo de objeto (bienes, servicios u obras). Si un grupo tiene menos de 30 casos, se amplía al nivel nacional y la explicación lo dice.
- **Exclusiones:** procesos cancelados, sin identificador del comprador o del proveedor, o con montos en otra moneda sin tipo de cambio. Cada exclusión se cuenta y se informa.
- **Trazabilidad del cálculo:** cada resultado guarda la versión de la regla, los valores de entrada, el grupo de comparación y sus estadísticas. Así, cualquiera puede reproducirlo.

## Prioridad de revisión

La prioridad ordena la bandeja. **No es una probabilidad de corrupción.**

- **Fórmula:** puntaje del proceso = suma de los pesos de sus señales. Pesos iniciales: S01 = 3, S02 = 2, S03 = 3, S04 = 3, S06 = 2, S07 = 3, S08 = 3. S05 se muestra en el panel de la entidad y no suma al proceso.
- **Niveles:** alta (5 o más), media (3 o 4) y baja (1 o 2).
- **Configuración:** los pesos y los cortes están en un archivo versionado.
- **Transparencia:** la interfaz siempre muestra el desglose ("alta: S01 + S03 = 6").

## Fichas de las señales

### S01 · Oferta única

- **Pregunta:** ¿hubo competencia real?
- **Datos:** número de postores (`tender.numberOfTenderers`, `tender.tenderers` o `bids.details`) y método (`tender.procurementMethodDetails`). Q3 y Q5.
- **Regla v1:** procedimiento competitivo (todos menos la contratación directa) con exactamente un postor.
- **Agregado por entidad:** porcentaje de procesos con oferta única. Si es atípico frente a entidades similares, se muestra en el panel.
- **Qué revisar:** requisitos de calificación restrictivos, plazos, difusión de la convocatoria y especificaciones técnicas que favorezcan a un proveedor.
- **Qué no significa:** en mercados pequeños o con bienes muy especializados puede haber un solo proveedor capaz.

### S02 · Plazo corto para presentar ofertas

- **Pregunta:** ¿hubo tiempo razonable para preparar ofertas?
- **Datos:** `tender.tenderPeriod.startDate` y `endDate`, y el método. Q2.
- **Regla v1:** la duración en días calendario está por debajo del percentil 10 de su grupo de comparación. El percentil es configurable. Si se verifica el mínimo legal de cada método en el reglamento vigente, se muestra como referencia.
- **Qué revisar:** si hubo prórrogas, si el plazo cumple la norma y cuántos postores participaron.
- **Qué no significa:** procesos simples o situaciones de urgencia pueden justificar plazos cortos.

### S03 · Proveedor recurrente atípico en una entidad

- **Pregunta:** ¿un proveedor concentra una parte inusual de las compras de la entidad?
- **Datos:** `buyer.id`, `awards.suppliers`, `awards.value` y fechas.
- **Regla v1:** en una ventana de 12 meses, la participación del proveedor en el monto adjudicado por la entidad (o en el número de adjudicaciones) es atípica frente a los demás proveedores de esa entidad, y además tiene al menos 3 adjudicaciones.
- **Se muestra en:** la ficha del proveedor, la ficha de cada proceso que ganó en esa entidad y el panel.
- **Qué revisar:** cómo se definieron los requerimientos, si se repiten los mismos evaluadores y si hay relación entre el proveedor y quienes deciden.
- **Qué no significa:** puede ser el único proveedor del rubro en la zona, tener un contrato marco o un buen desempeño comprobado.

### S04 · Compras similares cercanas en el tiempo (posible fraccionamiento)

- **Pregunta:** ¿se dividió una necesidad en varios procesos para usar un método menos exigente?
- **Datos:** `buyer.id`, la clasificación de los ítems (primer nivel del código), la fecha de convocatoria, el método y los montos. Q4.
- **Regla v1:** la misma entidad hizo 2 o más procesos de la misma clase de ítem dentro de una ventana de 60 días (configurable), con métodos menos exigentes, y su suma supera el umbral del método superior. Los umbrales vigentes se toman de la normativa y se registran en la configuración.
- **Límite:** los datos no incluyen compras por debajo de 8 UIT, que es donde suele ocurrir el fraccionamiento clásico. Solo se detecta el que ocurre entre métodos que sí se publican.
- **Norma:** la normativa de contrataciones prohíbe el fraccionamiento. Antes de citar el artículo exacto de la Ley 32069 y su reglamento en la interfaz, hay que verificarlo.
- **Qué revisar:** el Plan Anual de Contrataciones, si la necesidad era previsible y si los requerimientos los hizo la misma área.
- **Qué no significa:** pudo haber necesidades nuevas que no eran previsibles, o compras programadas por etapas.

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

### S07 · Proveedor con sanción vigente adjudicado (fase 2)

- **Pregunta:** ¿se adjudicó a un proveedor inhabilitado o sancionado en esa fecha?
- **Fuente:** el registro de proveedores sancionados del OECE o del Tribunal. **Hay que confirmar que exista como dato abierto descargable.** Mientras tanto, la ficha del proveedor enlaza a la Ficha Única del Proveedor del OECE.

### S08 · Conformidad o pago sin sustento, o funciones incompatibles (datos sintéticos)

- **Pregunta:** ¿la misma persona solicitó, evaluó y dio conformidad, o hubo un pago sin conformidad registrada?
- **Datos:** un expediente interno **sintético**. Los datos abiertos no traen responsables internos ni pagos.
- **Uso:** demostrar en el caso práctico la parte de trazabilidad interna del desafío 2. La interfaz debe marcarlo claramente como "dato simulado".

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
