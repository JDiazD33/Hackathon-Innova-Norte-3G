# Tasks

Lote B · Base web, panel y bandeja · **Joaquín (líder)** · ★★★ · carpetas de B en `web/` y `contracts/` · plan en `docs/plan/cronograma-y-lotes.md`

## 1. B1 · Base web (Fase 0, sáb 14)

- [ ] 1.1 Crear `web/` con create-next-app (TypeScript, App Router, Tailwind CSS, ESLint, carpeta `src/`) y anotar en `CONTRIBUTING.md` la versión de Next.js y los comandos reales. Verificar que `npm run build` termina sin errores.
- [ ] 1.2 Configurar Vitest y Testing Library. Verificar con una prueba de ejemplo que `npm test` pasa.
- [ ] 1.3 Inicializar shadcn/ui y agregar los componentes base del sistema de diseño. Verificar que una página de prueba los muestra en modo claro y oscuro.
- [ ] 1.4 Definir en `globals.css` los tokens de color, de prioridad y de estado, la tipografía y el modo oscuro. Verificar con una herramienta de contraste que todos los pares de texto llegan a 4,5:1.
- [ ] 1.5 Construir la estructura común: barra lateral, cabecera (entidad, buscador, espacio para el rol, fecha de corte y modo demostración) y pie. Verificar navegando solo con el teclado y revisando la vista a 375, 768 y 1280 px.
- [ ] 1.6 Crear `src/config/producto.ts` con el nombre provisional y la estructura de carpetas por lote del `design.md`. Verificar que el nombre aparece en la cabecera y en el título de la pestaña.

## 2. B2 · Contrato y acceso a datos (Fase 0, sáb 14)

- [ ] 2.1 Escribir `contracts/paquete-de-datos.schema.json` a partir del contrato v1, junto con el Lote A. Verificar que los ejemplos del documento del contrato validan.
- [ ] 2.2 Crear el fixture sintético en `web/data/fixture/`: 2 entidades, unos 40 procesos, todas las señales y un expediente simulado. Verificar que valida contra el schema.
- [ ] 2.3 Definir la interfaz `DataSource` y los tipos del contrato, e implementar `StaticDataSource` con `DATA_DIR`. Verificar con pruebas unitarias sobre el fixture.

## 3. B3 · Panel de la entidad

- [ ] 3.1 Implementar el selector de entidad, que actualiza todo el panel. Verificar alternando entre las dos entidades del fixture.
- [ ] 3.2 Mostrar las cifras clave y las señales por categoría. Verificar contra conteos hechos a mano sobre el fixture.
- [ ] 3.3 Mostrar la tendencia mensual y los cinco proveedores con mayor participación, cada gráfico con su resumen en texto. Verificar con el fixture y recorriendo la pantalla con el teclado.

## 4. B4 · Bandeja y búsqueda

- [ ] 4.1 Implementar la bandeja ordenada por puntaje y fecha, con la prioridad (ícono y texto) y los chips de señales. Verificar el orden con una prueba sobre el fixture.
- [ ] 4.2 Agregar los filtros (prioridad, categoría, método, fechas y estado de revisión) y el estado vacío con "Limpiar filtros". Verificar cada filtro con pruebas de componente.
- [ ] 4.3 Mostrar el estado de revisión leyendo el `ReviewStore` del Lote D. Verificar que se ve "Sin revisar" por defecto y el estado nuevo después de registrar una decisión.
- [ ] 4.4 Implementar el buscador global (Ctrl o Cmd + K) por descripción, ocid y seudónimo. Verificar que elegir un resultado abre la ficha correcta.

## 5. B5 · Despliegue y ejecución local

- [ ] 5.1 Desplegar en Vercel con `DATA_DIR=data/publico`. Verificar desde otro dispositivo que el enlace abre el panel, la bandeja y una ficha.
- [ ] 5.2 Documentar en `CONTRIBUTING.md` la ejecución local para la demo (`npm run build` y `npm run start`). Verificar con el Wi-Fi apagado.

## 6. Verificación del lote

- [ ] 6.1 Ejecutar `npm run lint`, `npm test` y `npm run build` en verde, y recorrer bandeja → ficha con datos reales en modo claro y oscuro. Anotar los resultados en el PR de cierre del lote.

## Workflow follow-up

- Archivar el change con `openspec-archive-change` cuando la entrega del Stage-Gate 1 esté confirmada.
