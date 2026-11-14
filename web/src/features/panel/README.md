# Panel de la entidad · Lote B (Joaquín)

Cifras clave, señales de la entidad (S05), señales por categoría, tendencia mensual y proveedores con mayor participación.

- **Lógica:** `panel.ts`, con pruebas en `panel.test.ts`. Prepara los datos y escribe el resumen en texto de cada gráfico.
- **Carga:** `cargar.ts`, que se ejecuta en el servidor con `"use cache"`.
- **Interfaz:** `ui/panel-vista.tsx`, un componente cliente. Las revisiones pendientes se calculan en el navegador con `useRevisiones()`.
- **Ruta:** `src/app/(app)/page.tsx`.
- **Spec:** `openspec/changes/lote-b-base-web-panel-y-bandeja/specs/app/exploracion-de-contrataciones/spec.md`
