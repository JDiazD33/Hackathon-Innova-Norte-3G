# 0004 · Pipeline en Python con DuckDB y uv

**Contexto.** Cada año de datos pesa unos 150 MB comprimido y varias veces más descomprimido. Hay que filtrar, normalizar y calcular estadísticas por grupos. Cardinal tiene un paquete de Python. El equipo es de sistemas y conoce SQL.

**Decisión.**
- Python 3.12 o 3.13, administrado con `uv`. La versión de Python de la máquina (3.15) se evita porque algunas librerías aún podrían no tener soporte.
- DuckDB para consultar JSON y Parquet con SQL, y Parquet como formato intermedio.
- Pruebas con `pytest` y fixtures sintéticos, y estilo con `ruff`.
- Configuración de las señales en un archivo versionado (YAML o TOML).

**Consecuencias.**
- Todo el procesamiento corre en una laptop, sin servidores.
- Las reglas se leen como SQL, lo que facilita explicarlas y revisarlas.
- Los comandos exactos se documentan en `CONTRIBUTING.md` cuando el proyecto exista.
