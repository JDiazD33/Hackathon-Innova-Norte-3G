# Fase 1 · Qué hace cada uno (dom 15 – jue 19)

Encargos del siguiente tramo. Al 14 de noviembre ya están en `main` la parte de código de los cuatro lotes, el panel y la bandeja, y la web está publicada en <https://hackathon-innova-norte-3g.vercel.app>. El plan general está en [`cronograma-y-lotes.md`](../cronograma-y-lotes.md).

## Novedades

- **Nombre:** el producto se llama **Prisma** ([ADR 0008](../../adr/0008-prisma-y-diseno-inspirado-en-apple.md)).
- **Diseño:** toda la interfaz se rediseña con el lenguaje visual de las guías de Apple (Human Interface Guidelines), sin usar sus recursos.
  - Lo lidera Joaquín, porque el tema, la estructura y los componentes base son del Lote B.
  - Sebastián y André construyen sus pantallas con ese diseño.
- **Despliegue:** cada push a `main` actualiza el enlace público ([detalle](../../../CONTRIBUTING.md#despliegue)).

## Encargos

| Persona | Lote | Qué hace ahora | Su MD |
|---|---|---|---|
| Joaquín | B | Rediseño Prisma (base, panel y bandeja), datos reales en Vercel y demo sin internet | [lote-b-joaquin.md](lote-b-joaquin.md) |
| Stefano | A | Propuesta de decisiones de señales, paquete público y verificación en el SEACE | [lote-a-stefano.md](lote-a-stefano.md) |
| Sebastián | C | Tarjeta de señal, ficha del proceso y ficha del proveedor | [lote-c-sebastian.md](lote-c-sebastian.md) |
| André | D | "Dato simulado", rol, diálogo de decisión, historial, Revisión, Metodología y Reporte | [lote-d-andre.md](lote-d-andre.md) |

## Orden y dependencias

| Cuándo | Qué | Quién | Desbloquea |
|---|---|---|---|
| dom 15 | Propuesta de decisiones de señales (A 1.6) en un PR; los cuatro la aprueban hasta el lunes | Stefano | El texto de S01 y el paquete público |
| dom 15 | Base Prisma: nombre, tokens, tipografía, materiales, estructura y componentes | Joaquín | Las pantallas de C y D con el diseño final |
| dom 15 | Componente "Dato simulado" (D 1.2) | André | La tarjeta de S08 y la ficha del proceso |
| lun 16 | Panel y bandeja rediseñados | Joaquín | — |
| lun 16 – mar 17 | Tarjeta de señal y ficha del proceso (C); diálogo de decisión e historial (D) | Sebastián y André | **H1 (mar 17):** bandeja → ficha → explicación → decisión → reporte, con el fixture |
| mié 18 | Paquete público en `main` y `PAQUETE_DATOS=publico` en Vercel | Stefano y Joaquín | **H2 (jue 19):** el mismo flujo con datos reales |
| lun 16 – mié 18 | Una entrevista de problema cada uno | Todos; coordina Joaquín | La ficha del problema v1 |

**Mientras la base Prisma no esté en `main`:**

- arma la estructura, los datos y las pruebas de tus pantallas con los componentes que ya existen, sin colores ni medidas propias;
- cuando se fusione, trae `main` a tu rama con `git merge origin/main` (sin rebase) y ajusta.

## Reglas de siempre

- Antes de empezar, lee `AGENTS.md`, `CONTRIBUTING.md`, tu change de OpenSpec y tu MD.
- Una rama por parte, PR hacia `main` y revisión de otra persona. Nadie fusiona su propio PR.
- Commits solo con tu cuenta de GitHub, sin `Co-Authored-By` ni firmas de herramientas de IA.
- Antes de cada push, las comprobaciones en verde:
  - web: `npm run typecheck`, `npm run lint`, `npm test` y `npm run build`;
  - pipeline: `uv run pytest`, `uv run ruff check` y `uv run ruff format --check`.
- **Lenguaje:** "señal", "amerita revisión" o "prioridad de revisión". Nunca "corrupción", "fraude" ni "irregular".
- **Diseño:**
  - solo tokens y componentes comunes; nada de colores ni medidas fijas;
  - el rojo es solo para "requiere atención";
  - todo se ve en modo claro y oscuro, y se puede usar con el teclado.

## Entrevistas de problema (lun 16 – mié 18)

Cada uno hace al menos una. Joaquín coordina a quién entrevista cada uno: logística o abastecimiento, control interno, el profesor con experiencia en el sector público o el contacto del Poder Judicial. Son 20 a 30 minutos.

**Antes:**

- pide permiso para tomar notas;
- aclara que no se graba ni se publica su nombre. En los documentos va como "Entrevista 1, control interno, entidad pública de La Libertad".

**Preguntas:**

1. ¿Cómo eligen hoy qué procesos de contratación revisar? ¿Quién lo decide y con qué criterio?
2. ¿Cuántos procesos revisan al mes y cuántas personas lo hacen?
3. ¿De dónde sacan la información: SEACE, expedientes, hojas de cálculo u otras áreas?
4. Cuéntame la última vez que una revisión llegó tarde o se pasó un caso. ¿Qué habría ayudado?
5. Si una herramienta dijera "este proceso amerita revisión porque tuvo un solo participante", ¿qué necesitarías ver para confiar en esa señal?
6. ¿Qué te haría desconfiar de ella o no usarla? ¿Quién tendría que aprobar su uso?

**Después:**

- escribe tus notas el mismo día y sácale una frase textual para el pitch;
- pásale todo a Joaquín para la [ficha del problema](../../entregables/ficha-del-problema.md).
