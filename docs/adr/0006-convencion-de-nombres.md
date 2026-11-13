# 0006 · Código en inglés; interfaz, documentación y datos derivados en español

**Contexto.** Es la convención que funcionó en la hackathon anterior. Además, el código en inglés facilita usar librerías y agentes, y el usuario final lee en español.

**Decisión.**
- **En inglés:** archivos, funciones, variables, scripts, variables de entorno y nombres de componentes.
- **En español:** textos de la interfaz, documentación, specs de OpenSpec (con encabezados estructurales y SHALL/MUST en inglés), tablas y columnas de los datos derivados.
- **Sin traducir:** los campos OCDS (`ocid`, `tender.tenderPeriod`…) y los códigos de Cardinal (`R018`).
- **Nombre del producto:** se define en un solo lugar de la configuración de la web, para cambiarlo sin tocar el resto.

**Consecuencias.** Las consultas mezclan columnas en español con campos OCDS en inglés. Es aceptable siempre que las tablas derivadas documenten de qué campo OCDS viene cada columna.
