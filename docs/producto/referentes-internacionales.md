# Referentes internacionales: qué tomamos y cómo, sin copiar

## Regla del equipo

No copiamos código ni textos de nadie. Tomamos los referentes de cuatro formas legítimas y siempre lo declaramos, como piden las bases (p. 16 y anexo 2):

| Forma | Qué significa | Ejemplo |
|---|---|---|
| **Usar como dependencia** | Instalamos una librería abierta y la llamamos desde nuestro código, respetando su licencia | Cardinal (MIT) |
| **Implementar una metodología publicada** | Escribimos nuestro propio código siguiendo definiciones y fórmulas documentadas, y las citamos | Guía de banderas rojas de OCP |
| **Inspirarnos en el diseño** | Tomamos principios y patrones de interfaz o de gobierno, no su software | Arachne (cerrado) |
| **Aprender de su experiencia** | Usamos sus lecciones para no repetir errores | FUNES, Serenata de Amor |

**Nuestro aporte propio:** adaptar todo eso a la normativa y a los datos del Perú, explicar cada señal en lenguaje claro y registrar la decisión humana.

## Resumen: qué podemos usar y qué no

| Referente | ¿Podemos usar su tecnología? | Licencia | Qué tomamos |
|---|---|---|---|
| **Cardinal** (Open Contracting Partnership) | **Sí, como dependencia** | MIT | Cálculo de indicadores sobre datos OCDS y su método de umbrales con cuartiles y vallas |
| **Guía de banderas rojas de OCP** (73 indicadores) | **Sí, como metodología** | El sitio de OCP publica su contenido con CC BY 4.0, salvo indicación contraria (confirmar en el PDF) | Definiciones y fórmulas de las señales que Cardinal no implementa |
| **Arachne / Arachne+** (Comisión Europea) | **No:** herramienta cerrada, solo para autoridades que gestionan fondos de la UE | Propietaria | Principios: puntaje para priorizar, categorías de riesgo, ninguna decisión automática y confirmación humana |
| **Early Warning Red Flags** (Hungría, sobre licitaciones del TED) | Es abierta, pero analiza documentos de licitaciones europeas | Abierta (licencia por verificar) | Distinguir dos niveles de señal y la idea de que "riesgoso" no significa "corrupto" |
| **DOZORRO / Prozorro** (Ucrania) | No directamente | — | Bandeja de procesos priorizados y monitoreo con participación |
| **ProACT** (Banco Mundial con el Government Transparency Institute) | No directamente | — | Indicadores a nivel de contrato, comprador, proveedor y mercado |
| **FUNES** (Ojo Público, Perú) | No | — | Adaptaron el modelo europeo de Fazekas a la realidad peruana y tuvieron problemas para obtener datos; por eso usamos descargas oficiales |
| **Serenata de Amor** (Brasil) | Código abierto, pero pensado para gastos parlamentarios | MIT | Señalar casos para que personas los verifiquen, sin decidir por ellas |
| **Kingfisher Collect y OCDS Kit** (OCP) | **Sí**, si hiciera falta | BSD-3-Clause | Descargar y manipular datos OCDS. Hoy el OCP Data Registry ya nos entrega los archivos |

## Cardinal en detalle

- **Qué es:** librería y herramienta de línea de comandos de Open Contracting Partnership para calcular banderas rojas e indicadores con datos OCDS. Está escrita en Rust y tiene un paquete de Python, `ocdscardinal` (versión 0.0.9 de octubre de 2026, MIT, Python ≥ 3.11).
- **Entrada:** procesos compilados en JSON por líneas. Es el mismo formato en que el OCP Data Registry publica los datos del Perú.
- **Indicadores disponibles (11):**

  | Código | Indicador |
  |---|---|
  | R003 | Plazo corto de presentación de ofertas |
  | R018 | Oferta única |
  | R024 | Precio cercano al de la oferta ganadora |
  | R025 | Exceso de ofertas no ganadoras |
  | R028 | Precios idénticos entre postores |
  | R030 | Oferta tardía que resultó ganadora |
  | R035 | Todas las ofertas descalificadas, salvo la ganadora |
  | R036 | La oferta más baja fue descalificada |
  | R038 | Exceso de descalificaciones |
  | R048 | Proveedor con variedad atípica de rubros |
  | R058 | Oferta ganadora con descuento atípico |

- **Advertencia:** varios indicadores necesitan datos de ofertas (`bids`) con montos y estados. El spike de datos debe comprobar si el OECE los publica. Si no, hay dos caminos: adaptar los datos (por ejemplo, reconstruir las ofertas a partir de `tender.tenderers`) o implementar la señal nosotros siguiendo la guía.
- **Cómo lo usamos:**
  1. Ejecutamos `ocdscardinal prepare` y luego `ocdscardinal indicators` con nuestro propio `settings.ini`.
  2. Leemos sus resultados y los combinamos con nuestras señales.
  3. Usamos Cardinal también para contrastar nuestros cálculos.

## Arachne en detalle

- **Qué es:** herramienta de minería de datos y puntuación de riesgo de la Comisión Europea para los fondos de la UE. Arachne+ reemplazó gradualmente al sistema anterior entre abril y junio de 2026.
- **Cómo funcionaba la versión anterior:** más de 100 indicadores agrupados en 7 categorías: contratación, gestión del contrato, elegibilidad, desempeño, concentración, otros y alertas reputacionales y de fraude. Combina datos de los proyectos con bases externas como ORBIS y World Compliance, y puntúa proyectos, contratos, beneficiarios y entidades.
- **Principio que adoptamos:** Arachne no toma decisiones automáticas. Solo identifica riesgos potenciales, y la autoridad debe verificarlos y confirmarlos.
- **Qué no podemos replicar:** su código y sus bases externas de empresas y personas, que son de pago.
- **Qué sí replicamos en el diseño:**
  - categorías de señales;
  - puntaje de prioridad por proceso, proveedor y entidad;
  - una ficha con el detalle de cada caso;
  - un flujo de verificación y confirmación humana.

## Cómo se ve en el producto

| Pieza | Influencia | Cómo la implementamos |
|---|---|---|
| Señales S01 y S02 | Cardinal R018 y R003 | Cardinal como dependencia, o código propio si los datos no le alcanzan |
| Señales S03 a S06 | Guía de OCP | Código propio que cita la guía |
| Prioridad de revisión | Arachne (puntaje para orientar controles) | Suma ponderada y transparente, sin probabilidad de corrupción |
| Categorías | Arachne | Competencia, tiempos, concentración, fraccionamiento y ejecución |
| Explicación | Arachne, Early Warning Red Flags y Serenata de Amor | Tarjeta "Por qué aparece" |
| Decisión humana | Arachne (sin decisiones automáticas) | Bandeja de revisión |
| Datos | OCDS y OCP Data Registry | Descarga oficial, sin scraping |

## Cómo citarlo

En la ficha técnica, en la página de metodología y en el pie de la aplicación:

> Indicadores basados en la guía *Red Flags in Public Procurement* y en la librería Cardinal de Open Contracting Partnership (licencia MIT). Principios de revisión inspirados en Arachne (Comisión Europea). Datos: OECE vía OCP Data Registry (CC BY 4.0), filtrados y transformados por el equipo.

## Fuentes

- [Cardinal: anuncio de OCP](https://www.open-contracting.org/2024/06/12/cardinal-an-open-source-library-to-calculate-public-procurement-red-flags/) · [documentación](https://cardinal.readthedocs.io/) · [repositorio](https://github.com/open-contracting/cardinal-rs)
- [Guía de banderas rojas de OCP](https://www.open-contracting.org/resources/red-flags-in-public-procurement-a-guide-to-using-data-to-detect-and-mitigate-risks/)
- [Arachne: Anti-Fraud Knowledge Centre](https://antifraud-knowledge-centre.ec.europa.eu/useful-tools/what-arachne_en) · [DG Empleo de la Comisión Europea](https://employment-social-affairs.ec.europa.eu/policies-and-activities/funding/european-social-fund-plus-esf/what-arachne_de) · [Carta de Arachne](https://mmr.gov.cz/Dotace/media/SF/Arachne-Charter.pdf)
- [Early Warning Red Flags](https://antifraud-knowledge-centre.ec.europa.eu/library-good-practices-and-case-studies/good-practices/early-warning-red-flags_en)
- [Analítica de compras de Transparency International Ukraine](https://ti-ukraine.org/en/project/analytics-for-procurement/)
- [ProACT del Banco Mundial](https://anticor.world/en/main/news_page/the_world_bank_launches_a_prototype_platform_to_counter_corruption_in_public_procurement)
- [FUNES, según OCP](https://www.open-contracting.org/2020/09/10/funes-the-corruption-detecting-algorithm-that-never-forgets/) · [GIJN](https://gijn.org/es/articulos/memoria-contra-la-corrupcion-datos-y-algoritmos-para-investigar-compras-publicas/)
- [Serenata de Amor](https://github.com/okfn-brasil/serenata-de-amor) · [Kingfisher Collect](https://github.com/open-contracting/kingfisher-collect) · [OCDS Kit](https://github.com/open-contracting/ocdskit)
