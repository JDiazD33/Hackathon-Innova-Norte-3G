# Lote D · André · Revisión, metodología y reporte, con el diseño Prisma

**Objetivo:** que una persona registre su decisión con trazabilidad, que el equipo reparta casos y que cualquiera pueda ver cómo se calculan las señales.

**Lo que ya existe (parte 1, en `src/features/revision/` y `src/features/etica/`):**

- **Revisiones:** tipos, `ReviewStore` y `LocalReviewStore`.
- **Permisos y validación:** `canReview` y `validateDecision`.
- **Consultas:** `assignedTo`, `assignedBy` y `decidedCases`.
- **Archivo de revisiones:** exportar e importar.
- **Ética:** la prueba de vocabulario y el contenido de la metodología.

Ahora van las pantallas.

> Si esta semana no puedes tomar el lote a este ritmo, avísale hoy a Joaquín para reorganizarlo. Sebastián y Joaquín dependen de tus primeras piezas.

**Fechas:**

| Cuándo | Qué |
|---|---|
| dom 15 – lun 16 | "Dato simulado" y selector de rol |
| lun 16 – mar 17 | Diálogo de decisión e historial (para el H1) |
| mar 17 – mié 18 | Revisión y metodología |
| mié 18 – jue 19 | Reporte |

## 1. Antes de empezar

1. `git switch main && git pull`, y crea la rama `lote-d/parte-2-dato-simulado-y-rol`.
2. Lee completos:
   - `AGENTS.md`, `CONTRIBUTING.md` y `web/AGENTS.md` (Next 16 trae cambios: consulta `web/node_modules/next/dist/docs/` antes de escribir código de Next);
   - `web/README.md`, sobre todo "Cómo crear una pantalla";
   - `docs/diseno/sistema-de-diseno.md` y los ADR 0007 y 0008;
   - [el README de la Fase 1](README.md) y este documento;
   - `openspec/changes/lote-d-revision-y-transparencia/`;
   - el código que ya existe en `src/features/revision/` y `src/features/etica/`.
3. Con OpenSpec: `/opsx:apply lote-d-revision-y-transparencia` en Claude Code o `$openspec-apply-change` en Codex. Marca `[x]` solo lo terminado y verificado.
4. Prepara la web: `cd web && npm ci && npm test`.

## 2. Diseño: Prisma, con las guías de Apple

Joaquín rediseña la base con las [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) de Apple el domingo 15 (ver su [MD](lote-b-joaquin.md)). Tus pantallas usan ese diseño.

**Cómo trabajar con la base:**

- Usa solo tokens y componentes comunes (`src/components/ui/` y `src/components/estado/`). Nada de colores, sombras ni medidas fijas.
- Si la base Prisma todavía no está en `main`, avanza con la estructura, los datos y las pruebas. Cuando se fusione, `git merge origin/main` en tu rama (sin rebase) y ajusta.
- Antes de maquetar, lee de la HIG:
  - [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets);
  - [Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls);
  - [Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables);
  - [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts);
  - [Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback);
  - [Writing](https://developer.apple.com/design/human-interface-guidelines/writing).

**Patrones para tus pantallas:**

| Parte | Cómo se ve |
|---|---|
| "Dato simulado" | Cápsula pequeña y neutra (ni ámbar ni rojo), con ícono y texto, en claro y oscuro |
| Selector de rol | Botón emergente en la barra superior, en el espacio que dejó Joaquín ("Aquí va el selector de rol del Lote D"), con el aviso "Roles simulados" |
| Diálogo "Registrar revisión" | Hoja (sheet) con un control segmentado de tres estados con ícono y texto: En revisión, Justificada y Requiere atención. Comentario obligatorio cuando corresponde, con el error junto al campo. Botón principal "Registrar" en cápsula y "Cancelar" plano |
| Rojo | Solo en "requiere atención", siempre con la bandera y el texto (3.3) |
| Historial | Lista cronológica (lo más reciente arriba) con estado, rol, fecha y comentario, sin acciones de editar ni borrar |
| `/revision` | Título grande y control segmentado con tres pestañas: Asignados a mí, Asignados por mí y Decididos. Filas de lista con el estado y un chevron, y estados vacíos amables |
| `/metodologia` | Página de lectura de unos 720 px de ancho, con títulos jerárquicos, tablas en estilo de lista agrupada y la fórmula de prioridad explicada con un ejemplo |
| `/reporte/[ocid]` | Hoja de impresión limpia: sin vidrio ni navegación, texto oscuro sobre blanco, y un encabezado con Prisma, la fecha y la fuente. Según el `design.md` del Lote B va en `src/app/reporte/[ocid]/`, fuera de la estructura común |

## 3. Qué hacer, en orden

### Parte 2 · "Dato simulado" y rol (dom 15 – lun 16)

Desbloquea a Sebastián.

1. **"Dato simulado" (1.2):** el componente en `src/features/etica/`, exportado para que lo usen la tarjeta de S08 y la línea de tiempo. Verifícalo en modo claro y oscuro.
2. **Selector de rol (2.1):**
   - analista, jefatura y auditor, con el aviso de roles simulados;
   - el rol elegido sigue elegido después de recargar;
   - ponlo en el espacio de la cabecera, en `src/app/(app)/layout.tsx`. Es un archivo de Joaquín: toca solo esa línea y pídele la revisión.

### Parte 3 · Decisión e historial (lun 16 – mar 17)

Rama `lote-d/parte-3-decision-e-historial`. Es para el H1.

3. **Diálogo "Registrar revisión" (3.1):** con `validateDecision` y el almacén de `src/lib/revisiones.ts`. Una prueba debe comprobar que "requiere atención" sin comentario no se guarda.
4. **Historial (3.2) y el rojo solo para "requiere atención" (3.3).**
5. **Para la ficha de Sebastián (C 2.5):** exporta el diálogo y el historial. Avísale en cuanto estén en `main`.

### Parte 4 · Revisión y metodología (mar 17 – mié 18)

Rama `lote-d/parte-4-revision-y-metodologia`.

6. **Asignación con nota (4.1) y la vista `/revision` (4.2).**
7. **Página `/metodologia` (6.1):** con el contenido de `src/features/etica/metodologia.ts` y los datos del manifiesto. Revísala de nuevo cuando el equipo apruebe las decisiones de señales de Stefano.

### Parte 5 · Reporte (mié 18 – jue 19)

Rama `lote-d/parte-5-reporte`.

8. **`/reporte/[ocid]` (5.1):**
   - con la tarjeta de señal de Sebastián en su variante `print`, el historial, la fuente, la versión de las reglas y la fecha;
   - en la vista previa de impresión no aparece la navegación.
9. **Atribución en todas las pantallas (6.2):** el reporte incluido.
10. **Sin analítica (6.4):** revisa `package.json` y la pestaña de red del navegador.

## 4. También esta semana

- **Entrevista:** una entrevista de problema ([guía](README.md#entrevistas-de-problema-lun-16--mié-18)).
- **Diapositivas del pitch:** eres el responsable. Arma la estructura a partir de `docs/entregables/pitch.md`; la versión 1 es para el H3 (mar 24) y Joaquín te pasa el guion.

## Reglas

- **Carpetas:** solo `src/features/revision/`, `src/features/etica/`, tus rutas (`/revision`, `/metodologia` y `/reporte`) y tu `tasks.md`. Lo compartido (`src/lib/`, `src/components/` y la estructura) es de Joaquín: si necesitas un cambio, pídeselo.
- **Lenguaje:** "señal", "amerita revisión" o "prioridad de revisión". Nunca "corrupción", "fraude" ni "irregular". La prueba de vocabulario debe seguir en verde.
- **Privacidad:** roles simulados, sin datos personales de quien usa la app y sin analítica.
- **Commits:** solo tu cuenta de GitHub, sin `Co-Authored-By` ni firmas de herramientas de IA. Push solo de tu rama, PR hacia `main`, sin fusionarlo tú y sin rebase.
- **Antes de cada push** (desde `web/`): `npm run typecheck`, `npm run lint`, `npm test` y `npm run build`, en verde.

## Al cerrar cada parte, entrega

- La rama y el SHA del último commit.
- Las tareas completadas y cómo se verificaron: comandos y resultados.
- Capturas en claro y oscuro.
- Los pendientes y bloqueos.
