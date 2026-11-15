# Tasks

Lote D · Revisión y transparencia · **André** · ★★ · carpetas `src/features/revision/`, `src/features/etica/` y rutas de revisión, reporte y metodología en `web/` · plan en `docs/plan/cronograma-y-lotes.md`

Sebastián asume la implementación en reemplazo de André por indicación del usuario. Las pantallas de esta entrega se publican con su cuenta en `lote-d/parte-2-dato-simulado-y-rol`.

## 1. D0 · Interfaces y bocetos (Fase 0, sáb 14)

- [x] 1.1 Definir los tipos de la revisión (entrada, estado y rol) y publicar la interfaz `ReviewStore` con una implementación vacía. Verificar que los lotes B y C compilan usándola.
  - Parte 1: contrato y `EmptyReviewStore` exportados desde `features/revision`; tres pruebas de consumo para bandeja y ficha sobre `DataSource`, y revisión de tipos aprobadas. La implementación vacía rechaza escrituras para no fingir que una revisión fue guardada.
- [x] 1.2 Publicar el componente "Dato simulado" para todos los lotes. Verificar que se ve en modo claro y oscuro.
- [ ] 1.3 Bocetar la vista "Revisión", el diálogo de decisión, el reporte y la metodología. Verificar con los comentarios del equipo en el PR.

## 2. D1 · Roles y almacenamiento

- [x] 2.1 Crear el selector de rol (analista, jefatura y auditor), con el aviso de roles simulados y la persistencia del rol elegido. Verificar que el rol sigue elegido después de recargar.
- [x] 2.2 Implementar `LocalReviewStore`, que solo agrega entradas, deriva el estado de la última decisión y avisa si el almacenamiento no está disponible. Verificar con pruebas unitarias.
- [x] 2.3 Implementar `puede(rol, accion)` para los permisos. Verificar con pruebas que el auditor no puede registrar ni asignar.

## 3. D2 · Decisiones e historial

- [x] 3.1 Crear el diálogo "Registrar revisión" con los tres estados y el comentario obligatorio cuando corresponde. Verificar con una prueba que "requiere atención" sin comentario no se guarda.
  - La validación y el almacén de la parte 1 están conectados al diálogo visual. Las pruebas de componente y el recorrido en Edge confirman que una decisión final sin comentario no se guarda y que el error lleva el foco al campo.
- [x] 3.2 Mostrar el historial sin edición, con el rol y la fecha. Verificar que no existen acciones de editar ni borrar y que el estado vigente es el de la última decisión.
  - Historial visual de eventos inmutables, con rol, fecha y hora de Lima, comentario y nota de asignación. Se prueba el estado vigente incluso cuando dos decisiones tienen la misma fecha; no hay acciones de editar ni borrar entradas individuales.
- [x] 3.3 Usar el rojo solo para "requiere atención", con ícono de bandera y texto. Verificar a la vista en modo claro y oscuro.

## 4. D3 · Asignación y vista "Revisión"

- [x] 4.1 Implementar la asignación de casos a un rol con una nota. Verificar que el caso aparece en "Asignados a mí" del rol destinatario.
  - Asignación con nota y consultas conectadas a las tres pestañas. Verificado el cambio de analista a jefatura, la aparición del caso en el destinatario y el filtro por entidad.
- [x] 4.2 Crear `/revision` con las pestañas de asignados a mí, asignados por mí y decididos. Verificar con revisiones de prueba.
- [x] 4.3 Implementar exportar, importar sin duplicados y reiniciar la demo con confirmación. Verificar con una prueba de ida y vuelta que importa dos veces el mismo archivo.

## 5. D4 · Reporte de trazabilidad

- [x] 5.1 Crear `/reporte/[ocid]` con los datos, las tarjetas del Lote C en su variante `print`, el historial, la fuente, la versión de las reglas y la fecha. Verificar en la vista previa de impresión que no aparece la navegación.
  - Parcial: la ruta, los datos, la línea de tiempo, los seis bloques de explicación, el historial local, la fuente, la versión, la fecha y la impresión sin navegación están implementados y verificados. Por decisión explícita del usuario, D permanece independiente y no incorpora los commits de C. El reporte usa las plantillas puras de explicación ya presentes en `main`; sustituir esta presentación por `SignalCard variant="print"` y conectar los diálogos desde las fichas queda pendiente.
  - Integración (15 de noviembre, rama `lote-b/parte-15-integracion-lote-d`): con `main` fusionado, el reporte usa `SignalCard variant="print"` y se retiró `report-explanation.tsx`. Con el build de producción, `/reporte/ocds-fixture-e1-007` mostró las tarjetas S03 y S08 con sus seis bloques y sin casillas, la etiqueta "Dato simulado" en S08 y el historial con la decisión de prueba. No aparecieron la navegación principal ni peticiones a otros orígenes. El CSS de impresión del PR #22 no cambió.

## 6. D5 · Metodología, atribución y lenguaje

- [x] 6.1 Crear `/metodologia` con el catálogo, la fórmula de prioridad, los referentes con sus licencias, la fuente, los límites, la versión y la fecha de corte. Verificar comparándola con `docs/datos/catalogo-de-senales.md` y con el manifiesto.
  - Página visual implementada a partir del catálogo actual y los referentes documentados. Señales activas/desactivadas, pesos, cortes, fuente, exclusiones, correcciones y fechas salen del manifiesto. La prueba usa pesos distintos para comprobar que el ejemplo refleja el paquete. La revisión del catálogo definitivo sigue en 7.2.
- [ ] 6.2 Mostrar la atribución del manifiesto en el pie de todas las pantallas. Verificar en el panel, la bandeja, las fichas y el reporte.
  - Verificada en las pantallas D y en el reporte independiente. Falta comprobar el conjunto con las fichas de C integradas; no se modificaron sus rutas.
  - Integración (15 de noviembre): con las fichas de C en la misma rama, el pie común del layout (atribución del manifiesto, versión de las reglas y enlace a la metodología) se vio en la ficha del proceso y en Revisión. El panel, la bandeja y las fichas usan ese mismo layout. El reporte la muestra en su propio pie, y su prueba lo comprueba. Queda abierta hasta revisar el pie con el paquete público.
- [x] 6.3 Crear la prueba automática de vocabulario con su lista permitida. Verificar que falla al agregar "posible fraude" en un componente de prueba y que pasa con las frases de la metodología.
- [x] 6.4 Confirmar que la app no incluye analítica. Verificar revisando `package.json` y la pestaña de red del navegador durante la demo.

## 7. Accesibilidad (Fase 2)

- [ ] 7.1 Revisar todas las pantallas con la lista de accesibilidad de `docs/diseno/sistema-de-diseno.md` y corregir lo pendiente. Verificar marcando cada punto de la lista.
- [ ] 7.2 Comparar la metodología con el catálogo de señales final antes de la entrega. Verificar que no hay diferencias.

## 8. Verificación del lote

- [ ] 8.1 Ejecutar las pruebas y `npm run build` en verde, y recorrer decisión → asignación → reporte en modo claro y oscuro. Anotar los resultados en el PR de cierre del lote.
  - Verificada esta entrega independiente: 282 pruebas y compilación aprobadas, con recorrido en Edge y capturas claras/oscuras. El cierre completo del lote sigue abierto junto con la integración de C y las revisiones humanas pendientes.
  - Integración con `main` (15 de noviembre): `npm run typecheck`, `npm run lint`, `npm test` (343 pruebas) y `npm run build` en verde. Recorrido con el build de producción en modo oscuro a 1280 px: ficha → decisión → bandeja → Revisión (pestaña "Decididos") → reporte. La ficha y Revisión también se revisaron en modo claro a 375 px. La asignación no se volvió a recorrer en el navegador (la cubre `review-flow.test.tsx`). Sigue abierta hasta la revisión humana del equipo.

## Workflow follow-up

### Verificación de las pantallas independientes · 14 de noviembre de 2026

- Rama `lote-d/parte-2-dato-simulado-y-rol`, creada desde `main`; autoría de Sebastián y publicación con su cuenta, autorizadas por el usuario. No se incorporaron commits ni se modificaron carpetas del Lote C.
- Implementados: cápsula reutilizable de dato simulado, rol persistido, diálogos de decisión/asignación, historial, `/revision`, archivos de revisión, `/metodologia` y reporte independiente. Solo se usan componentes comunes y tokens; los estilos de impresión están limitados al reporte.
- Único cambio de estructura compartida: insertar el selector en el espacio reservado y permitir que los controles de la cabecera pasen a otra fila. El usuario autorizó expresamente ese ajuste tras detectar el desbordamiento.
- `npm ci` completado sin modificar el lockfile. Comprobaciones finales en `web/` con Node 24.22.3 temporal: `npm run typecheck`, `npm run lint`, `npm test` (282/282 en 24 archivos) y `npm run build`, aprobadas.
- Edge sobre la compilación de producción: rol conservado tras recarga; auditor sin acciones de escritura; comentario y nota obligatorios; historial persistido; asignaciones entre roles; exportación real, reinicio cancelado/confirmado e importación doble sin duplicados; listas filtradas por entidad; almacenamiento bloqueado con aviso y modo en memoria.
- Teclado: apertura, recorrido de foco dentro del diálogo y cierre con Escape. Anchos de 375, 768 y 1280 px sin desbordamiento horizontal. Impresión emulada sin barra de acciones, con fondo blanco y texto negro. Un proceso inexistente muestra `notFound` y `noindex`.
- No se detectaron errores de JavaScript ni solicitudes a dominios externos durante el recorrido; `package.json` y el código no incluyen un servicio de analítica.
- Evidencia, alcance y límites: `web/src/features/revision/evidence/interface/README.md`, 12 capturas y `browser-verification.json`.
- Progreso: 14/20. Permanecen abiertas 1.3 (comentarios del equipo), 5.1 (tarjeta print y conexión con C), 6.2 (atribución con fichas integradas), 7.1 (lista completa de accesibilidad y lector de pantalla), 7.2 (catálogo definitivo) y 8.1 (cierre completo del lote). No se afirma haber realizado revisiones humanas.

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
