# Sistema de diseño

Queremos una interfaz **bonita, sobria y confiable**: que se vea como una herramienta institucional seria y no como un tablero de alarmas. Se construye con shadcn/ui y Tailwind CSS ([ADR 0005](../adr/0005-web-nextjs-shadcn.md)).

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

Los tokens se definen en `web/src/app/globals.css` como variables CSS de shadcn/ui, en modo claro y oscuro. Todos los pares de texto y fondo deben superar un contraste de 4,5:1, y deben verificarse con una herramienta de contraste al implementarlos.

### Base

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--background` | `#F8FAFC` | `#0B1220` | Fondo de la página |
| `--card` | `#FFFFFF` | `#111A2E` | Tarjetas y paneles |
| `--foreground` | `#0F172A` | `#E2E8F0` | Texto principal |
| `--muted-foreground` | `#475569` | `#94A3B8` | Texto secundario |
| `--primary` | `#1E3A8A` | `#93C5FD` | Acciones principales y navegación activa |
| `--border` | `#E2E8F0` | `#1E293B` | Bordes |

### Prioridad de las señales (las asigna el sistema)

| Nivel | Texto | Fondo | Indicador | Uso |
|---|---|---|---|---|
| Alta | `#92400E` | `#FEF3C7` | ●●● | 5 puntos o más |
| Media | `#A16207` | `#FEFCE8` | ●●○ | 3 o 4 puntos |
| Baja | `#475569` | `#F1F5F9` | ●○○ | 1 o 2 puntos |

### Estado de la revisión (lo decide una persona)

| Estado | Texto | Fondo | Ícono |
|---|---|---|---|
| Sin revisar | `#475569` | `#F1F5F9` | Círculo vacío |
| En revisión | `#1D4ED8` | `#EFF6FF` | Reloj |
| Justificada | `#15803D` | `#F0FDF4` | Check |
| Requiere atención | `#B91C1C` | `#FEF2F2` | Bandera |

## Tipografía y espaciado

- **Fuente:** Geist Sans, la fuente por defecto de Next.js, o Inter. Las cifras usan números tabulares (`tabular-nums`).
- **Escala:** 12 / 14 / 16 / 20 / 24 / 30 px. El texto base es de 14 px en tablas y 16 px en el contenido.
- **Montos y fechas:** formato es-PE con las funciones de `web/src/lib/format.ts`: "S/ 1,250,000", "4 oct 2026" y "31%". Un dato que falta se muestra como "Sin dato".
- **Espaciado:** múltiplos de 4 px. Las tarjetas usan un radio de 12 px y una sombra suave.

## Estructura de la pantalla

- **Barra lateral:** Panel, Señales, Revisión y Metodología. Las fichas de procesos y proveedores se abren desde la bandeja, el panel o el buscador.
- **Cabecera:**
  - selector de entidad;
  - buscador (Ctrl/Cmd + K);
  - selector de rol (analista, jefatura o auditor);
  - fecha de corte de los datos ("Datos al 4 oct 2026");
  - etiqueta "Modo demostración" cuando hay seudónimos.
- **Contenido:** ancho máximo de 1 280 px, en tarjetas. Las tablas tienen la cabecera fija.
- **Pie:** atribución de los datos (CC BY 4.0) y enlace a la metodología.

## Componentes base (shadcn/ui)

| Componente | Uso |
|---|---|
| Card, Badge, Separator | Resúmenes, prioridad y estado |
| Table + TanStack Table | Bandeja, procesos y proveedores |
| Tabs | Secciones de las fichas |
| Sheet | Panel lateral con la explicación de una señal |
| Dialog, Select, Textarea | Registrar una decisión de revisión |
| Command | Buscador global |
| Chart (Recharts) | Distribuciones y tendencias |
| Tooltip, Toast (sonner), Skeleton, Breadcrumb | Ayudas, confirmaciones y estados de carga |

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

## Responsivo

- **Escritorio:** experiencia completa.
- **Tablet:** la barra lateral se colapsa.
- **Celular:** consulta de panel, bandeja y fichas. La decisión de revisión se recomienda en escritorio ([ADR 0001](../adr/0001-aplicacion-web-responsiva.md)).
