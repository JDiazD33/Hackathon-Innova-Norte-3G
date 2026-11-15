# Sistema de diseño

Queremos una interfaz **bonita, sobria y confiable**: que se vea como una herramienta institucional seria y no como un tablero de alarmas. Se construye con shadcn/ui y Tailwind CSS ([ADR 0005](../adr/0005-web-nextjs-shadcn.md)).

> **Lenguaje visual Prisma** ([ADR 0008](../adr/0008-prisma-y-diseno-inspirado-en-apple.md)): inspirado en las guías públicas de Apple (Human Interface Guidelines), sin usar sus fuentes, símbolos ni recursos. El contenido va primero, en superficies sólidas; los controles y la navegación flotan en una capa de vidrio. Prisma no es de Apple ni tiene su aval.

## Principios

1. **Calma antes que alarma.** El sistema muestra señales, no culpables. Usa tonos ámbar y neutros, nunca rojo por sí solo.
2. **Explicar antes que señalar.** Ninguna señal aparece sin su explicación a un clic.
3. **La persona decide.** El rojo aparece solo cuando una persona marca "requiere atención" ([ADR 0007](../adr/0007-senales-no-acusaciones.md)).
4. **Lenguaje claro.** Sin jerga OCDS en la interfaz: "plazo para presentar ofertas", no `tenderPeriod`.
5. **Accesible.** Cumple WCAG 2.2 AA y nunca comunica algo solo con color: siempre hay un ícono y un texto.
6. **Honesta sobre sus límites.** La fecha de corte, la fuente y las limitaciones siempre están a la vista.

## Voz y vocabulario

| Decimos | No decimos |
|---|---|
| Señal · amerita revisión · prioridad de revisión | Corrupción · fraude · irregular · sospechoso |
| "Este proceso recibió 1 oferta" | "Proceso amañado" |
| Requiere atención (decisión de una persona) | Culpable · riesgo confirmado |
| Justificada (decisión de una persona) | Falso positivo |
| Proveedor 0137 (seudónimo) | El nombre de una persona natural |

## Color

Los tokens se definen en `web/src/app/globals.css` (`:root` y `.dark`) y se usan con sus clases de Tailwind (`bg-card`, `text-muted-foreground`, `bg-prioridad-alta`…). **Nunca se escriben colores sueltos en un componente.** La prueba `web/src/app/theme-contrast.test.ts` manda: exige 4,5:1 en cada par de texto y fondo, 3:1 en el anillo de foco y en las series de los gráficos, y que solo "requiere atención" sea rojo. Si cambias o agregas un token con texto, agrega su par a la prueba.

- **Modo oscuro negro total:** el fondo, las tarjetas, las barras y los menús son `#000000` y se separan con bordes finos. No hay fondos azules ni acento azul: en oscuro el acento es blanco y la selección es un gris neutro.
- **Un solo acento** (`--primary`: azul en claro, blanco en oscuro) para acciones principales, enlaces y selección. Los demás colores tienen significado: prioridad, estado o una serie de un gráfico.
- **Profundidad:** en claro, la separación viene del fondo gris con tarjetas blancas y sombras mínimas; en oscuro, de bordes finos sobre negro, sin sombra.
- **Aumentar contraste** (`prefers-contrast: more`): el texto secundario y los bordes se oscurecen (o aclaran, en oscuro) y las tarjetas y barras ganan un borde visible.

### Base

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--background` | `#F2F2F7` | `#000000` | Fondo de la página (fondo agrupado) |
| `--card` / `--card-foreground` | `#FFFFFF` / `#1D1D1F` | `#000000` / `#F5F5F7` | Superficies del contenido |
| `--popover` | `#FFFFFF` | `#000000` | Base sólida de menús, hojas y diálogos |
| `--foreground` | `#1D1D1F` | `#F5F5F7` | Texto principal |
| `--muted-foreground` | `#636366` | `#A1A1A6` | Texto secundario |
| `--primary` / `--primary-foreground` | `#0066CC` / `#FFFFFF` | `#FFFFFF` / `#000000` | Acento: botón prominente, enlaces, selección |
| `--secondary` | `#E5E5EA` | `#1C1C1C` | Relleno de controles (campos, botones neutros, control segmentado) |
| `--accent` / `--accent-foreground` | `#E5EFFA` / `#0058B0` | `#1F1F1F` / `#FFFFFF` | Tinte de acento: botón `tinted`, insignias y resultado elegido del buscador |
| `--sidebar-accent` | `#E3E3E8` | `#1F1F1F` | Selección neutra del ítem activo en la barra lateral |
| `--sidebar` | `#F7F7FA` | `#000000` | Base sólida del vidrio de las barras |
| `--segmento` | `#FFFFFF` | `#3A3A3C` | Segmento activo del control segmentado |
| `--border` / `--separador` | `#D8D8DC` / `#E3E3E8` | `#2C2C2C` / `#1F1F1F` | Bordes finos y separadores de listas |
| `--ring` | `#0071E3` | `#FFFFFF` | Anillo de foco |
| `--chart-1` … `--chart-5` | azul, índigo, naranja oscuro, gris y verde azulado | blanco, grises y naranja | Series de los gráficos (sin rojo ni el naranja `#FF9500`) |

### Prioridad de las señales (las asigna el sistema)

| Nivel | Texto | Fondo | Indicador | Uso |
|---|---|---|---|---|
| Alta | `#9A4500` / `#FFB340` | `#FFF0D9` / `#2E1D06` | ●●● | 5 puntos o más |
| Media | `#765300` / `#FFD60A` | `#FFF8DB` / `#2A2208` | ●●○ | 3 o 4 puntos |
| Baja | `#55555A` / `#AEAEB2` | `#EEEEF2` / `#1C1C1C` | ●○○ | 1 o 2 puntos |

### Estado de la revisión (lo decide una persona)

| Estado | Texto (claro / oscuro) | Fondo (claro / oscuro) | Ícono |
|---|---|---|---|
| Sin revisar | `#55555A` / `#AEAEB2` | `#EEEEF2` / `#1C1C1C` | Círculo vacío |
| En revisión | `#0058B0` / `#FFFFFF` | `#E5EFFA` / `#1C1C1C` | Reloj |
| Justificada | `#1A7333` / `#4CD964` | `#E4F5E9` / `#0B2414` | Check |
| Requiere atención | `#C1121C` / `#FF6961` | `#FDECEC` / `#2E0E10` | Bandera |

## Tipografía

- **Pila:** `-apple-system, BlinkMacSystemFont, Inter, "Segoe UI", Roboto, sans-serif`. En los dispositivos Apple se ve la fuente del sistema, que pone el sistema y no se descarga. En los demás se ve **Inter** (SIL OFL), que `next/font/google` incluye en el build: el navegador no pide nada a Google y la demo funciona sin internet. No se descargan ni se sirven SF Pro ni New York.
- **Una sola familia**; los códigos (S01, ocid) usan la monoespaciada del sistema (`font-mono`).
- **Pesos:** 400, 500, 600 y 700. Nunca Light ni Thin.
- **Cifras** con `tabular-nums`. Las tablas ya lo traen.
- **Unidades `rem`:** el zoom del navegador agranda todo, como el texto dinámico de Apple.

| Clase | Tamaño / interlineado | Peso | Uso | Equivale a |
|---|---|---|---|---|
| `text-titulo-grande` | 34 / 41 (tracking −0,02 em) | 700 | Título de cada página | `text-3xl` |
| `text-titulo-1` | 28 / 34 | 700 | Cifras clave | `text-2xl` |
| `text-titulo-2` | 22 / 28 | 700 | Secciones | `text-xl` |
| `text-titulo-3` | 20 / 25 | 600 | Título de tarjeta (`CardTitle`) | `text-lg` |
| `text-encabezado` | 17 / 22 | 600 | Títulos de lista y de bloque | — |
| `text-cuerpo` | 17 / 22 | 400 | Explicaciones y fichas | `text-base` |
| `text-subtitulo` | 15 / 20 | 400 | Tablas, listas y controles | `text-sm` |
| `text-nota` | 13 / 18 | 400 | Metadatos y ayudas | `text-xs` |
| `text-leyenda` | 12 / 16 | 400–500 | Ejes y etiquetas. Es el mínimo | — |

La escala de Tailwind (`text-xs` … `text-3xl`) está reasignada a estos tamaños, así que el código existente sigue la escala. En pantallas nuevas, prefiere los nombres propios. `cn` (de `@/lib/utils`) los conoce: no los confunde con colores.

**Montos y fechas:** formato es-PE con `web/src/lib/format.ts`: "S/ 1,250,000", "4 oct 2026" y "31%". Un dato que falta se muestra como "Sin dato".

## Materiales: el vidrio

El vidrio es **solo para la capa de controles y navegación**; el contenido va en superficies sólidas (HIG · Materials).

| Utilidad | Dónde | Base sólida |
|---|---|---|
| `material-barra` | Barra lateral, barra de filtros fija y barra de pestañas del celular | `--sidebar` |
| `material-cabecera` | Barra superior (con un solo separador abajo) | `--background` |
| `material-menu` | Menús, `Select`, popovers, tooltips de gráficos y la paleta del buscador | `--popover` |
| `material-hoja` | Hojas y diálogos | `--popover` |

**Nunca en:** tarjetas, tablas, fichas, gráficos y textos largos.

Cada utilidad trae sus alternativas, así que nadie tiene que acordarse de ellas:

- fondo sólido si el navegador no soporta `backdrop-filter` (`@supports not`);
- fondo sólido con `prefers-reduced-transparency: reduce`, donde el navegador lo soporta;
- fondo sólido y borde visible (`--borde-contraste`) con `prefers-contrast: more`.

El texto sobre vidrio se comprueba contra la base sólida, que es el peor caso: el vidrio mezcla al menos un 72 % de esa base.

## Formas, espacio y movimiento

- **Esquinas concéntricas** (radio interior = radio exterior − margen):

  | Clase | Radio | Uso |
  |---|---|---|
  | `rounded-barra` | 24 px | Barra lateral flotante y hoja lateral |
  | `rounded-item` | 12 px | Ítems de la barra lateral y de la paleta, área de texto |
  | `rounded-tarjeta` | 20 px | Tarjetas |
  | `rounded-menu` | 14 px | Menús y popovers (sus ítems: 14 − 6 px) |
  | `rounded-hoja` | 28 px | Hojas y diálogos |
  | `rounded-full` | cápsula | Botones, chips, insignias, campos y buscador |

- **Sombras:** `shadow-tarjeta` (mínima en claro, ninguna en oscuro) y `shadow-material` (la de las capas de vidrio).
- **Espaciado** en múltiplos de 4: márgenes de página de 16 px en el celular, 24 px en tablet y 32 px en escritorio; de 24 a 32 px entre secciones.
- **Objetivos táctiles:** con un puntero grueso (`pointer-coarse:`) los botones, campos e ítems llegan a 44 px.
- **Movimiento:** de 150 a 250 ms con `ease-prisma` (`cubic-bezier(0.32, 0.72, 0, 1)`). Los botones responden al presionarlos (`scale(0.98)`), las hojas suben y los menús aparecen desde su botón. Con **reducir movimiento** no hay desplazamientos ni escalas, solo cambios de opacidad: `globals.css` neutraliza las variables de animación de `tw-animate-css`, el brillo de `Skeleton` se apaga y la barra lateral solo se desvanece.
- **Íconos:** lucide-react (ISC), trazo de 1,75 a 2 y tamaños de 16, 20 y 24 px. Los que comunican algo van con texto. No se usan SF Symbols.

## Estructura de la pantalla

| Zona | Cómo es | Componente |
|---|---|---|
| Barra lateral (≥ 1024 px) | Flota en vidrio a 12 px de los bordes. Marca arriba y grupos con título: "Revisar" (Panel, Señales y Revisión) e "Información" (Metodología). El ítem activo se marca con un gris neutro y su ícono con el acento; los demás íconos van en gris, para que el color quede para las acciones. Se oculta con un botón y la preferencia se recuerda en el navegador | `BarraLateral` (`components/layout/armazon.tsx`) |
| Tablet (768–1023 px) | La barra lateral se abre con un botón como hoja flotante | `MenuMovil` |
| Celular (< 768 px) | Barra de pestañas inferior en vidrio (Panel, Señales, Revisión y Metodología) que respeta `env(safe-area-inset-bottom)`. El buscador se abre con un ícono | `BarraDePestanas` |
| Barra superior | Vidrio y fija. Selector de entidad (botón emergente), buscador en cápsula con "⌘K" o "Ctrl K", fecha de corte ("Datos al 4 oct 2026"), "Modo demostración", el espacio para el selector de rol (Lote D) y el tema. En celular y tablet, la fecha y el modo van en una segunda línea | `app/(app)/layout.tsx` |
| Título grande | Cada página abre con su título y una frase que explica qué se ve; las acciones a la derecha | `TituloDePagina` |
| Contenido | Ancho máximo de 1 200 px (`max-w-contenido`); las páginas de lectura, 720 px (`max-w-lectura`) | — |
| Pie | Discreto: atribución (CC BY 4.0), versión de las reglas y enlace a la metodología | `Pie` |

## Componentes base (shadcn/ui)

shadcn/ui sigue siendo la base ([ADR 0005](../adr/0005-web-nextjs-shadcn.md)); cambia la apariencia, no la forma de usarlos.

| Componente | Cómo se ve |
|---|---|
| `Button` | Cápsula. `default` = **prominente** (fondo de acento; uno por vista), `tinted` = tinte de acento, `secondary` = neutro con relleno gris, `outline` = neutro con borde fino, `plain` = solo texto de acento ("Limpiar filtros"), `ghost` = íconos de barra, `destructive` = solo para "requiere atención" |
| `Card` | Superficie sólida, radio de 20 px, sin borde y con sombra mínima en claro; en oscuro, negra con un borde fino. `CardTitle` usa Título 3. Para pares etiqueta–valor, lista con separadores finos (`border-separador`) |
| `Badge` | Cápsula pequeña con tinte (por defecto, el de acento) |
| `Input`, `Textarea` | Relleno gris del sistema; el campo es una cápsula |
| `Select` | Botón emergente en cápsula con el valor y un chevron; el menú en vidrio |
| `Tabs` | Control segmentado. Para un filtro de una opción, `ControlSegmentado` (`components/ui/control-segmentado.tsx`) |
| `Dialog`, `Sheet` | Hojas en vidrio: centradas y con radio grande en escritorio, desde abajo en el celular. Título claro (Título 3), cerrar con un botón redondo y acciones al pie |
| `Command` (buscador) | Paleta grande arriba, en vidrio, con resultados agrupados y el seleccionado con tinte de acento |
| `Table` | Estilo lista: cabecera discreta, separadores finos, filas cómodas y fondo al pasar el mouse |
| `Tooltip` | Pequeño y sobrio; también se abre con el teclado |
| `Skeleton` | Brillo suave; sin brillo con reducir movimiento |
| `Chart` (Recharts) | Rejilla tenue y tooltip en vidrio. El título dice la conclusión y el resumen en texto se mantiene |
| `PrioridadBadge`, `EstadoRevisionBadge` | Cápsulas con tinte, ícono (o puntos) y texto. Mismas props de siempre |
| `SinDatos` | Ícono, título breve opcional (`titulo`), mensaje y acción. `titulo` e `icono` son opcionales y nuevos; el uso de antes sigue igual |

## Tarjeta de señal

Es la pieza más importante del producto, porque concentra la explicación. Su estructura es esta:

1. **Encabezado:** ícono de la categoría, nombre de la señal, código (S01 · Cardinal R018) y peso en la prioridad.
2. **Qué encontramos:** una frase con el dato en negrita.
3. **Con qué lo comparamos:** una frase y un minigráfico de la distribución del grupo, con un marcador de "este proceso".
4. **Por qué importa:** dos líneas y la referencia internacional.
5. **Qué revisar:** una lista de verificación.
6. **Qué no significa:** un recuadro neutro.
7. **Datos usados:** campos, fuente, fecha de corte y un enlace "Ver en el SEACE".
8. **Calidad de datos:** una nota, solo si se aplicó alguna exclusión o ajuste.

## Pantallas

1. **Panel de la entidad:**
   - cifras clave: procesos, monto, procesos con señales y revisiones pendientes;
   - señales por categoría;
   - tendencia mensual;
   - los cinco proveedores con mayor participación.
2. **Bandeja de señales:**
   - tabla priorizada con filtros por prioridad, categoría, método, fecha y estado de la revisión;
   - una fila por proceso, con chips de señales.
3. **Ficha del proceso:**
   - cabecera con objeto, entidad, método, monto y estado;
   - línea de tiempo: convocatoria, presentación, adjudicación, contrato y culminación;
   - tarjetas de señal;
   - documentos oficiales;
   - historial de revisión;
   - botón "Registrar revisión".
4. **Ficha del proveedor:**
   - participación en la entidad;
   - procesos ganados;
   - señal S03 si corresponde;
   - enlace a la Ficha Única del Proveedor del OECE.
5. **Revisión:** casos asignados a mí, casos que asigné y casos decididos. La decisión registra estado, comentario, a quién se asigna, quién decide y cuándo.
6. **Reporte de trazabilidad:**
   - vista imprimible del caso: datos, señales y explicaciones, decisiones con fecha y responsable;
   - fuente y atribución.
7. **Metodología:**
   - catálogo de señales;
   - fórmula de prioridad;
   - referentes y licencias;
   - fuente y límites de los datos;
   - versión de las reglas.

## Ética y privacidad

- **Seudónimos:** en el enlace público, los proveedores aparecen con un seudónimo estable ("Proveedor 0137"). Las personas naturales (RUC que empieza con 10) nunca muestran su nombre en ningún modo.
- **Entidades:** se muestran con su nombre, porque son públicas y están sujetas a transparencia. Aun así, el caso práctico no debe usar a la entidad organizadora como ejemplo principal sin conversarlo.
- **Datos sintéticos:** se marcan con la etiqueta "Dato simulado".
- **Sin analítica de usuarios** y sin datos personales de quienes usan la herramienta. Los roles son simulados.
- **Página de metodología:** explica las limitaciones y la posibilidad de falsos positivos.

## Accesibilidad (lista de verificación)

- [ ] Contraste de 4,5:1 en texto y de 3:1 en íconos y bordes.
- [ ] Todo se puede hacer con el teclado y el foco es visible.
- [ ] Prioridad y estado se comunican con ícono y texto, no solo con color.
- [ ] Los gráficos tienen un resumen en texto ("este proceso está en el 5 % con menor plazo").
- [ ] Las tablas tienen encabezados semánticos y los diálogos tienen títulos.
- [ ] Modo oscuro revisado pantalla por pantalla.
- [ ] Funciona con zoom al 200 %, con reducir movimiento, con reducir transparencia y con aumentar contraste.
- [ ] Objetivos táctiles de 44 px en el celular.

## Responsivo

- **Escritorio (≥ 1024 px):** experiencia completa, con la barra lateral flotante.
- **Tablet (768–1023 px):** la barra lateral se abre con un botón.
- **Celular (< 768 px):** barra de pestañas inferior; consulta de panel, bandeja y fichas. La decisión de revisión se recomienda en escritorio ([ADR 0001](../adr/0001-aplicacion-web-responsiva.md)).
