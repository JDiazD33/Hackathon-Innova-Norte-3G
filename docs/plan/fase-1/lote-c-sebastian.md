# Lote C · Sebastián · Tarjeta de señal y fichas, con el diseño Prisma

**Objetivo:** que una persona abra un proceso desde la bandeja, entienda por qué aparece cada señal y pueda registrar su revisión. Es el corazón de Prisma y el centro del H1 (mar 17).

**Lo que ya existe (parte 1):**

- **Textos de explicación:** las plantillas de S01 a S06 y S08 y sus pruebas, en `src/features/explicacion/`.
- **Lógica de las fichas:**
  - `describePriority` y `describeComparison`, en `src/features/explicacion/`;
  - `buildProcessTimeline` y `getSupplierIdentity`, en `src/features/fichas/`.

Ahora van las pantallas.

**Fechas:**

| Cuándo | Qué |
|---|---|
| lun 16 – mar 17 | Tarjeta de señal y ficha del proceso (para el H1) |
| mié 18 – jue 19 | Comparación visual y ficha del proveedor |
| jue 19 | Recorrido con datos reales (H2) |

## 1. Antes de empezar

1. `git switch main && git pull`, y crea la rama `lote-c/parte-2-tarjeta-y-ficha-del-proceso`.
2. Lee completos:
   - `AGENTS.md`, `CONTRIBUTING.md` y `web/AGENTS.md` (Next 16 trae cambios: consulta `web/node_modules/next/dist/docs/`, sobre todo rutas dinámicas, `params` como `Promise`, `notFound()` y Cache Components);
   - `web/README.md`, sobre todo "Cómo crear una pantalla";
   - `docs/diseno/sistema-de-diseno.md` ("Tarjeta de señal" y "Pantallas") y los ADR 0007 y 0008;
   - la plantilla de explicación de `docs/datos/catalogo-de-senales.md`;
   - [el README de la Fase 1](README.md), este documento y `openspec/changes/lote-c-fichas-y-explicacion/`.
3. Con OpenSpec: `/opsx:apply lote-c-fichas-y-explicacion` en Claude Code o `$openspec-apply-change` en Codex. Marca `[x]` solo lo terminado y verificado.
4. Prepara la web: `cd web && npm ci && npm test`.

## 2. Diseño: Prisma, con las guías de Apple

Joaquín rediseña la base con las [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) de Apple el domingo 15 (ver su [MD](lote-b-joaquin.md)). Tus pantallas usan ese diseño.

**Cómo trabajar con la base:**

- Usa solo tokens y componentes comunes (`src/components/ui/` y `src/components/estado/`). Nada de colores, sombras ni medidas fijas: así, cuando cambie la base, tu pantalla cambia sola.
- Si la base Prisma todavía no está en `main`, avanza con la estructura, los datos y las pruebas. Cuando se fusione, `git merge origin/main` en tu rama (sin rebase) y ajusta.
- Antes de maquetar, lee de la HIG:
  - [Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables);
  - [Charting data](https://developer.apple.com/design/human-interface-guidelines/charting-data);
  - [Layout](https://developer.apple.com/design/human-interface-guidelines/layout);
  - [Typography](https://developer.apple.com/design/human-interface-guidelines/typography);
  - [Disclosure controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls);
  - [Writing](https://developer.apple.com/design/human-interface-guidelines/writing).

**Patrones para tus pantallas:**

| Parte | Cómo se ve |
|---|---|
| Cabecera de la ficha | Título grande con la descripción del proceso y, debajo, una línea de metadatos: entidad · método · fecha |
| Resumen | Lista agrupada de pares etiqueta–valor (monto, estado, método y fechas), con "Sin dato" en gris |
| Tarjeta de señal | **Superficie sólida, no vidrio.** Lleva: encabezado con ícono de categoría, nombre, código y peso; los seis bloques con títulos breves; "Qué revisar" como lista de verificación; "Qué no significa" en un recuadro neutro; y la referencia internacional como nota |
| Detalles | "Datos usados" y "Calidad de datos" plegables (divulgación progresiva) |
| Línea de tiempo | Vertical, con puntos y fechas alineadas. Lo simulado lleva la etiqueta "Dato simulado" de André |
| Documentos | Filas de lista con ícono de enlace externo |
| Minigráficos | Al estilo de los gráficos de Apple: pocas marcas, rejilla tenue y el caso resaltado con el color de acento y una anotación. Siempre con su frase |
| Ficha del proveedor | Título grande con el seudónimo (el nombre solo en modo local, y nunca si es persona natural), cifras como "widgets" y lista de procesos ganados |

## 3. Qué hacer, en orden

### Parte 2 · Tarjeta de señal y ficha del proceso (lun 16 – mar 17)

1. **Tarjeta de señal (3.1, 3.3 y 3.4):**
   - componente con los seis bloques y la variante `print`, que André usa en el reporte;
   - notas de calidad, la etiqueta "Dato simulado" en S08 (componente de André, D 1.2) y el enlace al SEACE o el aviso de que falta;
   - el desglose de la prioridad con tooltip accesible con el teclado;
   - una prueba de componente por cada señal del fixture.
2. **Ficha del proceso `/procesos/[ocid]` (2.1 a 2.4):**
   - el resumen con "Sin dato" en los valores nulos;
   - "No encontramos este proceso" si el `ocid` no existe;
   - la línea de tiempo visual;
   - los documentos oficiales.
3. **Historial y botón "Registrar revisión" (2.5):**
   - el historial sale de `useRevisiones()` y el diálogo es de André;
   - el botón aparece con el rol analista y no con el auditor (`canReview(role, action)` de `src/features/revision`).
4. **Texto de S01:** ajústalo a lo que decida el equipo sobre la propuesta de Stefano ("un solo participante registrado"). Pide a otra persona del equipo que lea las explicaciones y te diga si las entiende (1.2).
5. **Verifica:**
   - bandeja → ficha → tarjeta, en claro y oscuro, a 375 y 1280 px, y con el teclado;
   - avisa a Joaquín cuando `/procesos/[ocid]` esté en `main`, porque su buscador abre esa ruta (B 4.4).

### Parte 3 · Comparación visual y ficha del proveedor (mié 18 – jue 19)

Rama `lote-c/parte-3-comparacion-y-ficha-del-proveedor`.

6. **Minigráficos (4.1):** de S01, S03 y S04 (S02 y S06 solo si se activan), con un marcador del caso y la frase equivalente. En el celular se muestra solo la frase.
7. **Ficha del proveedor `/proveedores/[id]` (5.1 y 5.2):** participación, procesos ganados, la tarjeta de S03 y las reglas de identidad según el modo.
8. **Datos reales (7.1):** cuando el paquete público esté en `main` (H2, jue 19), recorre una ficha completa con datos reales.

## 4. También esta semana

- **Entrevista:** una entrevista de problema ([guía](README.md#entrevistas-de-problema-lun-16--mié-18)).
- **Plan de validación:** eres el responsable. Prepara en `docs/entregables/plan-de-validacion.md` el guion de las pruebas con usuarios del viernes 20: tareas, preguntas y qué se mide.

## Reglas

- **Carpetas:** solo `src/features/fichas/`, `src/features/explicacion/`, tus rutas en `src/app/(app)/` y tu `tasks.md`. Lo compartido (`src/lib/`, `src/components/`, `contracts/` y el fixture) es de Joaquín: si necesitas un cambio, pídeselo.
- **Lenguaje:** las señales no son acusaciones. Nunca "corrupción", "fraude", "irregular", "sospechoso" ni "culpable", y cada explicación dice qué no significa la señal.
- **Claridad:** textos en español claro, sin jerga OCDS ("plazo para presentar ofertas", no "tenderPeriod"). El código va en inglés.
- **Privacidad:** las personas naturales nunca muestran su nombre, en ningún modo.
- **Commits:** solo tu cuenta de GitHub, sin `Co-Authored-By` ni firmas de herramientas de IA. Push solo de tu rama, PR hacia `main`, sin fusionarlo tú y sin rebase.
- **Antes de cada push** (desde `web/`): `npm run typecheck`, `npm run lint`, `npm test` y `npm run build`, en verde.

## Al cerrar cada parte, entrega

- La rama y el SHA del último commit.
- Las tareas completadas y cómo se verificaron: comandos y resultados.
- Capturas en claro y oscuro.
- Los pendientes y bloqueos.
