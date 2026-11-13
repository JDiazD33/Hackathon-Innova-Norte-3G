# Visión del producto y encaje con los desafíos

## En una frase

Una plataforma web que prioriza qué contrataciones públicas conviene revisar, explica por qué con una metodología internacional y deja registrada la decisión de una persona.

## Problema

En una entidad pública, el área de integridad, el órgano de control o la propia logística tienen cientos o miles de procesos de contratación al año y poco tiempo para revisarlos. La información existe en el SEACE, pero está dispersa y sin priorizar. Para saber si un proveedor gana con demasiada frecuencia, si un proceso recibió una sola oferta o si varias compras parecidas se dividieron, hay que armar hojas de cálculo a mano. Por eso las revisiones llegan tarde, cuando ya hay una auditoría, una impugnación o un proceso judicial.

Esto es todavía una **hipótesis**. Se confirma o se corrige con las entrevistas del Lote D:

- **H1.** Quien revisa contrataciones no tiene una forma rápida de priorizar los procesos con señales de riesgo.
- **H2.** Una explicación clara de cada señal hace que la persona confíe en ella y sepa qué revisar.
- **H3.** Registrar la decisión (justificada o requiere atención) ayuda a reconstruir después por qué se actuó así.

## Usuario principal

**Especialista de integridad o de control interno** de una entidad pública de La Libertad, como una universidad, una municipalidad o el gobierno regional. Revisa contrataciones para prevenir riesgos. No programa. Trabaja en escritorio con el SEACE y Excel.

**Usuarios secundarios:**

- Jefatura de logística o abastecimiento, para el autocontrol preventivo.
- Auditor del órgano de control institucional, con acceso de solo lectura.
- Ciudadanía y periodismo, en una fase futura.

## Propuesta de valor

1. **Prioriza:** convierte miles de procesos en una bandeja corta, ordenada por prioridad de revisión.
2. **Explica:** cada señal dice qué encontró, con qué lo comparó, por qué importa, qué conviene revisar y qué no significa.
3. **Deja huella:** registra la revisión humana (quién, cuándo, qué decidió y por qué) y la exporta en un reporte de trazabilidad.
4. **Tiene respaldo internacional:** usa indicadores de la guía de Open Contracting Partnership y de Cardinal, principios de Arachne (UE) y lecciones de FUNES (Perú), adaptados a la normativa peruana ([referentes](referentes-internacionales.md)).

## Caso práctico para la demostración

> María es especialista de integridad en una entidad pública de La Libertad y debe decidir qué procesos revisar este mes.
>
> 1. Abre el panel: la entidad tuvo 1 240 procesos en el último año y 37 tienen señales. *(Cifras ilustrativas; se reemplazan con las reales.)*
> 2. Filtra la bandeja por prioridad alta y abre el primer proceso. Tiene tres señales: recibió una sola oferta, el plazo para presentarla fue muy corto y el ganador obtuvo 9 de 12 procesos similares en el año.
> 3. Lee por qué aparece cada señal, con qué se comparó y qué no significa. Revisa los documentos en el SEACE desde el enlace.
> 4. Registra su decisión ("requiere atención") con un comentario y la asigna a la jefatura.
> 5. Genera el reporte de trazabilidad del caso.

## Alcance del MVP (Stage-Gate 1)

**Incluye:**

- Datos reales de La Libertad de 2025 y 2026. El periodo se confirma con el spike de datos.
- Cuatro señales núcleo (S01–S04) y una o dos opcionales, según lo que permitan los datos.
- Panel de la entidad, bandeja priorizada, ficha del proceso, ficha del proveedor, revisión con roles simulados, reporte y página de metodología.
- Seudonimización de proveedores en el enlace público.

**No incluye:**

- Un puntaje de "probabilidad de corrupción". Es una decisión de diseño ([ADR 0007](../adr/0007-senales-no-acusaciones.md)).
- Conexión al SEACE ni a los sistemas internos de una entidad.
- Inicio de sesión real: los roles son simulados.
- Aplicación móvil nativa ([ADR 0001](../adr/0001-aplicacion-web-responsiva.md)).

## Encaje con los desafíos

| Aspecto | Desafío 2 (recomendado) | Desafío 1 (alternativa) |
|---|---|---|
| Qué parte del MVP es central | Señales explicables, bandeja de revisión y trazabilidad | Ficha del proveedor (antecedentes y sanciones) y seguimiento contractual |
| Coincidencia con las soluciones que sugieren las bases | Directa en las 5 | Parcial (2 o 3 de 5) |
| Usuario | Integridad o control interno | Logística o supervisión de obras |
| Riesgo principal | Otros equipos harán "alertas" con datos sintéticos; nos diferencian los datos reales y la metodología | Los datos no traen modificaciones contractuales (ampliaciones, adicionales) |

La arquitectura es la misma en ambos casos. Solo cambian el énfasis y el caso práctico.

## En qué nos diferenciamos de lo que ya existe en el Perú

| Herramienta | Qué hace | Nuestra diferencia |
|---|---|---|
| SEACE y Contrataciones Abiertas (OECE) | Publican los procesos y tableros generales | No priorizan ni explican riesgos. Los usamos como fuente y enlazamos a ellos |
| Ficha Única del Proveedor (OECE) | Muestra antecedentes, sanciones y contratos de un proveedor | La enlazamos desde nuestra ficha; no la duplicamos |
| FUNES (Ojo Público) | Algoritmo periodístico que calcula un porcentaje de riesgo por contrato, empresa o entidad | No damos un porcentaje de riesgo. Damos señales explicadas a quien revisa dentro de la entidad y registramos su decisión |
| INFOBRAS (Contraloría) | Seguimiento de obras públicas | Relevante para el desafío 1; posible integración futura |

## Nombre del producto

Pendiente. Opciones para votar; hay que verificar que no choquen con marcas existentes:

- **Faro:** ilumina lo que merece atención.
- **Trazo:** la trazabilidad de cada decisión.
- **Lupa Pública.**
- **Señal Clara.**
- **Vigía.**

## Preguntas abiertas

- ¿Cuál es el desafío definitivo?
- ¿Qué entidades de La Libertad usamos en el caso práctico? Conviene no poner a la entidad organizadora como ejemplo principal sin conversarlo antes.
- ¿A quién entrevistamos? Opciones: logística o abastecimiento, control interno, el profesor con experiencia en el sector público y el contacto del Poder Judicial.
