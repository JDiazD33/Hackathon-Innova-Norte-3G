# Spec Delta

## Purpose

Dar a la persona usuaria una entrada clara al producto: una estructura de navegación común, un panel de la entidad y una bandeja priorizada que convierten miles de procesos en una lista corta de casos que ameritan revisión.

## ADDED Requirements

### Requirement: Estructura común de navegación
La aplicación SHALL mostrar en todas las pantallas una barra lateral (Panel, Señales, Revisión y Metodología), una cabecera con selector de entidad, buscador, selector de rol y fecha de corte, y un pie con la atribución de los datos.

#### Scenario: Navegación entre secciones
- **WHEN** la persona elige "Señales" en la barra lateral
- **THEN** se abre la bandeja de la entidad seleccionada
- **AND** la cabecera y el pie siguen visibles

### Requirement: Fecha de corte y modo visibles
La cabecera SHALL mostrar la fecha de corte de los datos tomada del manifiesto. Cuando el manifiesto indique el modo `publico`, SHALL mostrar el aviso "Modo demostración", que explica que los proveedores aparecen con seudónimos.

#### Scenario: Paquete público
- **WHEN** la aplicación carga un paquete con `"modo": "publico"` y fecha de corte 2026-10-04
- **THEN** la cabecera muestra "Datos al 4 oct 2026" y el aviso "Modo demostración"

### Requirement: Panel de la entidad
El panel SHALL mostrar, para la entidad seleccionada: número de procesos, monto total, procesos con señales, revisiones pendientes, señales por categoría, tendencia mensual y los cinco proveedores con mayor participación. Cada gráfico SHALL tener un resumen en texto.

#### Scenario: Cambio de entidad
- **WHEN** la persona cambia la entidad en la cabecera
- **THEN** todas las cifras y los gráficos del panel corresponden a la nueva entidad

### Requirement: Bandeja priorizada
La bandeja SHALL listar solo los procesos con señales, ordenados por puntaje de prioridad descendente y, en caso de empate, por fecha de convocatoria más reciente. Cada fila SHALL mostrar la prioridad con ícono y texto, las señales y el estado de revisión.

#### Scenario: Orden por prioridad
- **WHEN** la entidad tiene procesos con puntajes 6, 3 y 6
- **THEN** la bandeja muestra primero los dos de puntaje 6, del más reciente al más antiguo, y después el de puntaje 3

### Requirement: Filtros de la bandeja
La bandeja SHALL permitir filtrar por prioridad, categoría de señal, método de contratación, rango de fechas y estado de revisión, y SHALL ofrecer un estado vacío con la opción "Limpiar filtros".

#### Scenario: Filtro por prioridad alta
- **WHEN** la persona filtra por prioridad alta
- **THEN** solo quedan los procesos con nivel alta

#### Scenario: Filtros sin resultados
- **WHEN** la combinación de filtros no deja procesos
- **THEN** la bandeja muestra un mensaje claro y el botón "Limpiar filtros", que restablece la lista completa

### Requirement: Estado de revisión en la bandeja
La bandeja SHALL mostrar para cada proceso el estado de revisión vigente que informa el almacén de revisiones, y SHALL mostrar "Sin revisar" cuando no exista ninguna decisión.

#### Scenario: Proceso decidido
- **WHEN** una persona registró "justificada" para un proceso
- **THEN** la fila de ese proceso muestra el estado "Justificada" con su ícono y su texto

### Requirement: Búsqueda global
El buscador SHALL encontrar procesos por palabras de su descripción o por su ocid, y proveedores por su seudónimo (o por su nombre, en modo local). SHALL abrirse con Ctrl o Cmd + K y llevar a la ficha correspondiente.

#### Scenario: Búsqueda por descripción
- **WHEN** la persona escribe "laboratorio" en el buscador
- **THEN** aparecen los procesos cuya descripción contiene esa palabra
- **AND** al elegir uno se abre su ficha

### Requirement: Funcionamiento sin internet
La aplicación SHALL funcionar en una computadora sin conexión a internet usando el paquete de datos local, para que la demostración no dependa de la red.

#### Scenario: Demo sin red
- **WHEN** la aplicación se ejecuta en local y se apaga el Wi-Fi
- **THEN** el panel, la bandeja y las fichas siguen cargando con el paquete local

### Requirement: Tamaños de pantalla
La aplicación SHALL ofrecer la experiencia completa en escritorio, colapsar la barra lateral en tablet y permitir consultar el panel, la bandeja y las fichas en un celular de 375 px de ancho sin desplazamiento horizontal de la página.

#### Scenario: Celular
- **WHEN** se abre la bandeja en una pantalla de 375 px de ancho
- **THEN** la página no se desplaza horizontalmente y cada proceso muestra su prioridad y sus señales

### Requirement: Accesibilidad de la estructura y del tema
La estructura y el tema SHALL cumplir WCAG 2.2 AA. Eso incluye navegación completa con teclado, foco visible, contraste mínimo de 4,5:1 en los textos y prioridad y estado comunicados siempre con ícono y texto, no solo con color.

#### Scenario: Navegación con teclado
- **WHEN** la persona recorre la estructura solo con la tecla Tab
- **THEN** alcanza la barra lateral, la cabecera y el contenido en un orden lógico, con el foco siempre visible
