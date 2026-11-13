# Spec Delta

## Purpose

Hacer que el producto sea transparente sobre su metodología, sus fuentes, sus licencias y sus límites, que reconozca a terceros y que nunca use un lenguaje que acuse a personas, empresas o entidades.

## ADDED Requirements

### Requirement: Página de metodología
La aplicación SHALL tener una página de metodología con el catálogo de señales (código, nombre, categoría, regla resumida y referencia), la fórmula y los pesos de la prioridad, los referentes con sus licencias, la fuente y los límites de los datos, la versión de las reglas y la fecha de corte.

#### Scenario: Consulta de la metodología
- **WHEN** la persona abre "Metodología"
- **THEN** ve las señales activas del manifiesto con su regla y su referencia
- **AND** ve que la prioridad es una suma de pesos y no una probabilidad

### Requirement: Atribución en todas las pantallas
El pie de todas las pantallas SHALL mostrar el texto de atribución del manifiesto (fuente y licencia CC BY 4.0, con aviso de que los datos fueron transformados) y un enlace a la metodología.

#### Scenario: Pie en la ficha
- **WHEN** se abre cualquier ficha de proceso
- **THEN** el pie muestra la atribución de los datos y el enlace a la metodología

### Requirement: Reconocimiento de terceros
La página de metodología SHALL listar el software y las metodologías de terceros que usa el producto, con su licencia: al menos Cardinal (MIT), la guía de banderas rojas de OCP, los principios de Arachne como inspiración, y las librerías principales de la web y del pipeline.

#### Scenario: Cardinal reconocido
- **WHEN** la persona revisa la sección de referentes y licencias
- **THEN** encuentra Cardinal con su licencia MIT y la indicación de que se usa como dependencia

### Requirement: Etiqueta de datos simulados
La interfaz SHALL mostrar la etiqueta "Dato simulado" junto a todo dato, etapa o señal que tenga `simulado: true`, en cualquier pantalla y en el reporte.

#### Scenario: Reporte con S08
- **WHEN** se genera el reporte de un proceso que tiene S08
- **THEN** la señal S08 aparece con la etiqueta "Dato simulado" también en el reporte

### Requirement: Vocabulario no acusatorio verificado
Una prueba automática SHALL revisar los textos de la interfaz y SHALL fallar si encuentra "corrupción", "corrupto", "fraude", "irregular", "sospechoso" o "culpable" fuera de la lista de frases permitidas de la metodología, que las usa para explicar lo que una señal no significa.

#### Scenario: Palabra prohibida en un componente
- **WHEN** un componente incluye el texto "posible fraude"
- **THEN** la prueba de vocabulario falla y nombra el archivo y la palabra

#### Scenario: Frase permitida en la metodología
- **WHEN** la metodología dice "una señal no prueba corrupción"
- **THEN** la prueba de vocabulario pasa, porque la frase está en la lista permitida

### Requirement: Sin analítica ni datos de usuarios
La aplicación SHALL NOT incluir herramientas de analítica ni rastreadores de terceros, y SHALL NOT recolectar datos personales de quienes la usan. Las revisiones solo se guardan en el navegador de cada persona.

#### Scenario: Revisión de la red
- **WHEN** se recorre la demo con las herramientas de red del navegador abiertas
- **THEN** no hay solicitudes a servicios de analítica ni a dominios que no sean de la propia aplicación, salvo los enlaces que la persona abre a fuentes oficiales
