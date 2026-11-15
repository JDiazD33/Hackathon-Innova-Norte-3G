# Plan de validación

> **Estado:** versión 1 (14 de noviembre). Responsable: Sebastián; primera redacción de Joaquín. Las bases piden (p. 14) qué pruebas hicimos o haremos, qué opinan los usuarios, qué mejoras identificamos y qué falta desarrollar. Este criterio vale 15 puntos en la final.

## En resumen

- **Qué validamos:** que el problema existe (entrevistas), que las señales son correctas (verificación en el SEACE), que la plataforma ayuda a priorizar y se entiende (pruebas con usuarios) y que aguanta el uso y no expone datos (carga y seguridad).
- **Ya hecho:** la validación técnica de los datos, las señales, el contrato, la accesibilidad, la demo sin internet, la carga y la seguridad (sección 1).
- **Por hacer, del 16 al 24 de noviembre:** entrevistas, verificación en el SEACE y dos rondas con usuarios (secciones 2 y 3).

## 1. Pruebas realizadas (al 14 de noviembre)

| Qué se probó | Cómo | Resultado |
|---|---|---|
| Qué datos trae la fuente | Spike sobre el OCDS de 2025 y 2026 (preguntas Q1–Q8, [fuente de datos](../datos/fuente-de-datos.md)) | El número de participantes está en el 91,1 % de los procesos. El plazo de presentación dura 0 días en el 99,99 %, así que S02 no se puede calcular y queda desactivada |
| S01 frente a una herramienta internacional | Contraste con Cardinal R018 (Open Contracting Partnership) sobre los 5 036 procesos de La Libertad | Coinciden los 69 procesos marcados (100 %). Cardinal marca 2 más, que son procesos cancelados que S01 no evalúa |
| Que la cadena de datos da siempre el mismo resultado | Dos ejecuciones completas del pipeline y comparación de huellas SHA-256 | Las huellas de los 537 archivos son idénticas |
| Que el paquete cumple el contrato | Cada archivo se valida contra el JSON Schema al exportarse, y otra vez en la web | El fixture y el paquete pasan; un paquete roto falla |
| Que el código hace lo que dice | Pruebas automáticas | 270 pruebas en la web y 145 en el pipeline, en verde |
| Accesibilidad | Prueba automática de contraste (WCAG 2.2 AA) en claro y oscuro; recorrido con teclado; vistas a 375, 768 y 1280 px; zoom al 200 % | Todos los pares de texto llegan a 4,5:1; se usa solo con el teclado; sin desplazamiento horizontal |
| Privacidad | La prueba de contrato revisa los seudónimos del modo público | Ningún proveedor aparece con nombre ni RUC en el paquete público |
| Demo sin internet | Build de producción y revisión de la pestaña de red | Todas las peticiones van a la misma laptop. Falta repetirlo con el Wi-Fi apagado |
| Carga | 50 usuarios simultáneos durante 20 s contra la demo local, con autocannon ([informe](../arquitectura/pruebas-de-carga-y-seguridad.md)) | p97,5 entre 22 y 305 ms y sin errores. Con 200 o más conexiones, la bandeja se pone lenta, pero el servidor no se cae |
| Seguridad | Entradas maliciosas en la URL y la API, métodos HTTP, archivos internos, cabeceras, dependencias y secretos | Tres problemas encontrados y corregidos: error 500 con un id enorme, caché que se podía llenar con ids inventados y falta de cabeceras de seguridad. Sin vulnerabilidades altas ni críticas |

## 2. Pruebas previstas

### 2.1 Entrevistas de problema (lunes 16 a miércoles 18)

- **Qué valida:** que el problema es real y cómo se resuelve hoy (ficha del problema).
- **Con quién:** al menos 4 personas, una por integrante: logística o abastecimiento, control interno, un docente con experiencia en el sector público y el contacto del Poder Judicial.
- **Cómo:** 20 a 30 minutos con las 6 preguntas de la [guía de la Fase 1](../plan/fase-1/README.md#entrevistas-de-problema-lun-16--mié-18). Sin grabar ni publicar nombres.
- **Qué sale:** una frase textual por entrevista para el pitch, y la confirmación o corrección de H1 a H3.

### 2.2 Verificación de las señales en el SEACE (miércoles 18 a viernes 20)

- **Qué valida:** que cada señal describe bien el proceso real.
- **Cómo:** se buscan a mano en el portal 5 casos de cada señal activa (S01, S03, S05, y S04 si se activa), usando su nomenclatura. Se anota si el dato del portal confirma la señal. Es manual porque las reglas prohíben automatizar el SEACE.
- **Éxito si:** al menos 4 de cada 5 casos se confirman. Cada caso que no se confirme se explica y, si hace falta, se corrige la regla.

### 2.3 Pruebas con usuarios (viernes 20 y lunes 23)

| Hipótesis | Cómo la medimos | Éxito si… |
|---|---|---|
| H1. La plataforma ayuda a priorizar más rápido | Tarea cronometrada: "encuentra los procesos de esta entidad que merecen revisión", con una hoja de cálculo frente a la plataforma | El tiempo baja al menos a la mitad |
| H2. Las explicaciones se entienden y generan confianza | Tras leer una tarjeta, la persona explica con sus palabras por qué aparece la señal | 4 de cada 5 la explican bien |
| H3. Registrar la decisión es útil | Pregunta abierta y puntuación de 1 a 5 | Promedio de 4 o más |
| Usabilidad general | Cuestionario SUS (System Usability Scale, 10 preguntas) | 68 puntos o más, el promedio de referencia del SUS |
| Calidad de las señales | Las personas revisan 10 señales reales y marcan "justificada" o "requiere atención" | Proporción de señales útiles documentada, con sus motivos |

**Participantes:** de 5 a 8 personas en dos rondas.

- **Perfiles:**
  - logística o abastecimiento;
  - control interno o integridad;
  - docente con experiencia en el sector público;
  - estudiantes de derecho o contabilidad, como usuarios secundarios.
- **Consentimiento** verbal o escrito.
- **Datos:** no registramos datos personales de los participantes; solo su cargo y una referencia anónima (P1, P2…).

**Cada sesión (30 minutos):**

1. Contexto y consentimiento (3 min).
2. Tarea A sin la plataforma, con una hoja de cálculo del SEACE (8 min).
3. Tarea B con la plataforma (8 min).
4. Explicación de una tarjeta con sus palabras (3 min).
5. SUS y preguntas abiertas (8 min).

### 2.4 Pruebas de carga y seguridad (hechas el 14 de noviembre)

> **Hechas antes de lo previsto.** Resultados y correcciones en el [informe](../arquitectura/pruebas-de-carga-y-seguridad.md) y en la sección 1. Falta repetirlas con el paquete real.

- **Qué valida:** que la demo responde con varias personas a la vez, que resiste entradas maliciosas y que no expone datos.
- **Dónde:** contra la demo local (`npm run start`) y una vista previa propia. Nunca contra servicios de terceros como el SEACE, ni con volúmenes que violen las condiciones de uso de Vercel.
- **Carga:** varias personas usan a la vez el panel, la bandeja y el buscador (`/api/busqueda`). Medimos el tiempo de respuesta (p95) y los errores.
  - **Éxito si:** p95 por debajo de 1 segundo y sin errores con 50 usuarios simultáneos.
- **Seguridad:**
  - entradas inválidas o maliciosas en `?entidad=` y en `/api/busqueda` (hoy responde 400 a un id no válido);
  - cabeceras de seguridad;
  - dependencias con vulnerabilidades conocidas (`npm audit`);
  - que no haya secretos en el repositorio ni en el build;
  - que el paquete público no traiga nombres ni RUC.
  - **Éxito si:** no hay hallazgos de gravedad alta abiertos el día de la entrega.

## 3. Calendario

| Cuándo | Qué | Quién |
|---|---|---|
| lun 16 – mié 18 | Entrevistas de problema | Los cuatro; coordina Joaquín |
| mar 17 | H1 interno: bandeja → ficha → explicación → decisión → reporte, con el fixture | Los cuatro |
| mié 18 – vie 20 | Verificación de señales en el SEACE | Joaquín, con la lista de casos de Stefano |
| jue 19 – mar 24 | Repetir carga y seguridad con el paquete real | Joaquín |
| vie 20 | Primera ronda con usuarios | Los cuatro |
| lun 23 | Segunda ronda con usuarios, con las mejoras de la primera | Los cuatro |
| mar 24 | Resultados, mejoras y "qué falta" en este documento | Sebastián |

## 4. Resultados

*[Se completa después de cada ronda]*

| Participante | Perfil | Tiempo A | Tiempo B | Explicó bien | SUS | Comentario clave |
|---|---|---|---|---|---|---|
| P1 | | | | | | |

**Verificación en el SEACE:**

| Señal | Casos revisados | Confirmados | Notas |
|---|---|---|---|
| S01 | | | |
| S03 | | | |
| S05 | | | |

## 5. Opiniones de los usuarios

*[Frases textuales de las entrevistas y de las sesiones, con la referencia anónima de cada persona]*

## 6. Mejoras identificadas

**De la validación técnica (ya decididas):**

- **S01** se evalúa solo en procesos con adjudicación: 33 de sus 69 señales eran de procesos desiertos, sin contrato que revisar.
- **S01** se llama "Un solo participante registrado", porque la fuente cuenta participantes, no ofertas.
- **S02** queda desactivada hasta tener un plazo de presentación confiable.
- **S03 y S05** piden una participación o proporción mínima del 5 %, para no marcar casos con muy poco peso.
- **S04** solo se activa con los umbrales verificados en la norma oficial, con su cita.
- Cada proceso trae su **nomenclatura**, para encontrarlo en el SEACE.
- El paquete público se reduce de 12,9 MB a 8,3 MB.

**De los usuarios:** *[lista priorizada después de cada ronda]*

## 7. Qué falta desarrollar

**Para el MVP (antes del 25 de noviembre):**

- la ficha del proceso y la del proveedor, con la explicación de cada señal (Lote C);
- el diálogo de decisión, el historial, la página de Revisión, la Metodología y el reporte de trazabilidad (Lote D);
- el paquete con datos reales en el enlace público (lotes A y B).

**Después de la hackathon:** la [ruta de escalamiento](../arquitectura/arquitectura.md#ruta-de-escalamiento):

1. **Piloto en una entidad:** inicio de sesión institucional, revisiones compartidas, actualización mensual y fuente de sanciones.
2. **Integración** con los expedientes internos e INFOBRAS.
3. **Escala** a varias entidades y regiones, con un portal ciudadano de solo lectura.
