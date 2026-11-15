# Parte 11 · Cierre del Lote A (15 de noviembre)

**Rama:** `lote-a/parte-11-cierre-lote-a`, desde `main`. **PR:** hacia `main`, solo de documentos.

**Encargo:** terminar lo que se puede del Lote A y dejar listo lo que depende de otros lotes o de la consulta manual en el SEACE.

## Tareas

- [x] 5.4 Generar el paquete público de La Libertad en `web/data/publico/` y el local en `web/data/local/`. Verificar con el Lote B que la web carga el paquete público y que `git status` no muestra el local.
- [ ] 6.2 Integrar en `main` los PR de los lotes B, C y D que estén aprobados. Verificar recorriendo la demo completa en local: bandeja → ficha → explicación → decisión → reporte. *El recorrido completo funciona sobre el PR #29 integrado con `main`; falta que el #29 se apruebe y se fusione.*
- [ ] 3.4 y 4.5 (verificación en el SEACE). *Siguen para la consulta manual del miércoles 18 al viernes 20. Esta parte agrega a su ficha el análisis de versiones de un mismo procedimiento.*

## 5.4 · Paquete público en la web

- El PR #30 está en `main`: 259 archivos y 8,8 MB en `web/data/publico/`.
- La web publicada (<https://hackathon-innova-norte-3g.vercel.app>) carga el paquete público. Muestra "Reglas 2026.11.2", "Datos al 4 oct 2026" y las entidades de La Libertad, como el Instituto Regional de Oftalmología. Con el fixture diría `fixture-1`.
- `git status` no muestra `web/data/local/` ni `pipeline/.env`: los dos están en `.gitignore`.

## 6.2 · Recorrido de la demo con el PR #29

Se recorrió la demo sobre la rama del PR #29 (Lote B, parte 15) más `main`, fusionadas sin commit en un worktree temporal. Nada se subió.

- **Comprobaciones:** fusión sin conflictos; `PAQUETE_DIR=data/publico npm test` con 344 pruebas en verde; `typecheck`, `lint` y `PAQUETE_DATOS=publico npm run build` en verde.
- **Recorrido:** bandeja → ficha → explicación → decisión → reporte, con `LP-SM-1-2026-IRO/COMITE-1` y su señal S03. La decisión "Requiere atención" aparece en el historial del reporte.
- **S01 y nomenclatura:** la tarjeta de S01 ya dice "Un solo participante registrado", y la ficha y el reporte muestran la nomenclatura del SEACE.
- **Detalle y notas para B y D:** en la [parte 6](parte-6-opcionales-e-integracion.md#recorrido-con-el-pr-29-tarea-62-15-de-noviembre).

## Versiones de un mismo procedimiento

Al revisar las nomenclaturas repetidas para la verificación en el SEACE, apareció que la mayoría son versiones de un mismo procedimiento. Cuando un procedimiento se declara nulo o se retrotrae por resolución, la fuente lo vuelve a publicar con otro `ocid` y la misma nomenclatura.

- **Tamaño:** 331 versiones anteriores (258 NULO y 73 RETROTRAIDO_POR_RESOLUCION) que hoy se evalúan como procesos aparte.
- **Efecto si se dejan de evaluar:** S01 sigue en 33, S03 baja de 30 a 28, S05 de 7 a 5 y S04 (desactivada) de 286 a 241 grupos.
- **En los casos de la verificación:** S03-2, S04-1 y S04-2 son un solo procedimiento contado varias veces.
- **Propuesta:** no evaluar las versiones anteriores, con un parámetro en `pipeline/config/senales.toml`. Se decide con la verificación en el SEACE; hasta entonces el pipeline y el paquete no cambian.
- **Detalle:** cifras, ejemplos y qué confirmar en el SEACE, en la [parte 9](parte-9-verificacion-seace.md#versiones-de-un-mismo-procedimiento). También quedó anotado en el [catálogo](../catalogo-de-senales.md#método-común) y en las [tablas normalizadas](../tablas-normalizadas.md).

El efecto se midió con `uv run pipeline signals --data-dir <copia> --signals-config <copia>` sobre una copia de `data/derived/tablas/` fuera del repositorio. La ejecución con las reglas actuales reprodujo las cifras publicadas (S01 = 33, S03 = 30 y S05 = 7).

## Ficha técnica

La [ficha técnica](../../entregables/ficha-tecnica.md) avanza en su versión 1:

- los datos del prototipo ya están en `main` y en Vercel;
- el enlace del prototipo dice qué datos muestra;
- "Cómo se usa" sigue las pantallas del recorrido;
- las limitaciones incluyen las versiones de un mismo procedimiento.

## Verificación

- Desde `pipeline/`: `uv run pytest` da 161 pruebas en verde; `uv run ruff check` y `uv run ruff format --check`, sin observaciones.
- Desde `web/`: `PAQUETE_DIR=data/publico npm test` da 333 pruebas en verde (29 archivos).
- `openspec validate --all --strict`: 5 de 5, sin errores.
- Los enlaces relativos y las anclas de los documentos cambiados existen.

## Pendiente

| Qué | Qué hace falta | Quién |
|---|---|---|
| 6.2 | Aprobar y fusionar el PR #29 y repetir el recorrido en `main` con el paquete público y con el fixture | Otra persona del equipo aprueba el #29; recorre Stefano |
| 3.4 y 4.5 | Consulta manual en el SEACE, del miércoles 18 al viernes 20, con los casos de la parte 9 | Stefano |
| Versiones de un mismo procedimiento | Decidir con esa verificación si se dejan de evaluar. Si se aprueba, implementarlo, volver a generar el paquete y repetir las huellas | Stefano y el equipo |
| Umbrales y calibración de S04 | Confirmar los montos y decidir si se activa | Joaquín y el equipo |
| Archivar el change | `/opsx:archive` cuando estén cerradas 3.4, 4.5 y 6.2 | Stefano |

## Archivos

Esta ficha; las fichas de las partes 6, 9 y 10 y el índice; `docs/datos/catalogo-de-senales.md`, `docs/datos/tablas-normalizadas.md`, `docs/entregables/ficha-tecnica.md` y `tasks.md` del change.
