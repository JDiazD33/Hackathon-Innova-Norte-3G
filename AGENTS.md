# Guía para trabajar en el proyecto

Aplica a personas y agentes (Claude Code, Codex, Kimi u otros).

## Antes de actuar

1. Lee este archivo, `CONTRIBUTING.md`, el `README.md` y los documentos de `docs/` relacionados con la tarea.
2. Para cambios de funcionalidad o arquitectura, trabaja con OpenSpec: lee el change vigente en `openspec/changes/` (proposal, design, specs y tasks) y mantén `tasks.md` acorde con el avance real.
3. Revisa la rama y los cambios existentes. Conserva el trabajo de los demás.
4. Si vas a usar un skill, lee su `SKILL.md` completo antes de aplicarlo.

## Reglas del proyecto

- **Las bases mandan.** Están resumidas en `docs/bases/requisitos-y-entregables.md`. Si algo choca con ellas, avisa antes de seguir.
- **No copies código de terceros.** Usa dependencias con licencia compatible, cítalas en `docs/producto/referentes-internacionales.md` y respeta sus licencias. Si implementas una metodología publicada, cita la fuente en el código y en el catálogo de señales.
- **Datos:** solo las fuentes abiertas documentadas en `docs/datos/fuente-de-datos.md`. No te conectes a sistemas productivos, no hagas scraping del SEACE y no intentes saltar las restricciones de acceso de ninguna API.
- **No subas datos pesados.** Los datos crudos y derivados no se suben (`data/` está en `.gitignore`); solo muestras pequeñas y fixtures sintéticos.
- **Privacidad:** los proveedores que son personas naturales nunca se muestran con nombre en el enlace público. Ver `docs/diseno/sistema-de-diseno.md#ética-y-privacidad`.
- **Lenguaje:** una señal no es una acusación. Para describir un caso en la interfaz no uses "corrupción", "fraude" ni "irregular"; usa "señal", "amerita revisión" o "prioridad de revisión".
- **Secretos:** no subas credenciales, claves ni datos privados. Documenta las variables de entorno sin sus valores.
- **Comandos reales:** no inventes comandos. Documenta en `CONTRIBUTING.md` solo los que existan y funcionen.

## Commits y ramas

- Una rama por parte de lote (`lote-<letra>/<tema>`), PR hacia `main` y revisión de otra persona del equipo.
- Sin merges, rebases ni push a `main` sin autorización del equipo.
- **Autoría:** los commits y los PR llevan como autores solo a los integrantes del equipo. No se agregan líneas `Co-Authored-By` ni firmas de herramientas de IA.

## Criterios de finalización

- El cambio cumple los requisitos del change y de las bases, y conserva el trabajo existente.
- Se ejecutaron las comprobaciones disponibles; si alguna no se pudo ejecutar, se explica por qué.
- La documentación, las tareas y las specs de OpenSpec reflejan el resultado.
- Se informa qué cambió, cómo se verificó y qué queda pendiente.
