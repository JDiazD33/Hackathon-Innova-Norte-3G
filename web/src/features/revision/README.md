# Revisión humana · Lote D (André)

- **Código (ahora):**
  - **Primero:** tipos e interfaz `ReviewStore` con una implementación vacía, para que B y C la usen.
  - Después, con pruebas:
    - `LocalReviewStore`, un historial que solo agrega entradas, con el estado vigente derivado de la última decisión;
    - permisos `puede(rol, accion)`;
    - validación del comentario obligatorio;
    - asignación de casos;
    - exportar, importar sin duplicar y reiniciar.
- **Interfaz (después):** selector de rol, diálogo "Registrar revisión", vista `/revision` y reporte `/reporte/[ocid]`.
- **Spec:** `openspec/changes/lote-d-revision-y-transparencia/specs/revision/decisiones-de-revision/spec.md`

## API de la parte 1

Importa `ReviewStore`, `EmptyReviewStore` o `LocalReviewStore` desde `@/features/revision`. Los métodos son síncronos; también pueden consumirse con `await` si un adaptador de la pantalla ya lo usa.

- `listReviews(ocid?)` y `getState(ocid)`: historial cronológico y estado de la última decisión. Sin decisión, el estado es `sin_revisar`. Las asignaciones nunca cambian el estado.
- `saveDecision({ ocid, role, state, comment? })`: genera id y fecha, comprueba permisos y agrega un evento. `justificada` y `requiere_atencion` exigen comentario. Los roles son `analista`, `jefatura` y `auditor`.
- `assign({ ocid, role, assignedTo, note })`: asigna a otro rol con una nota. `listAssignedTo(role)` y `listAssignedBy(role)` muestran la asignación vigente de cada caso; las anteriores siguen en el historial.
- `listDecided()`: última decisión final de cada caso. Si un caso vuelve a `en_revision`, deja de aparecer entre los decididos.
- `canReview(role, action)` (también exportada como `puede`): el auditor solo lee y exporta. El almacén también aplica estos permisos a las escrituras.
- `exportReviews()` e `importReviews(json, role)`: formato `{ version: 1, entradas: [...] }`. La importación valida el archivo completo, fusiona por id y rechaza conflictos sin modificar el historial. Los datos exportados no incluyen identidad de quien revisa, solo el rol simulado.
- `resetDemo(role, confirmed)`: exige `confirmed === true` y solo borra `revisiones:v1`. El diálogo de confirmación corresponde a la futura interfaz.

`LocalReviewStore` acepta `{ storage, now, createId }` para pruebas. Sin `storage` intenta usar `window.localStorage`; con `storage: null` funciona solo en memoria. `getSnapshot().warning` contiene el aviso que la pantalla debe mostrar cuando no se puede persistir. Un fallo no borra las entradas en memoria ni sobrescribe un archivo dañado.

`subscribe`, `getSnapshot` y `getServerSnapshot` permiten usar el almacén con `useSyncExternalStore`. El snapshot mantiene su referencia mientras no cambie. La futura interfaz debe llamar `syncFromStorage()` al recibir el evento `storage` de otra pestaña. Antes de escribir también se leen cambios ya guardados por otra instancia; localStorage no ofrece transacciones entre escrituras simultáneas.

La implementación vacía permite consultar sin fingir guardados: sus métodos de escritura rechazan la operación. Ningún almacén ofrece editar o borrar una entrada individual. Son roles de demostración, sin autenticación institucional.

Esta entrega no incluye selector, diálogos, página de revisión ni reporte imprimible.
