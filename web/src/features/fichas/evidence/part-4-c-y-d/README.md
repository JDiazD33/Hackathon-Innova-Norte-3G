# Validación integrada de C y D con datos reales

15 de noviembre de 2026 · rama `lote-c/parte-4-validacion-c-y-d`.

La rama parte de `origin/main` (`0fab640`) e incorpora los commits del PR #29, incluida su actualización `d068e30`, con autorización del usuario. Se conserva el trabajo de Joaquín y la autoría de cada commit. El PR #29 y `main` no se fusionan desde esta entrega; el #22 espera la fusión del #29 para cerrarse.

## Cambios propios

- C: los bloques «Datos usados» de S03 y S05 muestran los mínimos recibidos del pipeline; no se fija un porcentaje en las plantillas y se omiten cuando faltan.
- D: la metodología menciona esos mínimos y distingue los grupos comparables de plazos, proveedores y entidades.
- D: las confirmaciones de decisión y asignación se ajustan al ancho del botón y conservan la posición de las acciones vecinas.
- Tres pruebas con el paquete real y otra de metodología cubren la calibración y las señales activas/desactivadas.

S01 y la nomenclatura ya estaban resueltos en el PR #29; no se volvieron a implementar. No se cambian el pipeline, el paquete público, el fixture ni los componentes compartidos. La entrevista queda fuera de esta entrega.

## Datos y comprobaciones finales

Paquete `publico`, contrato 1.1, reglas `2026.11.2`, corte 4 de octubre de 2026: 5 036 procesos, 76 señales, 2 591 proveedores y 127 entidades. Las etapas internas y S08 siguen siendo simuladas y se identifican como tales.

Caso recorrido: `ocds-dgv273-seacev3-1162822`, entidad `PE-CONSUCODE-10046`, proveedor seudonimizado `P0516`. Se usan los archivos públicos de `main`; no se abrieron enlaces a sistemas productivos.

Dependencias instaladas con `npm ci`, sin cambiar el lockfile. Comprobaciones ejecutadas al terminar el código, en `web/`, con Node 24.22.3 temporal:

| Comando | Resultado |
|---|---|
| `npm run typecheck` | Aprobado |
| `npm run lint` | Aprobado, sin avisos |
| `npm test -- --maxWorkers=4` | 353/353 pruebas en 35 archivos |
| `$env:PAQUETE_DATOS='publico'; npm run build` | Aprobado, sin avisos |
| `openspec validate --all --strict` (raíz) | 5 changes válidos |

Los comandos npm se ejecutaron mediante el prefijo `npm exec --yes --package=node@24 -- node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js"`. La CLI de OpenSpec se ejecutó con `npm exec --yes --package=@fission-ai/openspec -- openspec validate --all --strict`.

## Recorrido en Edge

Sobre el build público de producción local, con contextos aislados y comentarios/notas de demostración:

1. Bandeja → búsqueda del identificador → ficha real completa: nomenclatura, datos ausentes, seis bloques, comparación, mínimo configurado, documentos y atribución.
2. Una decisión final sin comentario se rechaza y enfoca el campo. Al guardarla con sustento, la confirmación no desplaza la asignación.
3. La asignación exige nota. Jefatura encuentra el caso en «Asignados a mí» y la decisión aparece en «Decididos».
4. El auditor conserva su rol al recargar y en la ficha tiene historial y reporte, sin registrar ni asignar.
5. El proveedor muestra seudónimo, participación, procesos y S03, sin RUC ni enlace a su identidad.
6. La metodología conserva señales desactivadas y motivos, pesos, versión y atribución del paquete.
7. El reporte reutiliza las tarjetas `print` de C y presenta decisiones/asignaciones del navegador, nomenclatura y atribución. La impresión emulada oculta acciones y conserva papel blanco con texto negro.
8. La atribución exacta aparece en el pie de panel, bandeja, ambas fichas, Revisión, Metodología y reporte.
9. Sin desbordamiento a 375, 768 y 1280 px; también se comprobó reflujo a 640 px con contraste aumentado y movimiento reducido. Zoom real y transparencia reducida quedan dentro de la revisión manual pendiente.
10. Otro contexto claro completa decisión justificada → asignación → reporte con los dos eventos nuevos.
11. Sin errores de JavaScript ni solicitudes HTTP a otros orígenes en los recorridos registrados.

El [registro del navegador](browser-verification.json) contiene resultados y límites. S02 se consulta con el fixture, aparte del build real, porque la fuente no publica plazos suficientes y el paquete la desactiva.

Las capturas del recorrido se tomaron antes de incorporar `d068e30`; el selector de Revisión recibió después ese ajuste de orden y etiquetas. La última integración se verificó con tipos, lint, 353 pruebas y build público. La confirmación de voz se registra por separado a continuación.

## Capturas

| Pantalla | Claro | Oscuro |
|---|---|---|
| Proceso real | [Captura](proceso-real-claro.jpg) | [Captura](proceso-real-oscuro.jpg) |
| Proveedor real | [Captura](proveedor-real-claro.jpg) | [Captura](proveedor-real-oscuro.jpg) |
| Revisión | [Captura](revision-real-claro.jpg) | [Captura](revision-real-oscuro.jpg) |
| Metodología real | [Captura](metodologia-real-claro.jpg) | [Captura](metodologia-real-oscuro.jpg) |
| Reporte integrado | [Captura](reporte-real-claro.jpg) | [Captura](reporte-real-oscuro.jpg) |
| S02 con fixture | [Captura](s02-fixture-claro.jpg) | [Captura](s02-fixture-oscuro.jpg) |

Además: [confirmaciones](acciones-confirmadas.jpg), [ficha móvil](proceso-real-movil.jpg), [contraste y reflujo](proceso-contraste-y-reflow.jpg), [impresión emulada](reporte-real-impresion.jpg) y [reporte del recorrido claro independiente](recorrido-claro-reporte.jpg).

## Lectura por voz y pendientes

Se guardaron los árboles accesibles de [S02](s02-accessibility.yml) y [S03](s03-accessibility.yml). El SVG queda fuera del árbol y en móvil se mantiene la frase equivalente. Eso no acredita una prueba de voz.

La herramienta inició Narrador y abrió su «Resumen de voz». La escritura automática en su búsqueda quedó limitada por Windows, por lo que la prueba se completó con ayuda del usuario. Sebastián confirmó expresamente que escuchó completos ambos resúmenes, con los valores y las aclaraciones indicados abajo. Se cierra C 4.1 como prueba asistida; no se afirma haber grabado audio ni realizado una auditoría completa de accesibilidad. El [registro de voz](narrator-verification.json) distingue la confirmación humana de la inspección automatizada del árbol accesible.

Casos comprobados y guía para repetir la lectura con Narrador y Edge:

1. Con el fixture, abrir `/procesos/ocds-fixture-e1-003` y desplegar S02: percentil 9,7, un 9,7 % con plazo igual o menor y franja central entre 25 y 75.
2. Con el paquete público, abrir `/procesos/ocds-dgv273-seacev3-1162822` y desplegar S03: proveedor 46,3 %, mediana 1,2 %, cuartil superior 3,2 % y límite 6,8 %, con la aclaración de que las referencias no son proveedores individuales.
3. Recorrer encabezados, expansión, datos usados y casillas; comprobar nombre, estado y foco. En móvil la comparación debe entenderse sin el gráfico.
4. Registrar qué se anunció y si hubo repeticiones o pérdidas de contexto. [Guía de Microsoft sobre historial de voz y copia de la última frase](https://support.microsoft.com/en-us/accessibility/windows/narrator/chapter-2-narrator-basics?preview=true).

También quedan abiertos comentarios humanos sobre diseño/comprensión, rondas con usuarios y confirmación del catálogo definitivo. Avance registrado: C 13/16 y D 17/20; no se archivan los changes. Al terminar se cerraron las ventanas de prueba de Edge/Narrador y los servidores temporales, por solicitud del usuario.
