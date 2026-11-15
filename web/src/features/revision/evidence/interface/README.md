# Evidencia de las pantallas del Lote D

Entrega de Sebastián en `lote-d/parte-2-dato-simulado-y-rol`, independiente de los PR del Lote C, por decisión del usuario. Verificación realizada el 14 de noviembre de 2026 con el fixture sintético del repositorio, reglas `fixture-1`.

## Resultado por parte

| Parte | Resultado verificado | Capturas |
|---|---|---|
| Dato simulado y rol | Cápsula neutra reutilizable; analista, jefatura y auditor; aviso de simulación y persistencia tras recarga | [Metodología clara](metodologia-claro.jpg), [oscura](metodologia-oscuro.jpg) |
| Decisión e historial | Tres estados; comentario obligatorio en decisiones finales; error junto al campo con foco; historial sin edición, con rol y fecha/hora | [Diálogo claro](decision-claro.jpg), [oscuro](decision-oscuro.jpg) |
| Revisión y asignación | Tres pestañas; nota obligatoria; asignación a otro rol; filtro por entidad; exportar, importar y reiniciar con confirmación | [Revisión clara](revision-claro.jpg), [oscura](revision-oscuro.jpg), [móvil](revision-movil.jpg) |
| Metodología | Catálogo y referentes; licencias, límites, fórmula con ejemplo y valores del manifiesto; exclusiones y correcciones | [Clara](metodologia-claro.jpg), [oscura](metodologia-oscuro.jpg), [móvil](metodologia-movil.jpg) |
| Reporte independiente | Datos, línea de tiempo, seis bloques por señal, historial local, atribución, versión y fechas; impresión sin navegación | [Claro](reporte-claro.jpg), [oscuro](reporte-oscuro.jpg), [impresión](reporte-impresion.jpg), [móvil](reporte-movil.jpg) |

El rojo aparece con bandera y texto únicamente en el estado humano «Requiere atención». Los errores de formulario usan el tratamiento neutro de foco. El papel del reporte permanece blanco incluso con el tema oscuro.

## Comprobaciones finales

Dependencias instaladas con `npm ci`; no cambió el lockfile. Los comandos de comprobación se ejecutaron en `web/` con Node 24.22.3 temporal, sin cambiar la instalación del sistema:

```text
npm run typecheck  → aprobado
npm run lint       → aprobado, sin avisos
npm test           → 282 pruebas aprobadas en 24 archivos
npm run build      → aprobado, sin avisos
```

Para ejecutar esos comandos con la misma versión temporal se utilizó este prefijo, sustituyendo al final el comando correspondiente:

```powershell
npm exec --yes --package=node@24 -- node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" run typecheck
```

Las ocho pruebas nuevas de componente cubren el rechazo de decisiones sin comentario, cancelación, permisos al cambiar de rol, asignación con nota, historial con fechas iguales, reinicio confirmado que conserva el rol, metodología con pesos diferentes y contenido del reporte. El resto de la suite comprueba los contratos, almacenamiento, permisos, privacidad, vocabulario y funcionalidad existente.

## Recorrido en el navegador

Microsoft Edge en modo headless mediante Playwright, sobre `next start` en `http://127.0.0.1:3004`. Contextos nuevos y datos de revisión sintéticos, sin reutilizar información del navegador del usuario. El [registro del recorrido](browser-verification.json) contiene doce comprobaciones y los orígenes observados.

1. Cambiar a auditor y recargar: persiste el rol; aparecen lectura y exportación, sin registrar, asignar, importar ni reiniciar.
2. Como analista, seleccionar `ocds-fixture-e1-007`. «Requiere atención» vacío no guarda; muestra el error y enfoca el comentario. Completarlo guarda el estado y el historial.
3. Asignar a jefatura: la nota vacía se rechaza. Con nota, el caso aparece en «Asignados por mí» del analista y «Asignados a mí» de jefatura. La decisión aparece en «Decididos».
4. Exportar un archivo de dos entradas. Cancelar el reinicio conserva ambas; confirmarlo las elimina y conserva el rol. Importar dos veces añade dos entradas la primera vez y cero la segunda; la recarga las conserva.
5. Cambiar de entidad oculta los casos de la otra entidad.
6. Abrir el diálogo con Enter, recorrerlo con Tab y cerrarlo con Escape: el foco permanece dentro mientras está abierto.
7. Recorrer metodología y reporte en claro y oscuro. El reporte incluye las dos revisiones, los seis bloques por señal, marcas de simulación y atribución.
8. Emular impresión: la barra de acciones desaparece; documento y papel tienen fondo blanco, con texto negro. La captura demuestra los estilos de impresión; no sustituye la comprobación humana del diálogo de impresión ni su paginación final.
9. Recorrer las tres pantallas a 375, 768 y 1280 px sin desbordamiento horizontal, incluida la cabecera con el ajuste autorizado por el usuario.
10. Un identificador inexistente muestra el estado de proceso no encontrado y `noindex`.
11. Bloquear localStorage en otro contexto muestra el aviso y permite registrar en memoria.
12. Sin errores de JavaScript ni solicitudes HTTP a otros orígenes durante el recorrido. Revisión de dependencias y código sin un servicio de analítica.

## Pendientes explícitos

- Mantener D independiente: los diálogos aún no están conectados a las fichas de C. Los enlaces a `/procesos/[ocid]` respetan el contrato de rutas, pero esa pantalla espera la integración de C.
- El reporte usa las funciones puras de explicación y línea de tiempo ya disponibles en `main`. Falta sustituir su presentación de explicación por la tarjeta visual `SignalCard` de C en variante `print`; por eso la tarea 5.1 permanece abierta.
- Falta verificar la atribución con las fichas de C integradas, recibir comentarios del equipo sobre las pantallas, realizar la lista completa de accesibilidad con lector de pantalla y comparar con el catálogo definitivo tras las decisiones del equipo.
- El cierre completo del lote y el archivado esperan esas verificaciones. No se fusiona este PR ni se modifica `main`.
