# Tasks

Lote D · Revisión y transparencia · **André** · ★★ · carpetas `src/features/revision/`, `src/features/etica/` y rutas de revisión, reporte y metodología en `web/` · plan en `docs/plan/cronograma-y-lotes.md`

## 1. D0 · Interfaces y bocetos (Fase 0, sáb 14)

- [x] 1.1 Definir los tipos de la revisión (entrada, estado y rol) y publicar la interfaz `ReviewStore` con una implementación vacía. Verificar que los lotes B y C compilan usándola.
  - Parte 1: contrato y `EmptyReviewStore` exportados desde `features/revision`; tres pruebas de consumo para bandeja y ficha sobre `DataSource`, y revisión de tipos aprobadas. La implementación vacía rechaza escrituras para no fingir que una revisión fue guardada.
- [ ] 1.2 Publicar el componente "Dato simulado" para todos los lotes. Verificar que se ve en modo claro y oscuro.
- [ ] 1.3 Bocetar la vista "Revisión", el diálogo de decisión, el reporte y la metodología. Verificar con los comentarios del equipo en el PR.

## 2. D1 · Roles y almacenamiento

- [ ] 2.1 Crear el selector de rol (analista, jefatura y auditor), con el aviso de roles simulados y la persistencia del rol elegido. Verificar que el rol sigue elegido después de recargar.
- [ ] 2.2 Implementar `LocalReviewStore`, que solo agrega entradas, deriva el estado de la última decisión y avisa si el almacenamiento no está disponible. Verificar con pruebas unitarias.
- [ ] 2.3 Implementar `puede(rol, accion)` para los permisos. Verificar con pruebas que el auditor no puede registrar ni asignar.

## 3. D2 · Decisiones e historial

- [ ] 3.1 Crear el diálogo "Registrar revisión" con los tres estados y el comentario obligatorio cuando corresponde. Verificar con una prueba que "requiere atención" sin comentario no se guarda.
- [ ] 3.2 Mostrar el historial sin edición, con el rol y la fecha. Verificar que no existen acciones de editar ni borrar y que el estado vigente es el de la última decisión.
- [ ] 3.3 Usar el rojo solo para "requiere atención", con ícono de bandera y texto. Verificar a la vista en modo claro y oscuro.

## 4. D3 · Asignación y vista "Revisión"

- [ ] 4.1 Implementar la asignación de casos a un rol con una nota. Verificar que el caso aparece en "Asignados a mí" del rol destinatario.
- [ ] 4.2 Crear `/revision` con las pestañas de asignados a mí, asignados por mí y decididos. Verificar con revisiones de prueba.
- [ ] 4.3 Implementar exportar, importar sin duplicados y reiniciar la demo con confirmación. Verificar con una prueba de ida y vuelta que importa dos veces el mismo archivo.

## 5. D4 · Reporte de trazabilidad

- [ ] 5.1 Crear `/reporte/[ocid]` con los datos, las tarjetas del Lote C en su variante `print`, el historial, la fuente, la versión de las reglas y la fecha. Verificar en la vista previa de impresión que no aparece la navegación.

## 6. D5 · Metodología, atribución y lenguaje

- [ ] 6.1 Crear `/metodologia` con el catálogo, la fórmula de prioridad, los referentes con sus licencias, la fuente, los límites, la versión y la fecha de corte. Verificar comparándola con `docs/datos/catalogo-de-senales.md` y con el manifiesto.
- [ ] 6.2 Mostrar la atribución del manifiesto en el pie de todas las pantallas. Verificar en el panel, la bandeja, las fichas y el reporte.
- [ ] 6.3 Crear la prueba automática de vocabulario con su lista permitida. Verificar que falla al agregar "posible fraude" en un componente de prueba y que pasa con las frases de la metodología.
- [ ] 6.4 Confirmar que la app no incluye analítica. Verificar revisando `package.json` y la pestaña de red del navegador durante la demo.

## 7. Accesibilidad (Fase 2)

- [ ] 7.1 Revisar todas las pantallas con la lista de accesibilidad de `docs/diseno/sistema-de-diseno.md` y corregir lo pendiente. Verificar marcando cada punto de la lista.
- [ ] 7.2 Comparar la metodología con el catálogo de señales final antes de la entrega. Verificar que no hay diferencias.

## 8. Verificación del lote

- [ ] 8.1 Ejecutar las pruebas y `npm run build` en verde, y recorrer decisión → asignación → reporte en modo claro y oscuro. Anotar los resultados en el PR de cierre del lote.

## Workflow follow-up

- Archivar el change con `openspec-archive-change` cuando la entrega del Stage-Gate 1 esté confirmada.
