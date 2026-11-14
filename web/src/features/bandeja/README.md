# Bandeja priorizada y búsqueda · Lote B (Joaquín)

- **Lógica:** `bandeja.ts` (filas, orden y filtros) y `busqueda.ts` (índice y búsqueda sin tildes ni mayúsculas), con pruebas.
- **Carga:** `cargar.ts`, que se ejecuta en el servidor con `"use cache"`. El índice del buscador se sirve en `src/app/api/busqueda/route.ts`.
- **Interfaz:**
  - `ui/bandeja-vista.tsx`: tabla desde 1024 px y tarjetas en pantallas más pequeñas;
  - `ui/filtros.tsx`;
  - el buscador global, en `src/components/layout/buscador.tsx` (Ctrl o Cmd + K).
- **Ruta:** `src/app/(app)/senales/page.tsx`.
- **Spec:** `openspec/changes/lote-b-base-web-panel-y-bandeja/specs/app/exploracion-de-contrataciones/spec.md`
