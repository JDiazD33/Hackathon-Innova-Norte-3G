# Fichas de proceso y proveedor · Lote C (Sebastián)

- **Código (ahora):** funciones puras con pruebas para:
  - unir las fechas oficiales del proceso con las etapas del expediente simulado en una línea de tiempo ordenada, con las etapas simuladas marcadas;
  - decidir qué identidad mostrar de un proveedor según el modo del manifiesto (`publico` o `local`) y su tipo: las personas naturales nunca muestran su nombre.
- **Interfaz:** `/procesos/[ocid]`, con resumen, documentos, señales, línea de tiempo, historial y el estado "No encontramos este proceso". La ficha del proveedor corresponde a la parte 3.
- **Spec:** `openspec/changes/lote-c-fichas-y-explicacion/specs/app/fichas-de-proceso-y-proveedor/spec.md`

## API de la parte 1

Exportaciones desde `index.ts`:

- `buildProcessTimeline(process, expediente?)`: devuelve las seis etapas del proceso y las etapas internas del expediente que tenga el mismo `ocid`. Ordena por instante, conserva el orden original en empates y coloca las fechas desconocidas al final con `formattedDate: "Sin dato"`. Cada evento incluye su origen, responsable y documento cuando existen; las etapas internas llevan `isSimulated: true` y `badge: "Dato simulado"`. Las fechas del proceso también conservan su marca `simulado`.
- `getSupplierIdentity(supplier, manifest.modo)`: devuelve solo `displayName`, `taxId` y `profileUrl`, sin modificar el proveedor. En público devuelve el seudónimo y los otros dos campos nulos. En local permite RUC y enlace HTTPS; solo muestra nombre si el tipo es persona jurídica y el RUC no empieza con 10. Si falta el nombre, usa el seudónimo.

Las pruebas cubren el fixture mediante `StaticDataSource`, fechas nulas, zonas horarias, expedientes ajenos y datos identificables presentes por error en modo público.

## API de la parte 2

- `loadProcessDetail(source, ocid)`, en `process-detail.ts`: obtiene los datos por `DataSource`, conserva la entidad propietaria del proceso, ordena las señales por su peso y construye la línea de tiempo. Devuelve `null` si no existe el proceso.
- `loadProcessPage(ocid)`, en `load-process.ts`: lectura de servidor con `use cache` y `cacheLife("max")`.
- `ProcessView`, en `ui/process-view.tsx`: presentación con los tokens y componentes comunes. No lee archivos ni recalcula las señales.
- `ProcessHistory`, en `ui/process-history.tsx`: historial y estado desde `useRevisiones()`, sin otro almacén.

La ruta espera `params` como `Promise` dentro de `Suspense` y usa `notFound()` con una vista propia. Prerenderiza una muestra del paquete para la navegación compartida que consulta `usePathname`; las demás fichas se resuelven al abrirlas. Se comprobó una ruta que no estaba prerenderizada y un identificador inexistente.

**Dependencia pendiente:** el diálogo de decisión, el selector de rol y la etiqueta definitiva del Lote D no están en `main`. El historial está conectado, pero la tarea 2.5 permanece abierta hasta poder integrar el botón y comprobar los roles analista y auditor.

Las capturas y el registro de verificación están en [`evidence/part-2/`](evidence/part-2/README.md).
