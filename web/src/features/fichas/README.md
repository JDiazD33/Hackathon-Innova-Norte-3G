# Fichas de proceso y proveedor · Lote C (Sebastián)

- **Código (ahora):** funciones puras con pruebas para:
  - unir las fechas oficiales del proceso con las etapas del expediente simulado en una línea de tiempo ordenada, con las etapas simuladas marcadas;
  - decidir qué identidad mostrar de un proveedor según el modo del manifiesto (`publico` o `local`) y su tipo: las personas naturales nunca muestran su nombre.
- **Interfaz (después):** rutas `/procesos/[ocid]` y `/proveedores/[id]`, documentos, historial de revisión y estado "No encontramos este proceso".
- **Spec:** `openspec/changes/lote-c-fichas-y-explicacion/specs/app/fichas-de-proceso-y-proveedor/spec.md`

## API de la parte 1

Exportaciones desde `index.ts`:

- `buildProcessTimeline(process, expediente?)`: devuelve las seis etapas del proceso y las etapas internas del expediente que tenga el mismo `ocid`. Ordena por instante, conserva el orden original en empates y coloca las fechas desconocidas al final con `formattedDate: "Sin dato"`. Cada evento incluye su origen, responsable y documento cuando existen; las etapas internas llevan `isSimulated: true` y `badge: "Dato simulado"`. Las fechas del proceso también conservan su marca `simulado`.
- `getSupplierIdentity(supplier, manifest.modo)`: devuelve solo `displayName`, `taxId` y `profileUrl`, sin modificar el proveedor. En público devuelve el seudónimo y los otros dos campos nulos. En local permite RUC y enlace HTTPS; solo muestra nombre si el tipo es persona jurídica y el RUC no empieza con 10. Si falta el nombre, usa el seudónimo.

Las pruebas cubren el fixture mediante `StaticDataSource`, fechas nulas, zonas horarias, expedientes ajenos y datos identificables presentes por error en modo público. Queda pendiente conectar estas funciones a las fichas visuales.
