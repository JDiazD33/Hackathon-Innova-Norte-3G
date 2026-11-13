# Spec Delta

## Purpose

Obtener, filtrar y normalizar los datos abiertos de contrataciones del OECE (formato OCDS) para que las señales se calculen sobre una base reproducible y documentada.

## ADDED Requirements

### Requirement: Fuente oficial y abierta
El pipeline SHALL obtener los datos de contrataciones solo desde la publicación del OECE en el OCP Data Registry o desde descargas oficiales del OECE. SHALL NOT hacer scraping del SEACE ni usar APIs que exijan credenciales que el equipo no tenga.

#### Scenario: Descarga de un año
- **WHEN** se ejecuta la obtención de datos para el año 2026
- **THEN** el archivo anual `.jsonl.gz` del registro queda en `data/raw/`
- **AND** se registran la URL de origen, la fecha de descarga y el tamaño del archivo

#### Scenario: Fuente no permitida
- **WHEN** la configuración apunta a una URL que no está en la lista de fuentes permitidas
- **THEN** el pipeline se detiene sin descargar nada y muestra un error que nombra la URL rechazada

### Requirement: Filtro por región y periodo
El pipeline SHALL conservar solo los procesos del departamento configurado (La Libertad por defecto) y de los años configurados. Los procesos cuya región no se pueda determinar SHALL quedar excluidos y contados con su motivo.

#### Scenario: Proceso de otra región
- **WHEN** un proceso pertenece a una entidad de Lambayeque y el filtro es La Libertad
- **THEN** el proceso no aparece en las tablas derivadas

#### Scenario: Región indeterminada
- **WHEN** un proceso no trae ningún dato que permita determinar su departamento
- **THEN** el proceso se excluye
- **AND** el manifiesto suma una exclusión con el motivo "región indeterminada"

### Requirement: Tablas normalizadas
El pipeline SHALL producir las tablas `procesos`, `postores`, `adjudicaciones`, `contratos`, `proveedores`, `entidades`, `items` y `documentos`, vinculadas por `ocid` y por los identificadores OCDS originales, sin traducirlos.

#### Scenario: Proceso con dos adjudicaciones
- **WHEN** un proceso tiene dos adjudicaciones a proveedores distintos
- **THEN** la tabla `adjudicaciones` tiene dos filas con el mismo `ocid`
- **AND** cada fila conserva su identificador OCDS de adjudicación

### Requirement: Tratamiento de problemas de calidad
El pipeline SHALL tratar los problemas de calidad conocidos de la fuente (postores duplicados, contratos sin estado y adjudicaciones sin contrato vinculado) sin descartar el proceso completo, y SHALL contar cada corrección aplicada.

#### Scenario: Postor duplicado
- **WHEN** un proceso lista dos veces al mismo postor con el mismo identificador
- **THEN** la tabla `postores` lo registra una sola vez
- **AND** el manifiesto suma una corrección del tipo "postor duplicado"

#### Scenario: Contrato sin estado
- **WHEN** un contrato no trae el campo de estado
- **THEN** el contrato se conserva con el estado "sin estado"

### Requirement: Manifiesto de cada ejecución
Cada ejecución SHALL escribir un manifiesto con la fuente, la licencia, la fecha de corte de los datos, la región, los años, los conteos por tabla, las exclusiones y correcciones por motivo, y la versión de las reglas.

#### Scenario: Ejecución completa
- **WHEN** termina una ejecución sin errores
- **THEN** existe un manifiesto cuyos conteos por tabla coinciden con el número de filas de cada tabla derivada

### Requirement: Datos fuera del repositorio
Los datos descargados y derivados SHALL NOT subirse al repositorio. Solo se versionan fixtures sintéticos pequeños para las pruebas.

#### Scenario: Después de una ejecución
- **WHEN** se ejecuta el pipeline completo y luego `git status`
- **THEN** ningún archivo de `data/raw/`, `data/interim/` ni `data/derived/` aparece como cambio por confirmar
