# Fases y lotes

Mismo esquema que en la hackathon anterior: **fases** con criterios de salida, **un lote por persona** con sus partes, **un change de OpenSpec por lote** y una rama por parte. Así cada uno avanza en paralelo sin pisar el trabajo de los demás.

**Meta:** entregar el Stage-Gate 1 el **miércoles 25 de noviembre antes de las 6:00 p. m.** (el cierre oficial es a las 11:59 p. m.) con las cuatro piezas completas y una demo estable.

## Equipo y lotes

> Reparto propuesto, con el mismo patrón de la vez anterior: Stefano lleva el lote más difícil y la integración; André entra en el lugar de Kenzo. El equipo puede intercambiar partes; si lo hace, actualiza esta tabla.

| Lote | Persona | Dificultad | Qué entrega | Change de OpenSpec | Dónde trabaja |
|---|---|---|---|---|---|
| **A · Datos y señales** | Stefano | ★★★★ | Spike, ingesta, señales S01–S06, Cardinal, prioridad, paquete de datos seudonimizado e **integración** | [`lote-a-datos-y-senales`](../../openspec/changes/lote-a-datos-y-senales/) | `pipeline/` |
| **B · Base web, panel y bandeja** | Joaquín (líder) | ★★★ | Proyecto Next.js, tema, estructura, contrato y fixture, `DataSource`, panel, bandeja, búsqueda y despliegue | [`lote-b-base-web-panel-y-bandeja`](../../openspec/changes/lote-b-base-web-panel-y-bandeja/) | `web/` (base, panel y bandeja), `contracts/` |
| **C · Fichas y explicación** | Sebastián | ★★★ | Ficha del proceso, tarjeta de señal (el corazón del producto), comparación visual y ficha del proveedor | [`lote-c-fichas-y-explicacion`](../../openspec/changes/lote-c-fichas-y-explicacion/) | `web/` (fichas y explicación) |
| **D · Revisión y transparencia** | André | ★★ | Roles simulados, decisiones, asignación, historial, reporte de trazabilidad, metodología, atribución y lenguaje no acusatorio | [`lote-d-revision-y-transparencia`](../../openspec/changes/lote-d-revision-y-transparencia/) | `web/` (revisión, reporte y metodología) |

### Entregables: cada uno tiene una pieza

| Pieza | Responsable | Apoyo |
|---|---|---|
| Contacto con la organización y preguntas abiertas | Joaquín | — |
| Ficha del problema y coordinación de entrevistas | Joaquín | Todos (cada uno hace al menos una entrevista) |
| Ficha técnica | Stefano | Joaquín |
| Plan de validación y pruebas con usuarios | Sebastián | Todos |
| Diapositivas del pitch | André | Joaquín (guion) |
| Video de respaldo de la demo | Stefano | André |

## Cómo encajan los lotes

| Punto de contacto | Lo define | Lo usa | Mientras tanto |
|---|---|---|---|
| [Contrato del paquete de datos](../arquitectura/contrato-paquete-de-datos.md) y su JSON Schema | A con B (Fase 0) | B, C y D | Fixture sintético de B |
| `DataSource` (lectura de datos) | B | C y D | — |
| Estructura, tema y componentes base | B | C y D | — |
| `ReviewStore` (revisiones) | D | B (estado en la bandeja) y C (historial en la ficha) | Implementación vacía que devuelve listas vacías |
| Tarjeta de señal | C | D (reporte de trazabilidad) | Vista simple de B |
| Vocabulario permitido y prohibido | D (verificación automática) | Todos | Lista de `docs/diseno/sistema-de-diseno.md` |

**Reglas para no chocar:**

- Cada lote toca solo sus carpetas. Lo compartido (estructura, tema, contrato) lo cambia su dueño mediante un PR.
- Un PR por parte, pequeño y revisado por otra persona.
- **Integración:** Stefano integra los PR en `main`, como en la hackathon anterior. Es una propuesta y el equipo la confirma.

## Orden de trabajo: primero el código, después la interfaz

Acordado el 13 de noviembre. Cada lote termina primero su **lógica con pruebas**: funciones puras, sin pantallas ni estilos. Después construye la **interfaz visual** encima. Así las pantallas se montan sobre código que ya funciona y no hay que rehacerlas. Los números son tareas del `tasks.md` de cada lote.

| Lote | 1. Código (ahora) | 2. Interfaz (después) |
|---|---|---|
| A · Stefano | Todo el lote es código: grupos 1 a 5 (spike, ingesta, señales, prioridad y paquete de datos) | — |
| B · Joaquín | **Hecho el 13:** 1.1, 1.2, 2.1, 2.2 y 2.3 (base web, pruebas, contrato, fixture y `DataSource`). **Sigue:** la lógica de 3.2 (cifras del panel), 4.1 (orden), 4.2 (filtros) y 4.4 (índice de búsqueda) | 1.3 a 1.6 (shadcn/ui, tema y estructura), 3.1, 3.3, las pantallas de 3.2 y 4.x, y 5.x (despliegue) |
| C · Sebastián | 1.2 y 3.2 (textos de explicación como plantillas con pruebas), y la lógica de 2.3 (línea de tiempo), 3.4 (desglose de la prioridad), 4.1 (frase de comparación) y 5.2 (identidad según el modo) | 1.1, 2.1, 2.2, 2.4, 2.5, 3.1, 3.3, los gráficos de 4.1 y 5.1 |
| D · André | 1.1 (tipos e interfaz `ReviewStore`, **primero**), 2.2, 2.3, la lógica de 3.1, 3.2 y 4.1, 4.3, 6.3 (prueba de vocabulario) y el contenido de 6.1 | 1.2, 1.3, 2.1, los diálogos de 3.x, 4.2, 5.1, la página de 6.1, 6.2 y 7.x |

**La interfaz empieza** cuando B tenga el tema y la estructura (1.3 a 1.5), porque C y D construyen sus pantallas encima.

## Estado al 14 de noviembre

**Integrado en `main`:** la parte de código de los lotes A, C y D. Del Lote A entraron los PR #1 a #7; de C y D, las ramas `lote-c/parte-1-textos-y-logica` y `lote-d/parte-1-revision-logica`. Con todo unido pasan 158 pruebas de la web y 145 del pipeline, y el lint, los tipos y el build están en verde. La parte 1 del Lote D la hizo Sebastián, en reemplazo de André.

**Siguiente, en orden:**

| # | Qué | Quién | Por qué ahora |
|---|---|---|---|
| 1 | Decidir el ajuste del contrato y de las señales (tarea 1.6 del Lote A): `numero_postores` como participantes registrados, S02 y S06 desactivadas, umbrales de S04, mínimos de S03 y S05, y métodos dudosos | Los cuatro; propone Stefano | Cambia los textos y el fixture |
| 2 | Alinear las claves de `entradas` del fixture con el [catálogo](../datos/catalogo-de-senales.md#entradas-de-cada-señal) | Joaquín | Hoy el fixture usa claves que el pipeline no produce (S02, S03, S04 y S08) |
| 3 | Ajustar los textos de S01 ("participantes registrados"), S03 (`procesos_ganados` y `procesos_entidad`) y S08 (`misma_persona` y `pago_sin_conformidad_documentada`) | Sebastián | Con datos reales, esas frases no aparecen o son inexactas |
| 4 | Lógica del panel y la bandeja (B 3.2 y 4.x) | Joaquín | Es lo único del código que falta |
| 5 | Base visual: shadcn/ui, tema y estructura (B 1.3 a 1.6) | Joaquín | C y D construyen sus pantallas encima |
| 6 | Revisar el paquete público, subir `web/data/publico/` y probar la web con `PAQUETE_DATOS=publico` (A 5.4) | Stefano y Joaquín | La demo usa datos reales |
| 7 | Pantallas de C (fichas y tarjeta de señal) y de D (revisión, reporte, metodología y pie) | Sebastián y André | Después del punto 5 |
| 8 | Entrevistas de problema (lun 16 a mié 18) | Joaquín coordina; cada uno hace una | Criterios 1 y 4 (30 puntos) |
| 9 | Verificar en el SEACE los casos de S01 y S03 (A 3.4 y 4.5) | Stefano | Respaldo de las señales ante el jurado |

**Actualización (14 de noviembre, tarde):** los puntos 2, 4 y 5 están hechos en las ramas `lote-b/parte-3-logica-y-fixture` y `lote-b/parte-4-interfaz`, con sus PR. También se ajustaron a las claves del catálogo los textos de S03 y S08 del Lote C. Con la base visual, Sebastián y André ya pueden construir sus pantallas (ver "Cómo crear una pantalla" en `web/README.md`).

## Fase 0 · Cimientos (vie 13 – sáb 14)

**Objetivo:** que los cuatro puedan trabajar en paralelo desde el domingo sin bloquearse.

| Lote | Partes |
|---|---|
| — | Documentos, ADR y changes de OpenSpec (**hecho el 13**) |
| A | **A1 · Spike de datos:** responder Q1–Q8 de `docs/datos/fuente-de-datos.md` con un año de datos |
| B | **B1 · Base web** y **B2 · Contrato:** hechos el 13 (proyecto Next.js con pruebas, JSON Schema, fixture sintético y `DataSource`). Del B1 falta la parte visual (tema y estructura), que va en la fase de interfaz |
| C | **C0 · Bocetos:** ficha del proceso y tarjeta de señal en papel o en Figma; textos v0 de S01–S04 |
| D | **D0 · Bocetos:** modelo de revisión (estados, roles e historial) y página de metodología |
| Joaquín | Inscripción; agenda de entrevistas desde el lunes 16 |

**Sale cuando (H0):**

- `web/` corre con el fixture;
- los cuatro aprobaron el contrato v1;
- el spike está respondido con cifras.

## Fase 1 · MVP funcional (dom 15 – jue 19)

| Lote | Partes |
|---|---|
| A | **A2** Ingesta y normalización de La Libertad · **A3** S01 y S02 · **A4** S03, S04 y contraste con Cardinal · **A5** Prioridad, seudonimización y paquete real |
| B | **B3** Panel de la entidad · **B4** Bandeja con filtros y búsqueda · **B5** Despliegue y ejecución local sin internet |
| C | **C1** Ficha del proceso y línea de tiempo · **C2** Tarjeta de señal · **C3** Comparación visual con resumen en texto · **C4** Ficha del proveedor |
| D | **D1** Roles y `ReviewStore` · **D2** Registrar decisión e historial · **D3** Asignación y vista "Revisión" · **D4** Reporte de trazabilidad · **D5** Metodología, atribución y verificación del lenguaje |
| Entregables | Entrevistas de problema (lun 16 – mié 18) · ficha del problema v1 |

**Hitos:**

- **H1 · mar 17:** el flujo bandeja → ficha → explicación → decisión → reporte funciona con el fixture.
- **H2 · jue 19:** el mismo flujo funciona con datos reales de La Libertad.

## Fase 2 · Validación y pulido (vie 20 – mar 24)

| Lote | Partes |
|---|---|
| A | **A6** S05 y S06 si los datos alcanzan · integración final · correcciones de datos |
| B | Correcciones de la prueba · rendimiento · despliegue estable |
| C | Ajuste de textos según lo que no se entendió en las pruebas |
| D | Accesibilidad pantalla por pantalla · modo oscuro · correcciones |
| Entregables | **Pruebas con usuarios:** vie 20 y lun 23 · plan de validación con resultados · ficha técnica · guion de la demo · talleres del 23 y del 24 |

**Sale cuando (H3, mar 24):**

- los resultados de las pruebas están incorporados;
- la demo está desplegada y estable;
- las cuatro piezas están en versión 1.

## Fase 3 · Entrega y final (mié 25 – vie 27)

| Día | Qué pasa |
|---|---|
| **mié 25** | Congelar el código · **entregar antes de las 6:00 p. m.** · video de respaldo · taller de pitch a las 7:00 p. m. |
| jue 26 | Si somos finalistas: DITT de 12:00 m a 6:00 p. m. Mentoría, ensayo y revisión técnica |
| vie 27 | Pitch de 2:15 a 4:45 p. m. (5 min de exposición + 5 min de preguntas) |

**Sale cuando (H4):** la entrega está confirmada por la organización.

> Las entrevistas y pruebas con personas del sector público solo se pueden hacer en **días hábiles**: lunes 16 a viernes 20 y lunes 23 a miércoles 25.

## Ramas

Formato: `lote-<letra>/parte-<n>-<tema>`. Por ejemplo, `lote-a/parte-1-spike-datos`, `lote-b/parte-2-contrato` o `lote-d/parte-4-reporte`. Cada parte termina con un PR que nombra las comprobaciones que se ejecutaron.

## Definición de terminado

- **Spike:** las preguntas Q1–Q8 están respondidas en `docs/datos/fuente-de-datos.md`, con cifras.
- **Señal:**
  - regla y parámetros en la configuración;
  - pruebas con un caso positivo, uno negativo y uno con datos faltantes;
  - 5 resultados reales verificados contra el SEACE;
  - ficha actualizada en el catálogo.
- **Pantalla:** funciona con el fixture y con datos reales, en modo claro y oscuro, con el teclado y con el texto revisado.
- **Entregable:** está completo según la plantilla, otra persona del equipo lo revisó y está exportado en el formato de entrega.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Los datos no permiten calcular S01 o S02 | Media | Alto | Spike el sábado 14; reemplazar por S05 o S06 |
| No conseguimos entrevistados del sector público | Media | Alto | Activar desde el sábado al profesor con experiencia pública, al contacto del Poder Judicial y la oficina de logística de la universidad |
| No se conoce el canal de entrega | Media | Alto | Preguntar a la organización; tener todo exportado en PDF y enlaces |
| Conflictos entre ramas | Media | Medio | Carpetas por lote, PR pequeños y contrato acordado en la Fase 0 |
| Falla la demo en vivo | Baja | Alto | Ejecución local y video de respaldo |

## Registro de decisiones

| Fecha | Decisión | Dónde |
|---|---|---|
| 13 nov | Aplicación web responsiva | ADR 0001 |
| 13 nov | Datos del OCP Data Registry, procesados por adelantado | ADR 0002 |
| 13 nov | Referentes sin copiar: Cardinal como dependencia y Arachne como inspiración | ADR 0003 |
| 13 nov | Señales sin probabilidad de corrupción; el rojo solo por decisión humana | ADR 0007 |
| 13 nov | Fases 0–3, un lote por persona y un change de OpenSpec por lote | Este documento |
| Pendiente | Desafío definitivo (recomendado: 2) | Inscripción |
| Pendiente | Nombre del producto | `docs/producto/vision-y-encaje.md` |
| Pendiente | Confirmar el reparto de lotes y quién integra | Este documento |
