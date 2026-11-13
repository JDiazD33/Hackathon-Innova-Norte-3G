# Ficha técnica

> **Estado:** borrador. Las bases piden (p. 14): el nombre de la propuesta, cómo se usa, qué herramientas empleamos y el enlace o archivo del prototipo.

## Nombre de la propuesta

*[Pendiente: ver las opciones en `docs/producto/vision-y-encaje.md`]*

## Qué es

Una plataforma web que prioriza qué contrataciones públicas conviene revisar, explica por qué con metodología internacional y registra la decisión humana.

## Cómo se usa

1. Elegir la entidad en la cabecera.
2. Revisar el panel: procesos, señales y revisiones pendientes.
3. Abrir la bandeja de señales y filtrar por prioridad.
4. Abrir un proceso: leer las tarjetas "Por qué aparece" y revisar los documentos en el SEACE.
5. Registrar la revisión: justificada, en revisión o requiere atención, con un comentario y una asignación.
6. Generar el reporte de trazabilidad.

## Cómo funciona

Ver [arquitectura](../arquitectura/arquitectura.md). En resumen:

1. Datos abiertos OCDS del OECE.
2. Pipeline en Python con DuckDB.
3. Señales propias y de Cardinal.
4. Prioridad de revisión transparente.
5. Aplicación web en Next.js.

## Herramientas empleadas

| Herramienta | Uso | Licencia |
|---|---|---|
| Next.js, React, TypeScript | Aplicación web | MIT · MIT · Apache-2.0 |
| Tailwind CSS, shadcn/ui, Recharts | Interfaz y gráficos | MIT |
| Python, DuckDB | Procesamiento de datos | PSF · MIT |
| Cardinal (`ocdscardinal`) | Indicadores de banderas rojas | MIT |
| OpenSpec | Especificación del producto | MIT |
| *[completar con las versiones finales]* | | |

## Datos y atribución

Datos: OECE – Contrataciones Abiertas (SEACE), vía OCP Data Registry, licencia CC BY 4.0. Datos filtrados y transformados por el equipo para calcular señales de revisión.

## Enlace al prototipo

*[Pendiente: URL pública y repositorio]*

## Limitaciones conocidas

- No incluye compras menores a 8 UIT, pagos ni modificaciones contractuales, porque la fuente no los publica.
- La trazabilidad interna (quién solicitó, evaluó o dio conformidad) se demuestra con datos simulados.
- Las revisiones se guardan en el navegador. En un piloto se guardarían en un servidor con inicio de sesión institucional.

## Seguridad y ética

- Señales, no acusaciones: no calcula una probabilidad de corrupción.
- Proveedores seudonimizados en el enlace público. Las personas naturales nunca aparecen con nombre.
- Sin conexión a sistemas productivos y sin scraping.
