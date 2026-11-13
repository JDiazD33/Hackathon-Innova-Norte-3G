# Tasks

Lote D · Revisión y transparencia · **André** · ★★ · carpetas `src/features/revision/`, `src/features/etica/` y rutas de revisión, reporte y metodología en `web/` · plan en `docs/plan/cronograma-y-lotes.md`

La parte 1 de código la asume Sebastián en reemplazo de André.

## 1. D0 · Interfaces y bocetos (Fase 0, sáb 14)

- [x] 1.1 Definir los tipos de la revisión (entrada, estado y rol) y publicar la interfaz `ReviewStore` con una implementación vacía. Verificar que los lotes B y C compilan usándola.
  - Parte 1: contrato y `EmptyReviewStore` exportados desde `features/revision`; tres pruebas de consumo para bandeja y ficha sobre `DataSource`, y revisión de tipos aprobadas. La implementación vacía rechaza escrituras para no fingir que una revisión fue guardada.
- [ ] 1.2 Publicar el componente "Dato simulado" para todos los lotes. Verificar que se ve en modo claro y oscuro.
- [ ] 1.3 Bocetar la vista "Revisión", el diálogo de decisión, el reporte y la metodología. Verificar con los comentarios del equipo en el PR.

## 2. D1 · Roles y almacenamiento

- [ ] 2.1 Crear el selector de rol (analista, jefatura y auditor), con el aviso de roles simulados y la persistencia del rol elegido. Verificar que el rol sigue elegido después de recargar.
- [x] 2.2 Implementar `LocalReviewStore`, que solo agrega entradas, deriva el estado de la última decisión y avisa si el almacenamiento no está disponible. Verificar con pruebas unitarias.
- [x] 2.3 Implementar `puede(rol, accion)` para los permisos. Verificar con pruebas que el auditor no puede registrar ni asignar.

## 3. D2 · Decisiones e historial

- [ ] 3.1 Crear el diálogo "Registrar revisión" con los tres estados y el comentario obligatorio cuando corresponde. Verificar con una prueba que "requiere atención" sin comentario no se guarda.
  - Parte 1: `validateDecision` y el almacén impiden guardar "justificada" o "requiere atención" sin comentario; permiten iniciar "en revisión" sin él. Pendiente el diálogo visual.
- [ ] 3.2 Mostrar el historial sin edición, con el rol y la fecha. Verificar que no existen acciones de editar ni borrar y que el estado vigente es el de la última decisión.
  - Parte 1: historial de eventos inmutables, con rol y fecha, sin métodos para editar ni borrar entradas individuales. Pendiente la presentación del historial.
- [ ] 3.3 Usar el rojo solo para "requiere atención", con ícono de bandera y texto. Verificar a la vista en modo claro y oscuro.

## 4. D3 · Asignación y vista "Revisión"

- [ ] 4.1 Implementar la asignación de casos a un rol con una nota. Verificar que el caso aparece en "Asignados a mí" del rol destinatario.
  - Parte 1: asignación con nota y consultas de asignados al rol, asignados por el rol y casos decididos, probadas con reasignaciones y reapertura de casos. Pendiente conectarlas a la vista.
- [ ] 4.2 Crear `/revision` con las pestañas de asignados a mí, asignados por mí y decididos. Verificar con revisiones de prueba.
- [x] 4.3 Implementar exportar, importar sin duplicados y reiniciar la demo con confirmación. Verificar con una prueba de ida y vuelta que importa dos veces el mismo archivo.

## 5. D4 · Reporte de trazabilidad

- [ ] 5.1 Crear `/reporte/[ocid]` con los datos, las tarjetas del Lote C en su variante `print`, el historial, la fuente, la versión de las reglas y la fecha. Verificar en la vista previa de impresión que no aparece la navegación.

## 6. D5 · Metodología, atribución y lenguaje

- [ ] 6.1 Crear `/metodologia` con el catálogo, la fórmula de prioridad, los referentes con sus licencias, la fuente, los límites, la versión y la fecha de corte. Verificar comparándola con `docs/datos/catalogo-de-senales.md` y con el manifiesto.
  - Parte 1: contenido en `features/etica/metodologia.ts`, a partir del catálogo y de referentes; señales activas, pesos, cortes, fuente y fechas tomados del manifiesto. Pendiente la página visual y la revisión final tras el trabajo de datos.
- [ ] 6.2 Mostrar la atribución del manifiesto en el pie de todas las pantallas. Verificar en el panel, la bandeja, las fichas y el reporte.
- [x] 6.3 Crear la prueba automática de vocabulario con su lista permitida. Verificar que falla al agregar "posible fraude" en un componente de prueba y que pasa con las frases de la metodología.
- [ ] 6.4 Confirmar que la app no incluye analítica. Verificar revisando `package.json` y la pestaña de red del navegador durante la demo.

## 7. Accesibilidad (Fase 2)

- [ ] 7.1 Revisar todas las pantallas con la lista de accesibilidad de `docs/diseno/sistema-de-diseno.md` y corregir lo pendiente. Verificar marcando cada punto de la lista.
- [ ] 7.2 Comparar la metodología con el catálogo de señales final antes de la entrega. Verificar que no hay diferencias.

## 8. Verificación del lote

- [ ] 8.1 Ejecutar las pruebas y `npm run build` en verde, y recorrer decisión → asignación → reporte en modo claro y oscuro. Anotar los resultados en el PR de cierre del lote.

## Workflow follow-up

### Verificación de la parte 1 · Revisión y transparencia (13 de noviembre de 2026)

- Rama independiente desde `main`: `lote-d/parte-1-revision-logica`; no incorpora los commits del lote C.
- Contrato inicial separado en el commit `228ba31`, con tres pruebas de consumo tipado para bandeja y fichas. No se modificaron carpetas de otros lotes.
- Alcance del archivo de trabajo: tipos e interfaz, implementación vacía, almacenamiento local inyectable, permisos, validación de comentarios, asignación y consultas, exportación/importación/reinicio, vocabulario y contenido de metodología. Toda esa lógica está implementada y probada.
- `npm test`: 92 pruebas aprobadas en 8 archivos (25 de la base y 67 nuevas).
- `npm run typecheck` y `npm run lint`: sin errores. Comprobaciones ejecutadas con Node 24.22.3 temporal y las dependencias ya instaladas desde el lockfile, sin cambiar la instalación del sistema.
- La prueba de vocabulario detecta el componente de ejemplo con el término prohibido y acepta las frases justificadas de metodología únicamente en ese archivo. Se excluyen solo el archivo de esa prueba y el de su lista.
- Persistencia probada con almacenamiento inyectado: recarga, errores de lectura/escritura/borrado, recuperación en memoria, historial inmutable, reasignación, importación repetida, conflictos por id y reinicio con confirmación.
- Las tareas con pantallas siguen abiertas: selector de rol, diálogos, vistas, reporte, metodología visual, atribución, etiqueta de dato simulado y accesibilidad. Se harán cuando esté disponible la estructura del lote B; no son parte de esta entrega de lógica.
- No se ejecutó la verificación de cierre 8.1: requiere pantallas completas y la demo de decisión → asignación → reporte. Tampoco se afirma completada la revisión de red 6.4 ni la revisión final del catálogo 7.2.

- Archivar el change con `openspec-archive-change` cuando la entrega del Stage-Gate 1 esté confirmada.
