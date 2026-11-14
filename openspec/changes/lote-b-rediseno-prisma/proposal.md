# Proposal

## Why

La interfaz funciona y está publicada, pero todavía lleva un nombre provisional y una apariencia genérica. El equipo eligió el nombre **Prisma** y decidió rediseñar toda la interfaz con el lenguaje visual de las guías públicas de Apple (Human Interface Guidelines), sin usar sus recursos ([ADR 0008](../../../docs/adr/0008-prisma-y-diseno-inspirado-en-apple.md)). La base visual va primero porque Sebastián (Lote C) y André (Lote D) construyen sus pantallas encima ([encargo](../../../docs/plan/fase-1/lote-b-joaquin.md)).

## What Changes

- **Nombre:** "Prisma" en `web/src/config/producto.ts`, que sigue siendo el único lugar donde se define. La cabecera y el título de la pestaña lo toman de ahí. Ícono propio en `web/src/app/icon.svg` y `web/src/app/apple-icon.png`.
- **Tipografía:** la pila empieza por la fuente del sistema y sigue con Inter (SIL OFL), cargada con `next/font/google` para que quede dentro del build. Reemplaza a Geist. Escala de estilos en `rem`, de "Título grande" a "Leyenda".
- **Color:** tokens nuevos en claro y oscuro, tomados de los colores del sistema de Apple y oscurecidos donde hace falta. La prueba de contraste (`theme-contrast.test.ts`) sigue mandando: 4,5:1 en texto, 3:1 en el foco y rojo solo en "requiere atención".
- **Materiales:** vidrio translúcido solo en la capa de controles y navegación (barra lateral, barra superior, barra de filtros, menús, paleta del buscador, hojas y pestañas del celular), con alternativas sólidas cuando no hay `backdrop-filter`, cuando se pide reducir la transparencia o aumentar el contraste.
- **Estructura:** barra lateral flotante con grupos y que se puede ocultar, barra superior fija, título grande en cada página, barra de pestañas inferior en el celular y pie discreto.
- **Componentes:** apariencia nueva de los componentes de shadcn/ui (botones en cápsula, tarjetas sin borde, control segmentado, hojas, paleta) y de los compartidos (`PrioridadBadge`, `EstadoRevisionBadge`, `SinDatos`) **sin cambiar sus props**. Nuevos componentes de estructura: `TituloDePagina` y `ControlSegmentado`.
- **Movimiento:** transiciones breves con propósito; con "reducir movimiento" solo cambia la opacidad.
- **Panel y bandeja (parte 6):** rediseñados con la base nueva, con estados de carga y vacíos, y pruebas de componente de los filtros.
- **Documentación:** `docs/diseno/sistema-de-diseno.md` y "Cómo crear una pantalla" en `web/README.md`.

No hay cambios que rompan la compatibilidad: se conservan las rutas, `DataSource`, `"use cache"`, `?entidad=`, `/api/busqueda` y las props de los componentes compartidos.

## Capabilities

### New Capabilities
- `app/identidad-y-apariencia`: nombre del producto en un solo lugar, tema Prisma (tipografía, color y materiales), estructura de la pantalla y adaptaciones de accesibilidad (contraste, reducir movimiento, reducir transparencia y alto contraste).

### Modified Capabilities
<!-- Ninguna: openspec/specs/ aún no tiene specs archivadas. La estructura de navegación de
     `app/exploracion-de-contrataciones` vive en el change en curso lote-b-base-web-panel-y-bandeja
     y su comportamiento no cambia. -->

## Impact

- **Código (Lote B):** `web/src/app/globals.css`, `web/src/app/layout.tsx`, `web/src/app/(app)/layout.tsx`, `web/src/config/producto.ts`, `web/src/components/ui/`, `web/src/components/layout/`, `web/src/components/estado/`, `web/src/features/panel/ui/`, `web/src/features/bandeja/ui/` y la prueba de contraste.
- **Lotes C y D:** heredan la apariencia nueva sin cambiar su código; las props de los componentes compartidos no cambian.
- **Dependencias:** ninguna nueva. Inter se descarga en el build con `next/font/google`, así que la demo sigue funcionando sin internet.
- **Licencias:** no se agregan SF Pro, New York, SF Symbols ni recursos de Apple. lucide-react (ISC) e Inter (SIL OFL) ya están citados o se citan en `docs/producto/referentes-internacionales.md`.
