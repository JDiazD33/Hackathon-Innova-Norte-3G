# Lote B · Joaquín · Rediseño Prisma con las guías de Apple

**Objetivo:** que toda la interfaz se vea y se sienta como una app de Apple, clara, tranquila y ordenada, con el nombre **Prisma** y sin perder la accesibilidad ni las reglas del producto ([ADR 0008](../../adr/0008-prisma-y-diseno-inspirado-en-apple.md)).

**Por qué tú:** el tema, la estructura y los componentes base son del Lote B. Sebastián y André construyen sus pantallas encima, así que la base va primero.

**Fechas:**

| Cuándo | Qué |
|---|---|
| dom 15 | Base Prisma en un PR |
| lun 16 | Panel y bandeja rediseñados |
| mié 18 | Datos reales en Vercel |
| jue 19 | Demo sin internet verificada |

## 1. Antes de empezar

1. `git switch main && git pull`, y crea la rama `lote-b/parte-5-prisma-base`.
2. Lee completos:
   - `AGENTS.md`, `CONTRIBUTING.md` y `web/AGENTS.md` (Next 16 trae cambios: consulta `web/node_modules/next/dist/docs/` antes de escribir código de Next);
   - `web/README.md`, `docs/diseno/sistema-de-diseno.md` y los ADR 0003, 0005, 0007 y 0008;
   - [el README de la Fase 1](README.md) y este documento.
3. Crea el change de OpenSpec `lote-b-rediseno-prisma` con el skill `openspec-propose` (Claude Code: `/opsx:propose`; Codex: `$openspec-propose`), a partir de este documento:
   - **proposal:** por qué y qué cambia;
   - **design:** las decisiones de las secciones 3 a 6;
   - **specs:** los requisitos (nombre en un solo lugar, tema Prisma, vidrio solo en la capa de controles, contraste, reducir movimiento y transparencia);
   - **tasks:** las de la sección 7.

   Valídalo con `openspec validate --all --strict`.
4. Prepara la web: `cd web && npm ci && npm test`.

## 2. Las guías de Apple que hay que leer

Son las instrucciones de diseño. Están en las [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) (HIG): se actualizaron con Liquid Glass en 2025 y se refinaron en la WWDC de junio de 2026. Léelas antes de diseñar.

| Tema | Página | Qué tomar |
|---|---|---|
| Liquid Glass | [Visión general](https://developer.apple.com/documentation/technologyoverviews/liquid-glass) | Jerarquía, armonía y consistencia. El contenido manda |
| Materiales | [Materials](https://developer.apple.com/design/human-interface-guidelines/materials) | El vidrio es para la capa de controles y navegación, con moderación. El contenido va en superficies normales |
| Color | [Color](https://developer.apple.com/design/human-interface-guidelines/color) | Color con moderación: el acento para acciones principales y estados. Funciona en claro, oscuro y alto contraste |
| Tipografía | [Typography](https://developer.apple.com/design/human-interface-guidelines/typography) | Fuente del sistema, estilos de texto (Large Title a Caption) y pesos de Regular a Bold |
| Diseño de la pantalla | [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) | Ordenar por importancia, agrupar, divulgación progresiva y controles distintos del contenido |
| Barra lateral | [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars) | Navegación principal, como máximo dos niveles y se puede ocultar |
| Barra de herramientas | [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars) | Acciones y búsqueda arriba, agrupadas |
| Búsqueda | [Search fields](https://developer.apple.com/design/human-interface-guidelines/search-fields) y [Searching](https://developer.apple.com/design/human-interface-guidelines/searching) | El buscador en la barra, con sugerencias |
| Control segmentado | [Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls) | El filtro de prioridad y las pestañas de Revisión |
| Listas y tablas | [Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables) | La bandeja y las listas de las fichas |
| Gráficos | [Charting data](https://developer.apple.com/design/human-interface-guidelines/charting-data) y [Charts](https://developer.apple.com/design/human-interface-guidelines/charts) | Gráficos simples, con un título que diga la conclusión |
| Hojas | [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) | El diálogo de decisión y los detalles |
| Modo oscuro | [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) | Fondos y elevación en oscuro |
| Accesibilidad | [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | Contraste, tamaños, teclado, reducir movimiento y transparencia |
| Movimiento | [Motion](https://developer.apple.com/design/human-interface-guidelines/motion) | Animaciones breves y con propósito |
| Escritura | [Writing](https://developer.apple.com/design/human-interface-guidelines/writing) | Textos breves, directos y amables |
| Escritorio y tablet | [Designing for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos) y [for iPadOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ipados) | La densidad de una app de escritorio y de tablet |

**Lo que no se toma de Apple:**

- **Fuentes:** no se descargan ni se sirven SF Pro ni New York.
- **Íconos:** no se usan SF Symbols; su licencia los limita a apps de plataformas Apple.
- **Recursos:** no se usan logos, capturas, kits de Figma o Sketch ni el nombre "Liquid Glass" en la interfaz.
- **Afiliación:** Prisma no es de Apple; en el pitch decimos que nos inspiramos en sus guías públicas.

## 3. Qué tomamos de Apple y cómo se lleva a la web

### Principios

1. **El contenido primero.** Los datos y la explicación son lo importante. Los controles acompañan, no compiten.
2. **Dos capas:**
   - los controles y la navegación flotan en una capa de vidrio translúcido;
   - el contenido (tarjetas, tablas, fichas y gráficos) va en superficies sólidas.
3. **Jerarquía con tipografía y espacio**, no con cajas, bordes y colores por todas partes.
4. **Un solo color de acento** para acciones y selección. Los demás colores tienen significado: prioridad, estado y gráficos.
5. **Consistencia:** el mismo componente se ve y se comporta igual en todas las pantallas y en los dos modos.
6. **Movimiento sutil** que explica de dónde viene y a dónde va algo, nunca decorativo.

### Tipografía

**Pila de fuentes:**

```css
-apple-system, BlinkMacSystemFont, var(--font-inter), "Segoe UI", Roboto, sans-serif
```

- En los dispositivos Apple se ve SF Pro, porque la pone el sistema y no se descarga.
- En los demás se ve Inter (SIL OFL). Cárgala con `next/font/google`, así queda dentro del build y funciona sin internet.
- Reemplaza a Geist.

**Escala:** basada en los estilos de texto de Apple en su tamaño por defecto, en px.

| Estilo | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|
| Título grande | 34 / 41 | 700 | Título de cada página |
| Título 1 | 28 / 34 | 700 | Cifras clave |
| Título 2 | 22 / 28 | 700 | Secciones |
| Título 3 | 20 / 25 | 600 | Tarjetas |
| Encabezado | 17 / 22 | 600 | Títulos de lista y de bloque |
| Cuerpo | 17 / 22 | 400 | Textos de explicación y fichas |
| Subtítulo | 15 / 20 | 400 | Tablas, listas y controles |
| Nota | 13 / 18 | 400 | Metadatos y ayudas |
| Leyenda | 12 / 16 | 400–500 | Ejes y etiquetas. Es el mínimo |

**Detalles:**

- Usa los pesos 400, 500, 600 y 700. No uses Light ni Thin.
- Las cifras van con `tabular-nums`.
- Los títulos grandes llevan un tracking de −0,02 em.
- Usa unidades `rem`, para que el zoom del navegador agrande todo, como el texto dinámico de Apple.

### Color

Es un punto de partida tomado de los colores del sistema de Apple y oscurecido donde hacía falta. Se comprobó con la misma fórmula de `web/src/app/theme-contrast.test.ts`:

- los 21 pares de texto superan 4,5:1 en claro (el peor da 4,99) y en oscuro (el peor da 5,80);
- el anillo de foco supera 3:1;
- solo "requiere atención" es rojo.

La prueba es la que manda: si cambias un valor, debe seguir en verde.

**Base:**

| Token | Claro | Oscuro | Nota |
|---|---|---|---|
| `--background` | `#F2F2F7` | `#000000` | Fondo agrupado de Apple |
| `--card`, `--card-foreground` | `#FFFFFF`, `#1D1D1F` | `#1C1C1E`, `#F5F5F7` | Superficies del contenido |
| `--popover` | `#FFFFFF` | `#2C2C2E` | Base sólida de menús y hojas |
| `--foreground` | `#1D1D1F` | `#F5F5F7` | Texto principal |
| `--muted-foreground` | `#636366` | `#A1A1A6` | Texto secundario. El gris de Apple `#8A8A8E` da 3,4:1 y no alcanza |
| `--primary` y su texto | `#0066CC` y `#FFFFFF` | `#409CFF` y `#000000` | Acento. El azul de Apple `#007AFF` da 4,0:1 sobre blanco |
| `--secondary` | `#E5E5EA` | `#2C2C2E` | Rellenos de controles |
| `--accent`, `--accent-foreground` | `#E5EFFA`, `#0058B0` | `#0F2A4A`, `#8CC2FF` | Selección, por ejemplo en la barra lateral |
| `--sidebar` | `#F7F7FA` | `#161618` | Base sólida del vidrio |
| `--ring` | `#0071E3` | `#409CFF` | Foco |

**Prioridad y estado:** mantienen su significado (ámbar y gris para la prioridad, rojo solo para "requiere atención") con tonos del sistema.

| Token | Claro (fondo / texto) | Oscuro (fondo / texto) |
|---|---|---|
| `prioridad-alta` | `#FFF0D9` / `#9A4500` | `#3A2508` / `#FFB340` |
| `prioridad-media` | `#FFF8DB` / `#765300` | `#33290A` / `#FFD60A` |
| `prioridad-baja` y `estado-sin-revisar` | `#EEEEF2` / `#55555A` | `#2C2C2E` / `#AEAEB2` |
| `estado-en-revision` | `#E5EFFA` / `#0058B0` | `#0F2A4A` / `#8CC2FF` |
| `estado-justificada` | `#E4F5E9` / `#1A7333` | `#0E2E19` / `#4CD964` |
| `estado-requiere-atencion` | `#FDECEC` / `#C1121C` | `#3B1214` / `#FF6961` |

**Notas:**

- **Botones en oscuro:** con texto blanco, el azul de los botones no llega a 4,5:1 (`#0A84FF` da 3,6:1). Por eso la propuesta usa texto oscuro sobre azul claro. Si prefieres texto blanco, crea un token aparte para el relleno del botón y agrega su par a la prueba.
- **Gráficos:** usa el acento y tonos del sistema en su variante de alto contraste (azul, índigo, naranja oscuro y gris), con al menos 3:1 contra el fondo. No uses rojo ni el naranja `#FF9500`, que sobre blanco da 2,2:1.
- **Tokens nuevos:** los de los materiales pueden ser `rgba` o `color-mix`. La prueba solo lee los valores hexadecimales, así que el contraste del texto sobre vidrio se comprueba aparte, contra el peor fondo posible.

### Materiales: el vidrio

**Dónde sí:**

- barra lateral y barra superior;
- barra de filtros fija;
- menús, popovers y la paleta del buscador;
- hojas (diálogos);
- barra de pestañas del celular.

**Dónde no:** tarjetas, tablas, fichas, gráficos y textos largos. Ahí van superficies sólidas, como dice la HIG.

**Receta de partida** (en `globals.css`, como utilidad de Tailwind 4 con `@utility`):

```css
@utility material-barra {
  background-color: color-mix(in srgb, var(--sidebar) 72%, transparent);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid color-mix(in srgb, var(--foreground) 8%, transparent);
  box-shadow: 0 8px 32px rgb(0 0 0 / 0.08);
}
```

**Alternativas obligatorias:**

- fondo sólido si `backdrop-filter` no está soportado (`@supports not`);
- fondo sólido con `@media (prefers-reduced-transparency: reduce)` donde el navegador lo soporte;
- fondo sólido y bordes más marcados con `@media (prefers-contrast: more)`.

### Formas, espacio y profundidad

- **Esquinas concéntricas:** el radio interior es el radio exterior menos el margen.
  - barra lateral flotante: 24 px, con ítems de 12 px;
  - tarjetas: 20 px;
  - menús y popovers: 14 px;
  - hojas: 28 px.
- **Cápsulas** (radio completo) en botones de barra, chips, insignias y el campo de búsqueda.
- **Espaciado en múltiplos de 4:**
  - márgenes de página de 16 px en el celular, 24 px en tablet y 32 px en escritorio;
  - separación entre secciones de 24 a 32 px.
- **Objetivos táctiles** de 44 px en el celular, como pide la HIG.
- **Profundidad:**
  - en claro, la separación viene del fondo gris con tarjetas blancas, con sombras mínimas;
  - en oscuro, de grises cada vez más claros, sin sombras;
  - en las listas van separadores finos, no bordes en todo.

### Movimiento

- Transiciones de 150 a 250 ms con una curva suave, por ejemplo `cubic-bezier(0.32, 0.72, 0, 1)`.
- Los botones responden al presionarlos (por ejemplo, `scale(0.98)`).
- Las hojas suben y los menús aparecen desde su botón.
- Con `prefers-reduced-motion: reduce` no hay desplazamientos ni escalas: solo cambios de opacidad.

### Íconos

- lucide-react (ISC), con trazo de 1,75 a 2 y tamaños de 16, 20 y 24 px.
- Un solo estilo en toda la app.
- Los íconos que comunican algo siempre van con texto.

### Marca Prisma

- **Nombre:** cámbialo solo en `web/src/config/producto.ts` (ADR 0006). La cabecera y el título de la pestaña lo toman de ahí: "Panel · Prisma".
- **Frase:** "Señales explicables para revisar compras públicas".
- **Ícono propio:**
  - un prisma simple que separa un rayo en tres haces, en SVG, en una sola tinta o con un degradado suave y sin rojo;
  - dentro de un cuadrado redondeado, como un ícono de app, pero sin imitar los de Apple;
  - va en `web/src/app/icon.svg` y `web/src/app/apple-icon.png` (180 × 180 px), que Next toma por convención.
- **Opcional:** en Vercel, *Settings → Domains*, agrega un subdominio como `prisma-innova.vercel.app` si está libre.

## 4. Estructura de la pantalla

| Zona | Cómo queda |
|---|---|
| Barra lateral (desde 1024 px) | Flota en vidrio, separada 8–12 px de los bordes. Lleva la marca arriba y grupos con título ("Revisar": Panel, Señales y Revisión; "Información": Metodología). El ítem activo va con fondo de acento suave y texto de acento. Se puede ocultar |
| Barra superior | Vidrio y fija. Lleva el selector de entidad como botón emergente y el buscador en cápsula con la ayuda "⌘K" o "Ctrl K". A la derecha: fecha de corte, "Modo demostración", el espacio para el selector de rol de André y el tema (claro, oscuro o sistema) |
| Título grande | Cada página abre con su título y una frase que explica qué se ve. Opcional: al bajar, el título pasa en pequeño a la barra |
| Contenido | Ancho máximo de 1 200 px; las páginas de lectura (metodología), de 720 px. Secciones con título y grupos en tarjetas |
| Tablet (768–1023 px) | La barra lateral se oculta y se abre con un botón |
| Celular (< 768 px) | Barra de pestañas inferior en vidrio (Panel, Señales, Revisión y Metodología), con `env(safe-area-inset-bottom)`, en lugar del menú lateral. El buscador se abre con un ícono |
| Pie | Discreto: atribución (CC BY 4.0), versión de las reglas y enlace a la metodología |

## 5. Componentes

shadcn/ui sigue siendo la base (ADR 0005). Cambia la apariencia, no la forma de usarlos.

| Componente | Cómo debe verse |
|---|---|
| Button | **Prominente:** cápsula con fondo de acento. **Tinte:** acento al 12 %. **Plano:** solo texto de acento. **Neutro:** relleno gris. Un solo botón prominente por vista |
| Card | Superficie sólida con radio de 20 px, sin borde y con sombra mínima. Para pares etiqueta–valor, lista agrupada con separadores finos |
| Badge | Cápsula pequeña con tinte |
| Input y buscador | Cápsula con relleno gris del sistema; el buscador con ícono de lupa |
| Select | Botón emergente con el valor y un chevron; el menú en vidrio |
| Tabs | Control segmentado |
| Dialog y Sheet | Hoja: centrada y con radio grande en escritorio, desde abajo en el celular. Título claro y acciones al pie |
| Command (buscador) | Paleta grande y centrada arriba, en vidrio, con resultados agrupados |
| Table | Estilo lista: cabecera fija, separadores finos, filas cómodas, fondo al pasar el mouse y orden al hacer clic en la cabecera |
| Tooltip | Pequeño y sobrio, también con el teclado |
| Skeleton | Brillo suave; sin brillo si se pide reducir el movimiento |
| Gráficos (Recharts) | Barras con extremos redondeados, rejilla horizontal tenue, sin bordes de eje y un solo color por serie. El título dice la conclusión y el resumen en texto se mantiene |
| `PrioridadBadge`, `EstadoRevisionBadge` y `SinDatos` | Apariencia nueva con las mismas props, porque C y D ya los usan |

**Regla:** si tienes que cambiar las props de un componente compartido, avisa a Sebastián y André antes de fusionar.

## 6. Panel y bandeja

**Panel:**

- título grande con la entidad y su tipo;
- cifras clave como "widgets": número grande, etiqueta y enlace;
- la señal de la entidad (S05) como aviso con ícono y texto, no como alarma;
- gráficos en tarjetas, con el título que diga la conclusión;
- proveedores con mayor participación en una lista agrupada con su barra de participación.

**Bandeja:**

- **Barra de filtros fija en vidrio:**
  - control segmentado de prioridad: Todas, Alta, Media y Baja;
  - botones emergentes de categoría, método y revisión;
  - rango de fechas en un popover;
  - "Limpiar filtros" como botón plano.
- **Escritorio:** la tabla en estilo lista.
- **Celular:** filas de lista con chevron.
- **Estado vacío:** ícono, título breve y acción.

## 7. Tareas, en orden

### Parte 5 · Base Prisma (dom 15)

Rama `lote-b/parte-5-prisma-base`.

1. Crear el change de OpenSpec (sección 1).
2. Cambiar el nombre a Prisma: configuración, ícono, `README.md` y el nombre en los documentos que lo usen.
3. Tipografía nueva (sección 3).
4. Tokens de color en claro y oscuro, con la prueba de contraste en verde. Si agregas pares nuevos, agrégalos a la prueba.
5. Materiales con sus alternativas.
6. Estructura: barra lateral, barra superior, título grande, pestañas del celular y pie.
7. Componentes de shadcn/ui y componentes compartidos con su nueva apariencia (sección 5).
8. Documentación:
   - en `docs/diseno/sistema-de-diseno.md`, actualizar color, tipografía, materiales, estructura y componentes;
   - en `web/README.md`, "Cómo crear una pantalla", con una plantilla de página Prisma.
9. Verificar (sección 8) y abrir el PR con capturas de antes y después. Avisar a Sebastián y André.

### Parte 6 · Panel y bandeja (lun 16)

Rama `lote-b/parte-6-prisma-panel-y-bandeja`.

10. Panel y bandeja con el diseño nuevo (sección 6), estados de carga y vacíos.
11. Tarea 4.2 del Lote B: pruebas de componente de los filtros con Testing Library.

### Pendientes del Lote B

Están en `openspec/changes/lote-b-base-web-panel-y-bandeja/tasks.md`.

12. **4.3:** verificar el cambio de estado en la bandeja cuando exista el diálogo de André.
13. **4.4:** verificar que el buscador abre la ficha cuando existan las rutas de Sebastián.
14. **5.1:** cuando el paquete público de Stefano esté en `main`:
    - agregar `PAQUETE_DATOS=publico` en Vercel (*Settings → Environment Variables*, Production y Preview);
    - volver a desplegar;
    - revisar panel, bandeja y una ficha desde un celular.
15. **5.2:** documentar la demo sin internet en `CONTRIBUTING.md` y probarla con el Wi-Fi apagado. En la pestaña de red no debe aparecer ninguna petición externa.
16. **6.1:** la verificación de cierre con datos reales.

### Coordinación

- Entrevistas de problema (lun 16 – mié 18) y ficha del problema v1 ([guía](README.md#entrevistas-de-problema-lun-16--mié-18)).
- Revisar y fusionar los PR aprobados de los demás.

## 8. Cuándo está terminado

**Se siente como una app de Apple:**

- [ ] Los controles flotan en vidrio y el contenido va en superficies sólidas.
- [ ] Cada página abre con un título grande y una frase.
- [ ] Hay un solo color de acento, usado para acciones y selección.
- [ ] La tipografía sigue la escala; no hay pesos finos ni más de una familia.
- [ ] Las esquinas son concéntricas, y los botones de barra, chips y buscador son cápsulas.
- [ ] No quedan bordes duros por todas partes ni sombras pesadas.

**Comprobaciones:**

- [ ] `npm run typecheck`, `npm run lint`, `npm test` (con la prueba de contraste) y `npm run build`, en verde.
- [ ] Claro y oscuro; a 375, 768 y 1280 px; solo con el teclado; con zoom al 200 %.
- [ ] Con reducir movimiento, reducir transparencia y alto contraste activados.
- [ ] No hay archivos de SF Pro, SF Symbols ni recursos de Apple en el repositorio.
- [ ] El PR tiene capturas de antes y después.

## 9. Lo que no cambia

- **Reglas del producto:**
  - el rojo es solo para "requiere atención";
  - la prioridad y el estado van con ícono y texto;
  - el vocabulario permitido, los seudónimos y la etiqueta "Dato simulado";
  - la atribución de los datos;
  - sin analítica.
- **Datos y arquitectura:** `DataSource`, `"use cache"`, las rutas, `?entidad=` y `/api/busqueda`.
- **Uso de los componentes compartidos:** sus props, salvo aviso.
