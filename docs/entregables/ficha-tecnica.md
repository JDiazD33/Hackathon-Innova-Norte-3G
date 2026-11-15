# Ficha técnica

> **Estado:** versión 1 en curso (15 de noviembre): versiones, datos y fuentes del Lote A. Se cierra para el H3 (martes 24), con las pantallas finales de los lotes B, C y D. Las bases piden (p. 14): el nombre de la propuesta, cómo se usa, qué herramientas empleamos y el enlace o archivo del prototipo.

## Nombre de la propuesta

**Prisma**: señales explicables para revisar compras públicas ([ADR 0008](../adr/0008-prisma-y-diseno-inspirado-en-apple.md)).

## Qué es

Una plataforma web que prioriza qué contrataciones públicas conviene revisar, explica por qué con metodología internacional y registra la decisión humana.

## Cómo se usa

1. Elegir la entidad en la cabecera.
2. Revisar el panel: procesos, señales y revisiones pendientes.
3. Abrir la bandeja de señales y filtrar por prioridad.
4. Abrir un proceso: leer la explicación de cada señal (qué encontramos, con qué se comparó, qué revisar y qué no significa) y buscarlo en el SEACE con su nomenclatura.
5. Registrar la revisión: justificada, en revisión o requiere atención, con un comentario y una asignación.
6. Abrir el reporte de trazabilidad e imprimirlo o guardarlo en PDF.

## Cómo funciona

Ver [arquitectura](../arquitectura/arquitectura.md). En resumen:

1. Datos abiertos OCDS del OECE.
2. Pipeline en Python con DuckDB.
3. Señales propias, según la guía de banderas rojas de OCP. Cardinal se usa para contrastar S01 con su indicador R018.
4. Prioridad de revisión transparente.
5. Aplicación web en Next.js.

## Herramientas empleadas

Versiones exactas de `web/package-lock.json` y `pipeline/uv.lock` al 15 de noviembre.

| Herramienta | Versión | Uso | Licencia |
|---|---|---|---|
| Node.js | 24 (también funciona con 22) | Entorno de la web | MIT |
| Next.js | 16.4.6 | Aplicación web (App Router con Cache Components) | MIT |
| React | 19.3.0 | Interfaz | MIT |
| TypeScript | 5.9.3 | Lenguaje de la web | Apache-2.0 |
| Tailwind CSS | 4.3.3 | Estilos | MIT |
| shadcn/ui (estilo radix-nova) y Radix UI | 4.23.0 · 1.8.1 | Componentes accesibles | MIT |
| Recharts | 3.8.0 | Gráficos | MIT |
| lucide-react | 1.73.0 | Íconos | ISC |
| next-themes | 0.4.6 | Modo claro y oscuro | MIT |
| Inter | — | Tipografía, incluida en el build | SIL Open Font License 1.1 |
| Vitest y Ajv | 5.1.0 · 8.20.0 | Pruebas de la web y validación del paquete | MIT |
| Python | 3.13.4 (también funciona con 3.12) | Pipeline de datos | PSF |
| uv | 0.11.12 | Entorno y dependencias del pipeline | MIT o Apache-2.0 |
| DuckDB | 2.0.0 | Lectura del OCDS, tablas y señales en SQL | MIT |
| Cardinal (`ocdscardinal`) | 0.0.9 | Contraste de S01 con el indicador R018 | MIT |
| jsonschema | 4.26.0 | Validación del paquete contra el JSON Schema del contrato | MIT |
| pytest y ruff | 9.2.0 · 0.17.5 | Pruebas y formato del pipeline | MIT |
| OpenSpec | 1.16.0 | Especificación del producto | MIT |

## Datos y atribución

Datos: OECE – Contrataciones Abiertas (SEACE), vía OCP Data Registry, licencia CC BY 4.0. Datos filtrados y transformados por el equipo para calcular señales de revisión.

**Datos del prototipo** (paquete público del PR #30, en `main` y publicado en Vercel):

| Dato | Valor |
|---|---|
| Fuente | Archivos `2025.jsonl.gz` y `2026.jsonl.gz` del OCP Data Registry, descargados el 13 de noviembre de 2026 |
| Alcance | Entidades de La Libertad, procesos convocados en 2025 y 2026, con datos al 4 de octubre de 2026 |
| Tamaño | 5 036 procesos, 127 entidades y 2 591 proveedores con seudónimo |
| Señales | 76: S01 = 33, S03 = 30, S05 = 7 y S08 = 6 (simuladas). S02, S04 y S06 están desactivadas, cada una con su motivo |
| Prioridad | 154 procesos con señales: 1 en prioridad alta y 153 en media |
| Versiones | Reglas `2026.11.2` y contrato del paquete 1.1 |
| Reproducibilidad | Con los mismos archivos, la misma configuración y el mismo secreto, dos ejecuciones dan huellas SHA-256 idénticas |
| Privacidad | El paquete público no tiene nombres ni RUC de proveedores |

## Fuentes

| Qué | Fuente | Cómo la usamos |
|---|---|---|
| Datos de contrataciones | [OCP Data Registry, publicación 135](https://data.open-contracting.org/en/publication/135): OECE – Contrataciones Abiertas (SEACE), formato OCDS, licencia CC BY 4.0 | Descarga de los archivos anuales con `uv run pipeline download`, solo desde direcciones permitidas. Sin scraping ni APIs con credenciales |
| Metodología de las señales | Guía *Red Flags in Public Procurement* de Open Contracting Partnership | Definiciones de las señales, citadas en el [catálogo](../datos/catalogo-de-senales.md) |
| Indicadores de contraste | [Cardinal](https://github.com/open-contracting/cardinal-rs) de Open Contracting Partnership (MIT) | El indicador R018 se ejecuta como herramienta externa y se compara con S01 |
| Umbrales de los métodos (S04) | Artículo 14 de las leyes de presupuesto 2025 (Ley 32185) y 2026 (Ley 32513), en los textos consolidados del portal de leyes del Congreso | Montos desde los que corresponde la licitación o el concurso público; S04 sigue desactivada hasta confirmarlos |
| Principios de revisión | Arachne (Comisión Europea) y el [ADR 0007](../adr/0007-senales-no-acusaciones.md) | Señales, no acusaciones: puntaje para priorizar y decisión siempre humana |

Las dependencias de software y sus licencias también están en [referentes internacionales](../producto/referentes-internacionales.md).

## Enlace al prototipo

- Prototipo: <https://hackathon-innova-norte-3g.vercel.app>, con el paquete público de La Libertad (reglas `2026.11.2`, datos al 4 de octubre de 2026)
- Repositorio: <https://github.com/JDiazD33/Hackathon-Innova-Norte-3G>

## Limitaciones conocidas

- No incluye compras menores a 8 UIT, pagos ni modificaciones contractuales, porque la fuente no los publica.
- La trazabilidad interna (quién solicitó, evaluó o dio conformidad) se demuestra con datos simulados.
- La fuente publica cada versión de un procedimiento nulo o retrotraído con otro `ocid`. Hoy cada versión se evalúa aparte; la propuesta para dejar de hacerlo se decide con la verificación en el SEACE ([parte 9](../datos/partes-lote-a/parte-9-verificacion-seace.md#versiones-de-un-mismo-procedimiento)).
- Las revisiones se guardan en el navegador. En un piloto se guardarían en un servidor con inicio de sesión institucional.

## Seguridad y ética

- Señales, no acusaciones: no calcula una probabilidad de corrupción.
- Proveedores seudonimizados en el enlace público. Las personas naturales nunca aparecen con nombre.
- Sin conexión a sistemas productivos y sin scraping.
