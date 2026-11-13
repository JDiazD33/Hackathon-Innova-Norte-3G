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
