# Verificación de la parte 2 · 14 de noviembre de 2026

Rama: `lote-c/parte-2-tarjeta-y-ficha-del-proceso`.

## Comprobaciones

- Instalación: `npm ci`, con el lockfile sin cambios.
- Runtime de comprobación: Node 24.22.3 temporal; la instalación del sistema sigue en Node 22.20.
- Base antes de implementar: `npm test`, 274 pruebas aprobadas en 21 archivos.
- Nuevas pruebas: 24 aprobadas en 3 archivos. Cubren todas las señales del fixture, los seis bloques, la variante `print`, datos ausentes, notas de calidad, enlaces, tooltip en el foco, carga y presentación de fichas.
- Comprobaciones finales desde `web/`: `npm run typecheck`, `npm run lint`, `npm test` (298 pruebas, 24 archivos) y `npm run build`, todas en verde. Se ejecutaron mediante `npm exec --yes --package=node@24 -c "<comando>"` para usar el runtime requerido.
- `openspec validate --all --strict`: 5 changes válidos, sin errores.
- Recorrido en Edge, con la construcción de producción: bandeja → `ocds-fixture-e1-003` → explicación.
- Teclado: Tab alcanza el desglose de prioridad; Enter abre la explicación y los datos usados; Escape cierra el tooltip.
- Claro y oscuro a 375 y 1280 px; oscuro a 768 px. Sin desborde horizontal en los tres anchos.
- Historial: una decisión sintética guardada en `revisiones:v1` aparece tras recargar, mediante el almacén común.
- Rutas: `ocds-fixture-e2-001` funciona sin estar prerenderizada; `ocid-que-no-existe` muestra el mensaje previsto, el regreso a señales y `noindex`. Sin errores de ejecución ni de hidratación.

## Capturas

| Vista | Claro | Oscuro |
|---|---|---|
| Ficha, 1280 px | [Ver](process-light-1280.jpg) | [Ver](process-dark-1280.jpg) |
| Explicación completa | [Ver](signal-light.jpg) | [Ver](signal-dark.jpg) |
| Ficha, 375 px | [Ver](process-light-375.jpg) | [Ver](process-dark-375.jpg) |
| Ficha, 768 px | — | [Ver](process-dark-768.jpg) |

## Pendientes

- La tarea 2.5 requiere el diálogo y selector de rol del Lote D. El historial ya lee el almacén existente.
- La etiqueta «Dato simulado» es provisional, como permite el diseño del change.
- La revisión de comprensión por otra persona, los comentarios sobre el diseño y la decisión del texto de S01 requieren al equipo.
- La comparación visual y la ficha de proveedor corresponden a la parte 3. El recorrido con datos reales espera el paquete público.
