# Parte 10 · Paquete público con datos reales (tarea 5.4)

**Rama:** `lote-a/parte-10-paquete-publico`, desde `main`. Incluye los commits de la [parte 8](parte-8-decisiones-y-paquete-publico.md) (PR #26), que ya aplicaban las decisiones aprobadas en el PR #11. Cuando este PR se fusione, el #26 quedará fusionado también. **PR:** hacia `main`.

**Encargo:** [`docs/plan/fase-1/lote-a-stefano.md`](../../plan/fase-1/lote-a-stefano.md), sección 3.

## Tarea

- [ ] 5.4 Generar el paquete público de La Libertad en `web/data/publico/` y el local en `web/data/local/`. Verificar con el Lote B que la web carga el paquete público y que `git status` no muestra el local. *El paquete está generado y validado. Falta que se fusione este PR y que Joaquín active `PAQUETE_DATOS=publico` en Vercel y confirme que la web lo carga.*

## Qué agrega a la parte 8

- **Métodos dudosos:** van en `metodos_sin_clasificar` del manifiesto de señales, como dice la decisión 9, y S01 los cuenta como "método sin clasificar". En La Libertad son 175 procesos de Contratación Internacional, Convenio y Régimen Especial. La lista completa de dudosos sigue en `parametros.metodos_dudosos`.
- **Pruebas con datos faltantes** para las reglas nuevas:
  - participación mínima de S03 sin montos adjudicados;
  - proporción mínima de S05 sin montos referenciales;
  - un proceso sin `tender.title`, que exporta `nomenclatura: null`.

Las demás decisiones están aplicadas como dice la [tabla de la parte 8](parte-8-decisiones-y-paquete-publico.md#resultado-decisiones-aplicadas-15-de-noviembre).

## Resultado

| Dato | Valor |
|---|---|
| Señales | 76: S01 = 33, S03 = 30, S05 = 7 y S08 = 6 (simuladas). S02, S04 y S06 están desactivadas, cada una con su motivo |
| Prioridad | 154 procesos con señales: 1 en prioridad alta y 153 en media. El manifiesto publica solo los pesos de S01, S03 y S08 |
| Contraste con Cardinal | R018 coincide en los 33 casos de S01 y marca 38 más, con su motivo (36 sin adjudicación y 2 cancelados) |
| Contenido | 5 036 procesos con nomenclatura, 127 entidades, 2 591 proveedores con seudónimo y 19 778 documentos |
| Versiones | Contrato 1.1 y reglas `2026.11.2` |
| Peso de `web/data/publico/` | 8,8 MB con `du -sh`, bajo el límite de 10 MB |

## Verificación (15 de noviembre)

- **Desde `pipeline/`:** `uv sync` sin cambios; `uv run pytest` da 161 passed; `uv run ruff check` y `uv run ruff format --check`, sin observaciones.
- **Cadena completa, dos veces:** `ingest`, `normalize`, `signals`, `cardinal`, `export --modo publico` y `export --modo local`. `uv run pipeline fingerprint --out` y `--compare` dan huellas idénticas en los 537 archivos.
- **Desde `web/`, con `npm ci`:**
  - `PAQUETE_DIR=data/publico npm test -- paquete` y `PAQUETE_DIR=data/local npm test -- paquete`: 10 de 10 en cada uno;
  - `PAQUETE_DIR=data/publico npm test`: 333 pruebas en verde;
  - `PAQUETE_DATOS=publico npm run build` y `npm run start`. El panel muestra la entidad, sus procesos, la señal S05, las categorías, la tendencia y los proveedores con seudónimo. La bandeja lista sus 21 procesos con señales, con su nomenclatura. El servidor se apagó al terminar.
- **Privacidad:**
  - en `web/data/publico/` hay 0 números con forma de RUC y 0 nombres de personas naturales o jurídicas; quedan 12 nombres de consorcios que son nombres de lugares, como en la parte 5;
  - ninguno de los 2 591 proveedores públicos lleva nombre, RUC ni enlace;
  - en el paquete local ninguna persona natural ni proveedor `desconocido` lleva nombre;
  - `git status` no muestra `web/data/local/` ni `pipeline/.env`.
- `openspec validate --all --strict`: sin errores.

## S04 sigue desactivada

- **Umbrales:** los montos los fija el artículo 14 de las leyes de presupuesto, que se aplica a los procedimientos de la Ley 32069. Los leí en los textos consolidados del Congreso:
  - **Ley 32185 (2025):** artículo 14.1 para la Ley 30225 y 14.2 para la Ley 32069;
  - **Ley 32513 (2026):** artículo 14;
  - **Montos:** S/ 485 000 para bienes y servicios y S/ 5 000 000 para obras.
- **Lo que no leí:** el texto del Decreto Supremo 009-2025-EF ni el del 001-2026-EF.
- **Por qué no se activa:** los umbrales están cargados con su cita en `S04.umbrales`, pero falta que Joaquín los confirme. Además, la decisión 5 pide una calibración con un volumen que se pueda revisar: S04 marcaría de 540 a 841 procesos. La verificación en el SEACE de la parte 9 (PR #27) dirá si conviene contar procedimientos en lugar de procesos.

## Pendiente

- **Joaquín:** fusionar este PR, activar `PAQUETE_DATOS=publico` en Vercel y confirmar que la web carga el paquete (cierra la 5.4). También confirmar los umbrales de S04.
- **Sebastián:** el texto de S01, que todavía dice "Oferta única", y mostrar la `nomenclatura` en la ficha del proceso.

## Archivos

`pipeline/src/pipeline/` (`signals/s01.py`, `signals/compute.py` y `cardinal.py`), `pipeline/tests/`, `web/data/publico/manifest.json`, `docs/datos/catalogo-de-senales.md`, las fichas de las partes 8 y 10 y el índice de las partes. Además, los commits de la parte 8.
