# Spec Delta

## Purpose

Registrar la revisión humana de cada caso (quién decidió qué, cuándo y por qué) y permitir asignar casos y generar un reporte de trazabilidad, porque ninguna señal genera una decisión automática.

## ADDED Requirements

### Requirement: Roles simulados
La aplicación SHALL ofrecer un selector con tres roles (analista de integridad, jefatura y auditor), SHALL indicar que los roles son simulados y SHALL recordar el rol elegido en el navegador.

#### Scenario: Cambio de rol
- **WHEN** la persona elige "Jefatura" y recarga la página
- **THEN** el rol sigue siendo "Jefatura"
- **AND** junto al selector se lee que los roles son simulados

### Requirement: Permisos por rol
Los roles analista de integridad y jefatura SHALL poder registrar decisiones y asignar casos. El rol auditor SHALL tener acceso de solo lectura.

#### Scenario: Auditor
- **WHEN** el rol seleccionado es auditor
- **THEN** la aplicación no ofrece registrar decisiones ni asignar casos en ninguna pantalla

### Requirement: Registrar una decisión
Una persona con permiso SHALL poder registrar para un proceso uno de estos estados: "en revisión", "justificada" o "requiere atención". El comentario SHALL ser obligatorio para "justificada" y "requiere atención". El rol y la fecha y hora se registran automáticamente.

#### Scenario: Requiere atención sin comentario
- **WHEN** la persona elige "requiere atención" y deja el comentario vacío
- **THEN** la decisión no se guarda y se muestra el mensaje "Explica por qué requiere atención"

#### Scenario: Decisión justificada
- **WHEN** la persona elige "justificada" y escribe un comentario
- **THEN** la decisión se guarda con el rol, la fecha y hora y el comentario

### Requirement: Asignación de casos
Una persona con permiso SHALL poder asignar un caso a otro rol con una nota. El caso SHALL aparecer en "Asignados a mí" del rol destinatario.

#### Scenario: Asignar a jefatura
- **WHEN** la analista asigna un proceso a jefatura con una nota
- **THEN** al cambiar al rol jefatura, el proceso aparece en "Asignados a mí" con la nota

### Requirement: Vista de revisión
La vista "Revisión" SHALL mostrar en pestañas los casos asignados al rol actual, los asignados por el rol actual y los ya decididos, con enlaces a cada ficha.

#### Scenario: Casos decididos
- **WHEN** existen dos procesos con decisión "justificada"
- **THEN** ambos aparecen en la pestaña de casos decididos con su estado y fecha

### Requirement: Historial sin edición
Cada decisión o asignación SHALL agregarse al historial del proceso sin modificar ni borrar las entradas anteriores. El estado vigente SHALL ser el de la última decisión.

#### Scenario: Cambio de decisión
- **WHEN** un proceso pasa de "en revisión" a "justificada"
- **THEN** el historial muestra ambas entradas en orden
- **AND** el estado vigente es "justificada"
- **AND** la interfaz no ofrece editar ni borrar entradas anteriores

### Requirement: Rojo solo para la decisión humana
La interfaz SHALL usar el color rojo únicamente para el estado "requiere atención" decidido por una persona, y SHALL acompañarlo siempre con un ícono de bandera y el texto del estado.

#### Scenario: Estado requiere atención
- **WHEN** un proceso tiene la decisión "requiere atención"
- **THEN** su estado se muestra en rojo, con el ícono de bandera y el texto "Requiere atención"

### Requirement: Persistencia local de las revisiones
Las revisiones SHALL conservarse en el navegador entre recargas. Si el almacenamiento del navegador no está disponible, la aplicación SHALL avisar que las revisiones se perderán al cerrar la pestaña y SHALL seguir funcionando en memoria.

#### Scenario: Recarga de la página
- **WHEN** se registra una decisión y se recarga la página
- **THEN** la decisión sigue en el historial

#### Scenario: Almacenamiento bloqueado
- **WHEN** el navegador bloquea el almacenamiento local
- **THEN** aparece el aviso y las decisiones se pueden seguir registrando durante la sesión

### Requirement: Exportar, importar y reiniciar
La aplicación SHALL permitir exportar las revisiones a un archivo, importarlas sin duplicar entradas y reiniciar la demostración borrando las revisiones después de pedir confirmación.

#### Scenario: Importar dos veces el mismo archivo
- **WHEN** se importa el mismo archivo de revisiones dos veces
- **THEN** el historial no tiene entradas duplicadas

#### Scenario: Reinicio de la demostración
- **WHEN** la persona elige "Reiniciar demostración" y confirma
- **THEN** todas las revisiones se borran y la bandeja muestra "Sin revisar" en todos los procesos

### Requirement: Reporte de trazabilidad
La aplicación SHALL generar un reporte imprimible por proceso con sus datos, sus señales y explicaciones, el historial de revisión (rol, fecha, estado y comentario), la fuente con su atribución, la versión de las reglas y la fecha de generación. Al imprimir, SHALL ocultar la navegación.

#### Scenario: Guardar como PDF
- **WHEN** la persona abre el reporte de un proceso y elige imprimir
- **THEN** la vista previa muestra solo el contenido del reporte, sin barra lateral ni cabecera
