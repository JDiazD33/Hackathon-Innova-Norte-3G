# Spec Delta

## Purpose

Dar a Prisma una identidad y una apariencia coherentes en todas las pantallas: el nombre en un solo lugar, un tema claro y oscuro accesible, la capa de vidrio solo para los controles y adaptaciones para quienes piden menos movimiento, menos transparencia o más contraste.

## ADDED Requirements

### Requirement: Nombre del producto en un solo lugar
La aplicación SHALL tomar el nombre "Prisma" y su descripción de una única configuración del producto. La cabecera, la marca y el título de cada pestaña SHALL usar ese valor, con la forma "<Página> · Prisma".

#### Scenario: Título de la pestaña
- **WHEN** la persona abre el panel
- **THEN** el título de la pestaña es "Panel · Prisma"
- **AND** la marca de la barra lateral muestra "Prisma"

#### Scenario: Cambio del nombre
- **WHEN** el equipo cambia el nombre en la configuración del producto
- **THEN** la marca y los títulos de todas las pantallas muestran el nombre nuevo sin otro cambio en el código

### Requirement: Ícono propio
La aplicación SHALL servir un ícono propio de Prisma (un prisma que separa un rayo en haces, sin rojo) como favicon y como ícono para la pantalla de inicio de los dispositivos. El ícono MUST NOT usar logos, símbolos ni recursos de Apple.

#### Scenario: Favicon
- **WHEN** el navegador pide el ícono de la página
- **THEN** recibe el ícono de Prisma

### Requirement: Tipografía del sistema con alternativa libre
La aplicación SHALL usar la fuente del sistema del dispositivo y, donde no esté disponible, Inter incluida en el build. MUST NOT descargar ni servir SF Pro ni New York. Los tamaños SHALL usar unidades relativas para crecer con el zoom del navegador.

#### Scenario: Funciona sin internet
- **WHEN** la demo corre con el build local y sin conexión
- **THEN** el texto se muestra con la fuente del sistema o con Inter, sin pedir fuentes a servidores externos

#### Scenario: Zoom al 200 %
- **WHEN** la persona usa el zoom del navegador al 200 %
- **THEN** el texto crece en proporción y no se superpone ni se corta en el panel ni en la bandeja

### Requirement: Contraste del tema
Cada par de texto y fondo del tema SHALL llegar a un contraste de 4,5:1 en modo claro y en modo oscuro, y el anillo de foco SHALL llegar a 3:1 contra el fondo y las tarjetas. Una prueba automática SHALL comprobarlo.

#### Scenario: Prueba de contraste
- **WHEN** se ejecuta la suite de pruebas
- **THEN** la prueba de contraste pasa para todos los pares en claro y oscuro

### Requirement: Rojo solo para "requiere atención"
Entre los colores de prioridad y de estado, solo el estado "requiere atención", que decide una persona, SHALL usar rojo. La prioridad asignada por el sistema MUST NOT usar rojo.

#### Scenario: Colores de prioridad
- **WHEN** la bandeja muestra un proceso de prioridad alta
- **THEN** su insignia usa un tono ámbar, con ícono y texto

### Requirement: Un solo color de acento
La interfaz SHALL usar un único color de acento para las acciones principales, los enlaces y la selección. Los demás colores SHALL tener un significado fijo: prioridad, estado o series de un gráfico.

#### Scenario: Navegación activa
- **WHEN** la persona está en la bandeja
- **THEN** el ítem "Señales" de la navegación se marca con el color de acento, además de su estado `aria-current`

### Requirement: Vidrio solo en la capa de controles
La barra lateral, la barra superior, la barra de filtros fija, los menús, la paleta del buscador, las hojas y la barra de pestañas del celular SHALL usar un material translúcido. Las tarjetas, tablas, fichas, gráficos y textos largos MUST usar superficies sólidas.

#### Scenario: Contenido bajo la barra superior
- **WHEN** la persona se desplaza por la bandeja
- **THEN** la barra superior queda fija y el contenido se intuye detrás de ella, difuminado
- **AND** las tarjetas y la tabla se muestran sobre fondos sólidos

### Requirement: Alternativas al vidrio
Cuando el navegador no soporta el difuminado de fondo o la persona pide reducir la transparencia, los materiales translúcidos SHALL mostrarse con un fondo sólido. Cuando la persona pide más contraste, SHALL mostrarse con fondo sólido y bordes más marcados.

#### Scenario: Reducir la transparencia
- **WHEN** el sistema operativo tiene activado "reducir transparencia" y el navegador lo informa
- **THEN** la barra lateral y la barra superior tienen fondo sólido

#### Scenario: Aumentar el contraste
- **WHEN** el sistema operativo tiene activado "aumentar contraste"
- **THEN** las barras tienen fondo sólido y un borde visible

### Requirement: Movimiento reducido
Las transiciones SHALL ser breves y con propósito. Cuando la persona pide reducir el movimiento, la interfaz MUST NOT desplazar ni escalar elementos: solo SHALL cambiar su opacidad.

#### Scenario: Abrir una hoja con movimiento reducido
- **WHEN** "reducir movimiento" está activado y la persona abre el buscador
- **THEN** la paleta aparece con un fundido, sin desplazamiento ni escala

### Requirement: Título grande en cada página
Cada página de la aplicación SHALL abrir con un título grande y una frase que explique qué se ve.

#### Scenario: Página de la bandeja
- **WHEN** la persona abre "Señales"
- **THEN** la página empieza con el título "Señales" y una frase sobre los procesos que ameritan revisión

### Requirement: Navegación adaptada al tamaño de pantalla
Desde 1024 px de ancho, la navegación principal SHALL ir en una barra lateral que la persona puede ocultar y volver a mostrar. Entre 768 y 1023 px, SHALL abrirse con un botón. Bajo 768 px, SHALL ir en una barra de pestañas inferior que respeta el área segura del dispositivo.

#### Scenario: Celular
- **WHEN** la persona abre Prisma en una pantalla de 375 px
- **THEN** ve una barra de pestañas inferior con Panel, Señales, Revisión y Metodología, sin desplazamiento horizontal

#### Scenario: Ocultar la barra lateral
- **WHEN** en escritorio la persona oculta la barra lateral
- **THEN** el contenido ocupa el espacio libre y un botón permite volver a mostrarla

### Requirement: Uso con el teclado
Todos los controles de la estructura y de los componentes base SHALL poder usarse solo con el teclado, con un foco visible, y SHALL existir un enlace "Saltar al contenido".

#### Scenario: Recorrido con Tab
- **WHEN** la persona recorre la página con Tab
- **THEN** cada control enfocado muestra el anillo de foco y el primer elemento es "Saltar al contenido"

### Requirement: Componentes compartidos compatibles
Los componentes compartidos de prioridad, estado de revisión y estado vacío SHALL conservar su forma de uso al cambiar de apariencia, y SHALL seguir comunicando prioridad y estado con ícono y texto, no solo con color.

#### Scenario: Pantalla de otro lote
- **WHEN** una pantalla del Lote C o D usa la insignia de estado con las mismas props de antes
- **THEN** se muestra con la apariencia nueva, su ícono y su texto, sin cambios en esa pantalla
