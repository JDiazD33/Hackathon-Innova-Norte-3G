# Verificación de la parte 3 · 14 de noviembre de 2026

Rama: `lote-c/parte-3-comparacion-y-ficha-del-proveedor`, basada en el commit `14b1af9` de la parte 2. Su PR hacia `main` depende del PR #17; no se fusionó ninguno.

## Comprobaciones

- Node 24.22.3 temporal, sin modificar las dependencias del proyecto.
- `npm run typecheck`, `npm run lint`, `npm test` (321 pruebas en 27 archivos) y `npm run build`, en verde. Se usó `npm exec --yes --package=node@24 -c "<comando>"`.
- 23 pruebas nuevas sobre los modelos de comparación, la ventana real de S03, el aislamiento por entidad, montos ausentes y monedas distintas, adjudicaciones compartidas y presentación del proveedor con manifiestos público y local.
- Personas naturales: su nombre no aparece en ninguno de los dos modos, incluso si está presente en la entrada de prueba. En público tampoco aparece el RUC ni el enlace de identidad.
- Producción local en Edge: cinco gráficos en claro y oscuro; solo la frase en móvil; proveedor → proceso conserva la entidad; cambio a otra entidad sin heredar S03; proveedor inexistente; sin errores de ejecución.
- Revisión a 375, 768 y 1280 px, después del ajuste de tamaño, sin desborde horizontal. Las etiquetas de los ejes usan el token de texto secundario de Prisma.
- [Árbol de accesibilidad de S02 y S03](accessibility.md): solo se anuncia el resumen, con los valores y el marcador. **Queda pendiente comprobarlo con un lector de pantalla real; la tarea 4.1 sigue abierta.**

## Comparaciones

S03 muestra el proveedor frente a la mediana y el cuartil superior publicados, con su límite de comparación. Se eligió esta presentación con el criterio delegado por Sebastián: el paquete no contiene participaciones de cada proveedor, y las barras no se etiquetan como si las contuviera.

En S01, la parte del grupo que no tiene dos o más participantes puede incluir cero; se etiqueta «hasta 1», sin afirmar una proporción exacta de procesos con uno.

| Señal | Claro | Oscuro |
|---|---|---|
| S01 | [Ver](comparison-s01-light.jpg) | [Ver](comparison-s01-dark.jpg) |
| S02 | [Ver](comparison-s02-light.jpg) | [Ver](comparison-s02-dark.jpg) |
| S03 | [Ver](comparison-s03-light.jpg) | [Ver](comparison-s03-dark.jpg) |
| S04 | [Ver](comparison-s04-light.jpg) | [Ver](comparison-s04-dark.jpg) |
| S06 | [Ver](comparison-s06-light.jpg) | [Ver](comparison-s06-dark.jpg) |

## Ficha del proveedor

| Ancho | Claro | Oscuro |
|---|---|---|
| 1280 px | [Ver](supplier-light-1280.jpg) | [Ver](supplier-dark-1280.jpg) |
| 768 px | [Ver](supplier-light-768.jpg) | [Ver](supplier-dark-768.jpg) |
| 375 px | [Ver](supplier-light-375.jpg) | [Ver](supplier-dark-375.jpg) |

## Pendientes

- Recorrido con lector de pantalla en S02 y S03 (4.1).
- Diálogo, selector de rol y etiqueta definitiva del Lote D (2.5 y sustitución de la etiqueta provisional).
- Revisión humana del diseño y de las explicaciones, decisión sobre S01 y validación posterior con usuarios (1.1, 1.2 y 6.1).
- Recorrido con datos reales cuando esté el paquete público (7.1).
