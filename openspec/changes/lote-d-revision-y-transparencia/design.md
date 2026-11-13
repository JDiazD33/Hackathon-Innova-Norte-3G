# Design

## Context

En el MVP no hay backend ni inicio de sesión (ADR 0001 y ADR 0002). Las revisiones deben funcionar en el navegador de cada persona y verse en la bandeja (Lote B) y en la ficha (Lote C). La metodología y la atribución deben reflejar `docs/datos/catalogo-de-senales.md`, `docs/producto/referentes-internacionales.md` y el manifiesto del paquete. La motivación está en `proposal.md`.

## Goals / Non-Goals

**Goals:**

- Que el flujo de revisión se sienta real en la demo (decidir, asignar, ver el historial e imprimir el reporte) sin servidor.
- Un historial que no se pueda alterar desde la interfaz.
- Que la transparencia y el lenguaje no acusatorio se verifiquen de forma automática, no solo por buena voluntad.

**Non-Goals:**

- Inicio de sesión, revisiones compartidas entre computadoras y permisos reales (fase 2 de la ruta de escalamiento).
- Firma digital del reporte.

## Decisions

1. **`ReviewStore` como registro de eventos que solo agrega entradas.**
   - **Entrada:** `{ id, ocid, tipo: "decision" | "asignacion", estado?, comentario?, asignado_a?, nota?, rol, fecha }`.
   - **Estado vigente:** se deriva de la última decisión.
   - **Almacenamiento:** `localStorage`, con la clave `revisiones:v1`. Los componentes se actualizan con `useSyncExternalStore`.
   - *Alternativa:* guardar solo el estado actual. Se descartó porque pierde el historial que exige el reporte de trazabilidad.
   - *Alternativa:* IndexedDB. Es innecesario para el volumen de una demo.
2. **Interfaz publicada el primer día.** El sábado 14, D publica los tipos, la interfaz `ReviewStore` con una implementación vacía y el componente "Dato simulado", para que B y C compilen desde la Fase 0.
3. **Rol en un contexto de React**, guardado en `localStorage` con la clave `rol:v1`. Los permisos se resuelven con una función pura `puede(rol, accion)`, fácil de probar.
4. **Exportar e importar.** El archivo exportado es un JSON `{ version: 1, entradas: [...] }`. Al importar se fusiona por `id`, así que no se duplican entradas. El reinicio pide confirmación.
5. **Reporte fuera de la estructura común.** Vive en `src/app/reporte/[ocid]/`, con estilos `@media print`, y se imprime o se guarda como PDF desde el navegador. Usa la variante `print` de la tarjeta de señal del Lote C.
6. **Verificación del vocabulario con Vitest.**
   - La prueba recorre los textos de `src/**/*.{ts,tsx}` y busca las palabras prohibidas sin distinguir mayúsculas ni tildes.
   - Las frases que la metodología necesita, como "una señal no prueba corrupción", están en una lista permitida en `src/features/etica/vocabulario.ts`.
7. **Contenido de la metodología en `src/features/etica/metodologia.ts`**, redactado a partir del catálogo de señales y del documento de referentes. Cuando cambia el catálogo, la parte D5 incluye revisar la coherencia entre ambos.

## Risks / Trade-offs

- [Cada miembro del jurado ve solo sus propias revisiones] → es lo esperado sin backend. Para la demo se puede importar un archivo de revisiones preparado.
- [La prueba de vocabulario da falsos positivos con palabras como "irregularidad" en citas de normas] → se agregan a la lista permitida con un comentario que justifique cada caso.
- [La metodología se desactualiza respecto del catálogo] → en la Fase 2, una tarea compara ambos documentos antes de la entrega.
