# 0008 · Nombre Prisma y diseño inspirado en las guías de Apple

**Contexto.**

- El nombre del producto estaba pendiente. El [ADR 0006](0006-convencion-de-nombres.md) dejó un solo lugar para definirlo.
- La interfaz funciona y está publicada, pero el equipo quiere que se vea de primer nivel.
- Las guías de diseño de Apple (Human Interface Guidelines, HIG) son públicas y están muy probadas. En 2025 se actualizaron con el material Liquid Glass y en 2026 se refinaron. Priorizan claridad, jerarquía y accesibilidad, que es lo que necesita una herramienta de revisión.
- Las fuentes y los símbolos de Apple tienen licencias que no permiten servirlos en un sitio web para cualquier dispositivo.

**Decisión.**

- **El producto se llama Prisma.** Un prisma descompone la luz en sus colores; Prisma descompone los datos de contrataciones en señales que una persona puede entender y revisar. El nombre vive en `web/src/config/producto.ts`.
- **Toda la interfaz se rediseña con el lenguaje visual de las HIG:**
  - el contenido primero;
  - controles y navegación en una capa de vidrio translúcido sobre el contenido;
  - color con moderación;
  - la fuente del sistema con su escala de estilos;
  - movimiento sutil.
- **Es inspiración, no copia** ([ADR 0003](0003-referentes-sin-copiar.md)):
  - no se descargan ni se sirven SF Pro ni New York. La pila de fuentes empieza por la del sistema (en un dispositivo Apple se ve SF Pro porque la pone el sistema) y sigue con Inter (SIL Open Font License);
  - no se usan SF Symbols, porque su licencia los limita a apps de plataformas Apple. Seguimos con lucide-react (ISC);
  - no se usan logos, capturas, kits de interfaz ni recursos gráficos de Apple;
  - no decimos que Prisma sea de Apple ni que Apple lo avale.
- **Se mantiene la base técnica del [ADR 0005](0005-web-nextjs-shadcn.md)** (Next.js, Tailwind CSS y shadcn/ui). Cambian los tokens, la estructura y la apariencia de los componentes, no la arquitectura.
- **Las reglas del producto mandan sobre el estilo:**
  - el rojo es solo para "requiere atención" ([ADR 0007](0007-senales-no-acusaciones.md));
  - el contraste cumple WCAG 2.2 AA;
  - nada se comunica solo con color.

**Consecuencias.**

- **Quién:** Joaquín (Lote B) lidera el rediseño, porque el tema, la estructura y los componentes base son suyos. C y D construyen sus pantallas con ese diseño ([encargos de la Fase 1](../plan/fase-1/README.md)).
- **Qué se actualiza:** `docs/diseno/sistema-de-diseno.md`, los tokens de `web/src/app/globals.css` y su prueba de contraste.
- **Alternativas al vidrio:** fondo sólido si el navegador no soporta `backdrop-filter` o si la persona pide reducir la transparencia o aumentar el contraste.
- **Contraste de los colores de Apple:** no siempre llegan a 4,5:1 como texto. El azul `#007AFF` sobre blanco da 4,0:1, así que se usan variantes más oscuras.
- **Marca:** "Prisma" ya lo usan otras organizaciones y productos. Para la hackathon no es un problema, pero si el proyecto sigue después hay que revisar el registro de marcas en Indecopi.
