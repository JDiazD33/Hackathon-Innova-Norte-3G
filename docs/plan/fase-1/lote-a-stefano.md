# Lote A · Stefano · Decisiones de señales, datos reales y verificación

**Objetivo:** que para el H2 (jue 19) la demo de Prisma use datos reales de La Libertad, y que cada señal que mostramos esté decidida por el equipo y verificada contra el SEACE.

**Fechas:**

| Cuándo | Qué |
|---|---|
| dom 15 | Propuesta de decisiones en un PR |
| mar 17 | Paquete público listo |
| mié 18 | Paquete público en `main` |
| mié 18 – vie 20 | Verificación en el SEACE |

## 1. Antes de empezar

1. `git switch main && git pull`, y crea la rama `lote-a/parte-8-decisiones-y-paquete-publico`.
2. Agrega su ficha en `docs/datos/partes-lote-a/` y una fila en el README de esa carpeta, como en las partes anteriores.
3. Lee completos:
   - `AGENTS.md` y `CONTRIBUTING.md`;
   - [el README de la Fase 1](README.md) y este documento;
   - `docs/datos/partes-lote-a/README.md` (sus reglas siguen vigentes);
   - `docs/datos/fuente-de-datos.md` y `docs/datos/catalogo-de-senales.md`;
   - `docs/arquitectura/contrato-paquete-de-datos.md`;
   - `openspec/changes/lote-a-datos-y-senales/`.
4. Con OpenSpec: `/opsx:apply lote-a-datos-y-senales` en Claude Code o `$openspec-apply-change` en Codex. Marca `[x]` solo lo terminado y verificado.
5. Prepara el entorno: `cd pipeline && uv sync && uv run pytest`.

## 2. Propuesta de decisiones de señales (tarea 1.6, dom 15)

Es lo primero, porque de esto dependen el texto de S01 (Sebastián), el paquete público y la metodología (André).

Abre un PR **solo de documentos** con una tabla de decisiones en la ficha de la parte 8. Para cada tema, pon tu recomendación (sale de tu spike), su porqué y qué cambia si se aprueba:

| Tema | Recomendación de partida | Qué cambia |
|---|---|---|
| S01 | "Un solo participante registrado": `numero_postores` cuenta participantes, no ofertas | Nombre y texto de S01, catálogo y metodología |
| S02 | Desactivarla con el motivo "tenderPeriod sin duración en la fuente" y subir S05 al núcleo | Manifiesto, pesos y metodología |
| S04 | Cargar los umbrales vigentes de la Ley 32069 y su reglamento, con la cita y la fecha de verificación | S04 se activa |
| S06 | Desactivarla (monto final en el 9,1 % de los contratos, bajo el 10 %) o bajar el mínimo con una justificación | Manifiesto y metodología |
| S03 y S05 | Confirmar los mínimos: 3 adjudicaciones para S03 y `minimo_directas = 3` para S05 | Configuración |
| Métodos | Clasificar los 55 nombres de método. Los dudosos quedan sin señal | `config/senales.toml` |

**La verificación de 1.6 es la aprobación de los cuatro en el PR.** Avísales el domingo y pide respuesta hasta el lunes 16.

Si una decisión cambia el contrato (campos, nombres o valores), acuérdalo con Joaquín: el documento del contrato, el schema, los tipos y el fixture son suyos.

## 3. Paquete público en la web (tarea 5.4, mar 17 – mié 18)

1. Aplica las decisiones aprobadas en `pipeline/config/senales.toml` y regenera: `ingest`, `normalize`, `signals`, `export --modo publico` y `export --modo local`. Antes, `download` si no tienes los archivos en `data/raw/`.
2. **Valida:**
   - desde `web/`, `PAQUETE_DIR=data/publico npm test -- paquete`;
   - prueba la web con `PAQUETE_DATOS=publico npm run build && PAQUETE_DATOS=publico npm run start`;
   - recorre el panel y la bandeja.
3. **Revisa la privacidad:**
   - ningún RUC ni nombre real en `web/data/publico/` (la prueba de la tarea 5.2);
   - `web/data/local/` no aparece en `git status`.
4. **Tamaño:** anota el peso de `web/data/publico/` con `du -sh`. Si pasa de 10 MB, avisa a Joaquín antes de subirlo: no subimos datos pesados.
5. **Huellas:** repite en `main` lo que quedó pendiente de la parte 7. Ejecuta dos veces con los mismos insumos y compara con `uv run pipeline fingerprint --out` y `--compare`.
6. **PR del paquete.** Cuando se fusione, Joaquín activa `PAQUETE_DATOS=publico` en Vercel y el enlace público pasa a datos reales.

## 4. Verificación en el SEACE (tareas 3.4 y 4.5, mié 18 – vie 20)

Rama `lote-a/parte-9-verificacion-seace`, con su ficha.

1. Toma 5 casos reales de S01, 5 de S03 y 5 de S04 (S02 queda fuera si se desactiva).
2. Abre cada `ocid` a mano en el buscador público del SEACE. Es una consulta manual: sin scraping ni automatización.
3. En la ficha y en el PR anota, por cada caso, qué coincide, qué no y por qué.
4. Actualiza `docs/datos/catalogo-de-senales.md` con las reglas finales.

## 5. También esta semana

- **Entrevista:** una entrevista de problema ([guía](README.md#entrevistas-de-problema-lun-16--mié-18)).
- **Ficha técnica:** eres el responsable. Empieza a completar las versiones y los datos en `docs/entregables/ficha-tecnica.md`; la versión 1 es para el H3 (mar 24).
- **Video de respaldo de la demo:** es de la Fase 3, junto con André. Ve pensando el guion.

## Reglas

- **Carpetas:** solo `pipeline/`, `docs/datos/` y el `tasks.md` de tu change.
  - El paquete va a `web/data/publico/` (seudonimizado) y a `web/data/local/` (con nombres, nunca se sube).
  - `contracts/` y el código de `web/` se coordinan con Joaquín.
- **Fuentes:** solo las descargas del OCP Data Registry.
- **Parámetros:** en `config/senales.toml` y `config/pipeline.toml`, nunca fijos en el código.
- **Pruebas:** cada regla con un caso positivo, uno negativo y uno con datos faltantes.
- **Lenguaje:** "señal", "amerita revisión" o "prioridad de revisión". Nunca "corrupción", "fraude" ni "irregular".
- **Commits:** solo tu cuenta de GitHub, sin `Co-Authored-By` ni firmas de herramientas de IA. Push solo de tu rama, PR hacia `main`, sin fusionarlo tú y sin rebase.
- **Antes de cada push** (desde `pipeline/`): `uv run pytest`, `uv run ruff check` y `uv run ruff format --check`, en verde.

## Al cerrar cada parte, entrega

- La rama y el SHA del último commit.
- Las tareas completadas y cómo se verificaron: comandos y resultados.
- Los pendientes y bloqueos.
