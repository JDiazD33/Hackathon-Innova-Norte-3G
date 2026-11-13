# Proposal

## Why

Los cuatro lotes necesitan una base web común y coherente para avanzar en paralelo. Además, la persona usuaria necesita una puerta de entrada que convierta miles de procesos en una bandeja corta y ordenada por prioridad de revisión. Este lote (Joaquín, ★★★) arma esa base, define con el Lote A el contrato de datos y construye las vistas de entrada del producto.

## What Changes

- **Proyecto `web/`:** Next.js + TypeScript + Tailwind CSS + shadcn/ui, con el tema del sistema de diseño en modo claro y oscuro.
- **Estructura común:**
  - barra lateral;
  - cabecera con selector de entidad, buscador, selector de rol, fecha de corte y aviso de modo demostración;
  - pie con la atribución, que llena el Lote D.
- **Contrato del paquete de datos:** JSON Schema en `contracts/`, fixture sintético y acceso a datos mediante `DataSource`, con su implementación estática.
- **Vistas de entrada:**
  - panel de la entidad con cifras clave, señales por categoría, tendencia mensual y proveedores con mayor participación;
  - bandeja priorizada con filtros por prioridad, categoría, método, fechas y estado de la revisión;
  - búsqueda global.
- **Despliegue:** enlace público y ejecución local sin internet para la demostración.

## Capabilities

### New Capabilities

- `app/exploracion-de-contrataciones`: estructura común, panel de la entidad, bandeja priorizada, búsqueda, fecha de corte visible, ejecución sin internet y uso en distintos tamaños de pantalla.

### Modified Capabilities

Ninguna.

## Impact

- **Código nuevo:** `web/` (base, panel y bandeja) y `contracts/paquete-de-datos.schema.json`.
- **Dependencias:** Next.js, React, Tailwind CSS, shadcn/ui (Radix), Recharts y TanStack Table.
- **Despliegue:** Vercel (plan gratuito) o un servicio equivalente.
- **Interfaces que usan otros lotes:** `DataSource`, estructura, tema y componentes base (lotes C y D). La bandeja muestra el estado de revisión que expone el `ReviewStore` del Lote D.
