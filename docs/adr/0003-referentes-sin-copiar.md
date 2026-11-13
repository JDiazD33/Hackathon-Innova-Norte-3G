# 0003 · Referentes internacionales como dependencia, metodología o inspiración, sin copiar

**Contexto.** Queremos que el producto tenga respaldo internacional sin copiar a nadie. Las bases sancionan el plagio y exigen reconocer las contribuciones y licencias de terceros (p. 16 y anexo 2). Los referentes tienen licencias distintas: Cardinal es abierto (MIT), mientras que Arachne es una herramienta cerrada de la Comisión Europea.

**Decisión.**
- **Cardinal** se usa como **dependencia** (`ocdscardinal`) para los indicadores que los datos del Perú permitan calcular. Su código no se copia ni se modifica dentro de este repositorio.
- La **guía de banderas rojas de OCP** se usa como **metodología**: las señales que Cardinal no cubre se programan aquí y citan la guía.
- **Arachne** se usa como **inspiración de diseño**: categorías, puntaje para priorizar y la regla de que ninguna decisión es automática. No se intenta replicar su software ni sus fuentes de datos.
- Cada referente queda registrado con su licencia en `docs/producto/referentes-internacionales.md` y en la página de metodología de la aplicación.

**Consecuencias.**
- Podemos decir, con fundamento, que el producto se basa en metodología internacional y explicar exactamente qué tomamos de cada referente.
- Si los datos no permiten calcular un indicador de Cardinal, implementamos la señal nosotros o la descartamos. La documentación debe decirlo.
- Los componentes de shadcn/ui se agregan al repositorio como código fuente bajo licencia MIT: es su forma normal de distribución, no una copia indebida. Se reconocen igual en la página de metodología.
