# Spec Delta

## Purpose

Calcular de forma reproducible las señales que ameritan revisión en las contrataciones públicas y ordenar los procesos con una prioridad de revisión transparente, sin emitir juicios de culpabilidad.

## ADDED Requirements

### Requirement: Señal de oferta única (S01)
El sistema SHALL marcar con S01 cada proceso de un método competitivo que tenga exactamente un postor. La contratación directa SHALL quedar fuera de esta señal.

#### Scenario: Adjudicación simplificada con un postor
- **WHEN** una adjudicación simplificada registra un solo postor
- **THEN** el proceso tiene la señal S01 con valor 1 y unidad "postores"

#### Scenario: Contratación directa
- **WHEN** una contratación directa registra un solo postor
- **THEN** el proceso no tiene la señal S01

#### Scenario: Sin dato de postores
- **WHEN** un proceso no informa el número de postores
- **THEN** S01 no se evalúa para ese proceso
- **AND** el manifiesto suma una exclusión de S01 con el motivo "sin dato de postores"

### Requirement: Señal de plazo corto (S02)
El sistema SHALL marcar con S02 un proceso cuyo plazo de presentación de ofertas, medido en días calendario, sea menor que el percentil configurado (10 por defecto) de su grupo de comparación: el mismo método en el mismo año.

#### Scenario: Plazo bajo el percentil
- **WHEN** el percentil 10 de las adjudicaciones simplificadas de 2025 es de 5 días y un proceso de ese grupo tuvo 2 días
- **THEN** el proceso tiene la señal S02 con valor 2 y un umbral de 5 días

#### Scenario: Grupo regional pequeño
- **WHEN** el grupo regional de comparación tiene menos de 30 procesos
- **THEN** la comparación se hace con el grupo nacional del mismo método y año
- **AND** el resultado indica el ámbito "nacional"

### Requirement: Señal de proveedor recurrente atípico (S03)
El sistema SHALL marcar con S03 la combinación de proveedor y entidad cuando, en una ventana de 12 meses, la participación del proveedor en el monto o en el número de adjudicaciones de la entidad supere la valla superior de Tukey de los proveedores de esa entidad, y el proveedor tenga al menos 3 adjudicaciones.

#### Scenario: Proveedor con participación atípica
- **WHEN** un proveedor ganó 9 de los 12 procesos de una entidad en 12 meses y esa participación supera la valla superior
- **THEN** existe una señal S03 para ese proveedor en esa entidad, que lista los ocids de los procesos que ganó
- **AND** cada uno de esos procesos incluye S03 en su prioridad

#### Scenario: Pocas adjudicaciones
- **WHEN** un proveedor tiene 2 adjudicaciones, aunque su participación sea atípica
- **THEN** no se genera S03

### Requirement: Señal de compras similares cercanas (S04)
El sistema SHALL marcar con S04 un grupo de 2 o más procesos de la misma entidad y la misma clase de ítem, convocados dentro de la ventana configurada (60 días por defecto) con métodos menos exigentes, cuya suma supere el umbral configurado del método superior.

#### Scenario: Dos compras que juntas superan el umbral
- **WHEN** una entidad convoca dos procesos de la misma clase de ítem con 20 días de diferencia y la suma de sus montos supera el umbral del método superior
- **THEN** existe una señal S04 que lista ambos ocids, la suma y el umbral
- **AND** ambos procesos incluyen S04 en su prioridad

#### Scenario: Compras fuera de la ventana
- **WHEN** los dos procesos están separados por 120 días
- **THEN** no se genera S04

### Requirement: Señal de expediente interno (S08) con datos simulados
El sistema SHALL calcular S08 solo sobre expedientes internos simulados. La señal se activa cuando la misma persona solicita, evalúa y da conformidad, o cuando hay un pago sin conformidad documentada. Todo resultado de S08 SHALL llevar `simulado: true`.

#### Scenario: Funciones concentradas en una persona
- **WHEN** un expediente simulado registra a la misma persona en el requerimiento, la evaluación y la conformidad
- **THEN** existe una señal S08 para ese proceso, con `simulado: true`

#### Scenario: Proceso sin expediente simulado
- **WHEN** un proceso real no tiene expediente simulado
- **THEN** no se evalúa S08 para ese proceso

### Requirement: Señales opcionales según la cobertura
El sistema SHALL calcular S05 y S06 solo si los datos alcanzan la cobertura mínima configurada para cada una. Si no la alcanzan, SHALL desactivarlas e informar el motivo en el manifiesto.

#### Scenario: Cobertura insuficiente para S06
- **WHEN** menos del 10 % de los contratos tiene monto final
- **THEN** S06 no se calcula
- **AND** el manifiesto la lista como desactivada, con ese motivo

### Requirement: Parámetros configurables y versionados
Los umbrales, ventanas, percentiles, pesos y cortes de prioridad SHALL definirse en un archivo de configuración versionado. Cada resultado SHALL registrar la versión de la regla que lo produjo.

#### Scenario: Cambio de ventana
- **WHEN** se cambia en la configuración la ventana de S04 de 60 a 30 días y se recalcula
- **THEN** los resultados de S04 cambian sin modificar el código
- **AND** los nuevos resultados registran la nueva versión de la regla

#### Scenario: Parámetro faltante
- **WHEN** la configuración no define el percentil de S02
- **THEN** el cálculo se detiene con un error que nombra el parámetro faltante

### Requirement: Resultados reproducibles
Cada resultado de señal SHALL guardar el código, el objeto evaluado, el valor, el umbral, el grupo de comparación con sus estadísticas, las entradas usadas y la versión de la regla.

#### Scenario: Recalcular con los mismos insumos
- **WHEN** se recalculan las señales con los mismos datos y la misma configuración
- **THEN** los resultados son idénticos a los anteriores

### Requirement: Contraste con Cardinal
Cuando Cardinal pueda calcular un indicador equivalente (R018 para S01 y R003 para S02), el sistema SHALL ejecutarlo como dependencia e informar el porcentaje de coincidencia y los casos que difieren.

#### Scenario: Diferencias con Cardinal
- **WHEN** S01 marca 120 procesos y Cardinal R018 marca 115 de ellos
- **THEN** el informe de contraste muestra 115 coincidencias y lista los 5 casos que difieren

#### Scenario: Datos insuficientes para Cardinal
- **WHEN** los datos no tienen los campos que Cardinal necesita para un indicador
- **THEN** el informe indica que el contraste no fue posible y explica por qué

### Requirement: Prioridad de revisión transparente
El sistema SHALL calcular, para cada proceso con señales, un puntaje igual a la suma de los pesos de sus señales, y SHALL asignar el nivel alta (5 o más), media (3 o 4) o baja (1 o 2) según los cortes configurados, conservando el desglose. SHALL NOT calcular probabilidades de corrupción.

#### Scenario: Dos señales núcleo
- **WHEN** un proceso tiene S01 (peso 3) y S03 (peso 3)
- **THEN** su prioridad es alta, con puntaje 6 y desglose S01 + S03

#### Scenario: Proceso sin señales
- **WHEN** un proceso no tiene señales
- **THEN** su prioridad es nula y el proceso no aparece en la bandeja
