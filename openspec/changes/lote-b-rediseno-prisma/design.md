# Design

## Context

- La web (Next.js 16, Tailwind CSS 4, shadcn/ui estilo radix-nova) ya tiene panel, bandeja, buscador, selector de entidad, tema y los componentes compartidos `PrioridadBadge`, `EstadoRevisionBadge` y `SinDatos`, que usan los lotes C y D.
- Los tokens viven en `web/src/app/globals.css` (`:root` y `.dark`), y `theme-contrast.test.ts` lee **solo los valores hexadecimales** de esos dos bloques.
- La fuente actual es Geist, y `--font-sans` se define dos veces (por `next/font` y por `@theme`), lo que deja la pila sin alternativa del sistema.
- Las decisiones visuales vienen de la sección 3 a 6 de [`docs/plan/fase-1/lote-b-joaquin.md`](../../../docs/plan/fase-1/lote-b-joaquin.md) y de las páginas de las HIG que lista su sección 2. Las de comportamiento están en `specs/app/identidad-y-apariencia/spec.md`.

## Goals / Non-Goals

**Goals:**
- Que los lotes C y D hereden la apariencia nueva sin tocar su código: mismos nombres de componentes, mismas props y mismos tokens semánticos (`bg-card`, `text-muted-foreground`, `bg-prioridad-alta`…).
- Que todo valor de diseño (color, radio, tipo, sombra, material, curva) sea un token o una utilidad con nombre, para que nadie escriba medidas sueltas.

**Non-Goals:**
- Cambiar rutas, `DataSource`, `"use cache"`, `?entidad=` o `/api/busqueda`.
- Rediseñar las pantallas de los lotes C y D (lo hacen ellos con esta base).
- Imitar los controles de Apple pixel por pixel o usar sus recursos.
- Contraer el título grande en la barra al desplazarse (opcional en el encargo; queda fuera por ahora).

## Decisions

### 1. Tokens: hexadecimales en `:root` y `.dark`; los materiales con `color-mix`
Se reemplazan los valores con la tabla de la sección 3 del encargo. Los tokens nuevos de materiales (`--material-*`) se escriben con `color-mix()` a partir de tokens sólidos, así la prueba de contraste los ignora y los pares de texto siguen comprobándose contra el fondo sólido, que es el peor caso: el vidrio siempre mezcla más del 70 % de la base sólida, y el texto sobre vidrio se compara con `--sidebar`, `--popover` y `--background`. Se agregan a la prueba los pares nuevos que lleve texto (`foreground` sobre `sidebar`, `muted-foreground` sobre `sidebar` y `popover`, `primary` sobre `sidebar` y `accent`).
- *Alternativa:* escribir los materiales en `rgba`. Se descarta porque duplica los valores de claro y oscuro y se desincroniza con la base sólida.

### 2. Tipografía: Inter como variable y la pila en `@theme`
`next/font/google` carga Inter con `variable: "--font-inter"` (se queda en el build y no pide nada a Google en el navegador). `@theme` define `--font-sans: -apple-system, BlinkMacSystemFont, var(--font-inter), "Segoe UI", Roboto, sans-serif` y `--font-mono: ui-monospace, Menlo, Consolas, monospace` (fuentes locales del sistema; no se descarga ninguna). La escala va como utilidades de Tailwind 4 (`--text-titulo-grande`, `--text-titulo-1` … `--text-leyenda`, con `--line-height`, `--font-weight` y `--letter-spacing` en `rem`/`em`). Se borra Geist.
- *Alternativa:* `system-ui` primero. Se descarta porque en Windows y Android puede dar fuentes con métricas muy distintas; la pila del encargo es más predecible.

### 3. Materiales como `@utility` con sus alternativas dentro
`material-barra` (barras y lateral), `material-menu` (menús, popovers, paleta) y `material-hoja` (diálogos y hojas) se definen con `@utility`, y cada una trae anidadas sus alternativas: `@supports not (backdrop-filter: blur(1px))`, `@media (prefers-reduced-transparency: reduce)` y `@media (prefers-contrast: more)` con fondo sólido y borde visible. Así quien usa la utilidad no puede olvidarse de las alternativas.
- *Alternativa:* variantes de Tailwind por separado (`supports-*`, `contrast-more:`). Se descarta porque obliga a repetirlas en cada componente y Tailwind 4 no trae variante para reducir la transparencia.

### 4. Radios, sombras y movimiento como tokens de `@theme`
`--radius-tarjeta` (20 px), `--radius-barra` (24 px), `--radius-item` (12 px), `--radius-menu` (14 px), `--radius-hoja` (28 px) y `rounded-full` para cápsulas. `--shadow-tarjeta` mínima en claro y `none` en oscuro (la elevación en oscuro viene de grises más claros). `--ease-prisma: cubic-bezier(0.32, 0.72, 0, 1)` y duraciones de 150 a 250 ms. Con `prefers-reduced-motion: reduce`, una regla global pone en neutro las variables de `tw-animate-css` (`--tw-enter-scale`, `--tw-enter-translate-*` y las de salida) con `!important`, de modo que solo queda el fundido, y la escala al presionar va con `motion-safe:`.

### 5. Componentes de shadcn/ui: se edita su apariencia, no su API
Se cambian solo las clases de `button`, `card`, `badge`, `input`, `select`, `dialog`, `sheet`, `command`, `table`, `tooltip`, `skeleton`, `popover`, `dropdown-menu`, `checkbox` y `textarea`. Las variantes existentes se conservan y se reinterpretan: `default` = prominente, `secondary` = neutro, `ghost` = plano, `outline` = neutro con borde fino; se agrega `tinted` (acento al 12 %). Se agrega `tabs.tsx` (Radix Tabs con aspecto de control segmentado), que necesita el Lote D para Revisión.
- *Alternativa:* componentes nuevos con otros nombres. Se descarta porque obliga a C y D a migrar.

### 6. Estructura: un armazón cliente con el estado de la barra lateral
`src/app/(app)/layout.tsx` sigue siendo un componente de servidor que lee el manifiesto y las entidades. Un componente cliente `Armazon` (en `components/layout/`) guarda si la barra lateral está oculta (con `localStorage` como comodidad, protegido con `try/catch`) y reparte las zonas por ancho:
- **≥ 1024 px:** barra lateral flotante en vidrio, con grupos "Revisar" e "Información" y botón para ocultarla;
- **768–1023 px:** la barra lateral se abre con un botón como hoja (`MenuMovil`, que ya existe);
- **< 768 px:** `BarraDePestanas` inferior en vidrio con `env(safe-area-inset-bottom)`, y el buscador se abre con un ícono.

`NAVEGACION` gana un campo `grupo`, sin cambiar sus rutas. `TituloDePagina` (título grande, frase y espacio para acciones) queda en `components/layout/` para todas las pantallas.

### 7. Marca e ícono
Ícono propio en SVG (`app/icon.svg`): un triángulo que separa un rayo en tres haces azul, índigo y verde azulado, dentro de un cuadrado redondeado. `app/apple-icon.png` (180 × 180) se genera una vez desde el SVG con un script local y se sube; se borra el `favicon.ico` genérico. El nombre se cambia solo en `src/config/producto.ts`.

### 8. Parte 6: filtro de prioridad como control segmentado de una sola opción
`FiltrosBandeja.prioridades` sigue siendo un arreglo; el control segmentado escribe `[]` (Todas) o `[nivel]`. La lógica de `bandeja.ts` y sus pruebas no cambian. Las fechas pasan a un popover "Fechas" y la barra de filtros queda fija en vidrio bajo la barra superior.

## Risks / Trade-offs

- [El vidrio baja el contraste del texto sobre contenido claro] → la mezcla mínima es de 72 % de la base sólida, el texto se comprueba contra la base y el contenido en reposo (arriba de la página) no queda detrás de las barras.
- [`prefers-reduced-transparency` no existe en todos los navegadores] → la alternativa de `@supports not` y la de `prefers-contrast: more` cubren el resto; donde no hay soporte, el vidrio se ve como siempre.
- [Cambiar la apariencia de `button` o `card` altera pantallas de C y D que ya existan en sus ramas] → las props no cambian; se avisa a Sebastián y André en el PR con capturas, y traen `main` con `git merge origin/main`.
- [Los textos de 17 px agrandan la bandeja] → la tabla usa el estilo Subtítulo (15 px), como pide la escala.
- [Inter sin internet en el build] → `next/font` descarga la fuente durante el build; en la demo sin internet se usa el build ya hecho, que la incluye.

## Migration Plan

1. Parte 5 en `lote-b/parte-5-prisma-base`: tokens, tipografía, materiales, estructura, componentes y documentación, con PR y capturas de antes y después.
2. Parte 6 en `lote-b/parte-6-prisma-panel-y-bandeja`, sobre la parte 5.
3. **Volver atrás:** revertir el commit del PR en `main` o usar *Rollback* en Vercel.
