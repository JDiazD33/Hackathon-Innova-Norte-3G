# Spec Delta

## Purpose

Explicar cada señal en lenguaje claro para que una persona que no programa entienda qué se encontró, con qué se comparó, por qué importa, qué revisar y qué no significa, antes de tomar cualquier decisión.

## ADDED Requirements

### Requirement: Seis bloques de explicación
Cada tarjeta de señal SHALL mostrar, en este orden: "Qué encontramos", "Con qué lo comparamos", "Por qué importa", "Qué revisar", "Qué no significa" y "Datos usados".

#### Scenario: Tarjeta de S01
- **WHEN** se muestra la tarjeta de una señal S01
- **THEN** la tarjeta contiene los seis bloques en el orden indicado
- **AND** "Qué encontramos" dice cuántas ofertas recibió el proceso

### Requirement: Textos armados con los valores de la señal
Los textos de la explicación SHALL armarse con los valores de cada señal (valor, umbral, grupo de comparación y entradas), nunca con cifras de ejemplo. Si un valor de la comparación es nulo, SHALL omitirse la frase que lo usa.

#### Scenario: Comparación sin valla superior
- **WHEN** una señal trae `valla_superior` nulo
- **THEN** la explicación no muestra ninguna frase que mencione la valla superior
- **AND** el texto no contiene "null", "undefined" ni "NaN"

### Requirement: Comparación visual con resumen en texto
Cuando la señal tenga estadísticas de comparación, la tarjeta SHALL mostrar un gráfico pequeño con la distribución del grupo y un marcador del caso, acompañado de un resumen en texto que exprese lo mismo.

#### Scenario: Plazo corto
- **WHEN** se muestra una señal S02 cuyo caso está en el percentil 4 de su grupo
- **THEN** el gráfico marca la posición del caso
- **AND** el texto dice que el plazo está entre el 5 % más corto de procesos comparables

### Requirement: Referencia internacional
Cada tarjeta SHALL indicar la referencia metodológica de la señal (código de Cardinal o nombre del indicador en la guía de OCP, cuando exista) y enlazar a la página de metodología.

#### Scenario: Señal con equivalente en Cardinal
- **WHEN** se muestra la tarjeta de S01
- **THEN** la tarjeta indica "Cardinal R018 · guía de OCP" con un enlace a la metodología

### Requirement: Notas de calidad de datos
Si el resultado de la señal trae notas de calidad o exclusiones aplicadas, la tarjeta SHALL mostrarlas en una nota visible.

#### Scenario: Señal con corrección de datos
- **WHEN** la señal trae la nota "postor duplicado corregido"
- **THEN** la tarjeta muestra esa nota en el bloque de calidad de datos

### Requirement: Enlace a la fuente oficial
La tarjeta SHALL enlazar al proceso en el SEACE cuando el paquete traiga esa URL. Si no la trae, SHALL indicar que la fuente no publica el enlace.

#### Scenario: Sin URL oficial
- **WHEN** el proceso no trae `url_seace`
- **THEN** el bloque "Datos usados" indica que la fuente no publica un enlace para este proceso

### Requirement: Desglose visible de la prioridad
Cada vez que se muestre una prioridad, SHALL poder verse cómo se calculó: qué señales la componen y cuánto pesa cada una. El desglose SHALL estar disponible con teclado y no solo al pasar el mouse.

#### Scenario: Desglose con teclado
- **WHEN** la persona llega con la tecla Tab al nivel de prioridad de un proceso
- **THEN** puede leer el desglose, por ejemplo "Alta · S01 (3) + S03 (3) = 6"

### Requirement: Señales sobre datos simulados
La tarjeta de una señal con `simulado: true` SHALL mostrar la etiqueta "Dato simulado" en su encabezado.

#### Scenario: Tarjeta de S08
- **WHEN** se muestra una señal S08
- **THEN** su encabezado lleva la etiqueta "Dato simulado"

### Requirement: Colores de las señales
Las tarjetas y los chips de señales SHALL usar los colores de prioridad (ámbar y neutros) del sistema de diseño. SHALL NOT usar el rojo, que está reservado a la decisión humana "requiere atención".

#### Scenario: Señal de prioridad alta
- **WHEN** se muestra una señal en un proceso de prioridad alta
- **THEN** la tarjeta usa el estilo ámbar de prioridad alta y ningún elemento rojo
