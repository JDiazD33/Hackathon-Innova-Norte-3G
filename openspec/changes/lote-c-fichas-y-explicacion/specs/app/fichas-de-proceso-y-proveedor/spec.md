# Spec Delta

## Purpose

Mostrar en una sola vista todo lo que una persona necesita para revisar un proceso o un proveedor: datos oficiales, línea de tiempo, señales explicadas, documentos e historial de revisión, sin revelar identidades en el enlace público.

## ADDED Requirements

### Requirement: Resumen del proceso
La ficha del proceso SHALL mostrar la descripción, la entidad, el método, el objeto, los montos (referencial, adjudicado y final), el estado, el número de postores y el enlace al proceso en el SEACE. Cada dato nulo SHALL mostrarse como "Sin dato".

#### Scenario: Proceso con datos faltantes
- **WHEN** se abre un proceso cuyo monto final es nulo
- **THEN** el resumen muestra "Sin dato" en el monto final y el resto de datos con normalidad

### Requirement: Línea de tiempo del proceso
La ficha SHALL mostrar en orden cronológico las fechas oficiales disponibles (convocatoria, presentación de ofertas, adjudicación, contrato y culminación). Si existen etapas internas simuladas, SHALL mostrarlas con un estilo distinto y la etiqueta "Dato simulado".

#### Scenario: Proceso con expediente simulado
- **WHEN** se abre un proceso que tiene un expediente interno simulado
- **THEN** la línea de tiempo combina las fechas oficiales con las etapas simuladas
- **AND** cada etapa simulada lleva la etiqueta "Dato simulado"

### Requirement: Señales del proceso
La ficha SHALL mostrar una tarjeta por cada señal del proceso, ordenadas de mayor a menor peso, y el nivel de prioridad con su desglose.

#### Scenario: Proceso con dos señales
- **WHEN** se abre un proceso con S01 (peso 3) y S02 (peso 2)
- **THEN** aparece primero la tarjeta de S01 y después la de S02
- **AND** la prioridad se muestra como "Alta · S01 + S02 = 5"

### Requirement: Documentos oficiales
La ficha SHALL listar los documentos oficiales del proceso con su tipo, su título y un enlace a la fuente oficial. Si no hay documentos, SHALL decirlo.

#### Scenario: Proceso sin documentos
- **WHEN** un proceso no trae documentos
- **THEN** la sección muestra "La fuente no publica documentos para este proceso"

### Requirement: Historial y acción de revisión en la ficha
La ficha SHALL mostrar el historial de revisión del proceso que entrega el almacén de revisiones y el botón "Registrar revisión" solo para los roles que pueden decidir.

#### Scenario: Rol auditor
- **WHEN** el rol seleccionado es auditor
- **THEN** la ficha muestra el historial, pero no el botón "Registrar revisión"

### Requirement: Proceso inexistente
Si se pide una ficha con un ocid que no existe en el paquete, la aplicación SHALL mostrar "No encontramos este proceso" y un enlace a la bandeja, sin errores técnicos a la vista.

#### Scenario: Ocid inventado
- **WHEN** se abre `/procesos/ocid-que-no-existe`
- **THEN** aparece el mensaje "No encontramos este proceso" con un enlace a la bandeja

### Requirement: Ficha del proveedor
La ficha del proveedor SHALL mostrar su participación en la entidad (adjudicaciones, monto y porcentaje), la lista de procesos que ganó, con enlaces a sus fichas, y la tarjeta de S03 si corresponde.

#### Scenario: Proveedor con S03
- **WHEN** se abre un proveedor que tiene la señal S03 en la entidad seleccionada
- **THEN** la ficha muestra su participación, sus procesos ganados y la tarjeta de S03

### Requirement: Identidad del proveedor según el modo
En modo público, la ficha del proveedor SHALL mostrar solo su seudónimo, sin nombre, RUC ni enlace a la Ficha Única del Proveedor. En modo local, SHALL mostrar el nombre (salvo personas naturales), el RUC y ese enlace.

#### Scenario: Modo público
- **WHEN** el manifiesto indica el modo `publico`
- **THEN** la ficha muestra "Proveedor 0137" y ningún dato que lo identifique

#### Scenario: Persona natural en modo local
- **WHEN** el manifiesto indica el modo `local` y el proveedor es persona natural
- **THEN** la ficha muestra su seudónimo en lugar de su nombre
