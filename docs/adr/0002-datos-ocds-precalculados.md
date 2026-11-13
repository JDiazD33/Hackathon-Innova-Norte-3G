# 0002 · Datos OCDS del OCP Data Registry, procesados por adelantado y de solo lectura

**Contexto.** Las bases no exigen datos reales, pero usarlos fortalece la propuesta frente al jurado. El OECE publica sus contrataciones en OCDS, y el OCP Data Registry las redistribuye sin credenciales, en archivos anuales y con licencia CC BY 4.0. La API del portal del OECE pide credenciales que no tenemos, y el scraping del SEACE está descartado: genera bloqueos (le pasó a FUNES) y choca con el compromiso de no hacer pruebas sin permiso (anexo 2 de las bases).

**Decisión.**
- Descargar los archivos anuales del OCP Data Registry.
- Procesarlos fuera de línea con el pipeline.
- Publicar en la aplicación un paquete de datos de solo lectura, con un manifiesto que indique la fecha de corte, la versión de las reglas y los conteos.
- Definir el formato del paquete (JSON por entidad o SQLite) después del spike, cuando conozcamos el tamaño real.

**Consecuencias.**
- La demo funciona sin internet y cada resultado es reproducible.
- Los datos se actualizan una vez al mes, al ritmo del registro. No son en tiempo real.
- Es obligatorio atribuir la fuente e indicar los cambios en la aplicación, la ficha técnica y el pitch.
- Heredamos los límites de la fuente: no incluye compras menores a 8 UIT, pagos ni modificaciones contractuales ([fuente de datos](../datos/fuente-de-datos.md)).
