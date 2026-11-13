# Spec Delta

## Purpose

Entregar a la aplicación web un paquete de datos de solo lectura que cumpla el contrato acordado entre lotes, proteja la identidad de los proveedores en el enlace público y distinga los datos simulados.

## ADDED Requirements

### Requirement: Conformidad con el contrato
El paquete de datos SHALL cumplir el contrato v1 descrito en `docs/arquitectura/contrato-paquete-de-datos.md` y SHALL validar contra `contracts/paquete-de-datos.schema.json` antes de publicarse.

#### Scenario: Paquete válido
- **WHEN** termina la exportación
- **THEN** cada archivo del paquete valida contra el JSON Schema del contrato

#### Scenario: Campo obligatorio faltante
- **WHEN** un proceso exportado no trae el campo `ocid`
- **THEN** la exportación falla y el error nombra el archivo y el campo faltante

### Requirement: Modo público sin identidad de proveedores
En modo público, el paquete SHALL NOT contener nombres, RUC ni enlaces que identifiquen a un proveedor. SHALL usar seudónimos estables: el mismo proveedor recibe el mismo seudónimo en todos los archivos y entre ejecuciones con el mismo secreto local.

#### Scenario: Búsqueda de identificadores
- **WHEN** se busca en el paquete público cualquier RUC o nombre de proveedor de los datos de origen
- **THEN** no se encuentra ninguna coincidencia

#### Scenario: Mismo proveedor en dos procesos
- **WHEN** un proveedor ganó dos procesos de la misma entidad
- **THEN** ambos procesos lo muestran con el mismo seudónimo

### Requirement: Personas naturales sin nombre
El paquete SHALL NOT incluir, en ningún modo, el nombre de un proveedor que sea persona natural.

#### Scenario: Persona natural en modo local
- **WHEN** se exporta en modo local un proveedor cuyo RUC empieza con 10
- **THEN** su `nombre` es `null` y su tipo es `persona_natural`

### Requirement: Modo local para validación
En modo local, el paquete SHALL incluir el nombre de los proveedores (salvo personas naturales), su RUC y el enlace a la Ficha Única del Proveedor, y el manifiesto SHALL indicar el modo `local`. El paquete en modo local SHALL NOT versionarse en el repositorio.

#### Scenario: Paquete local
- **WHEN** se exporta en modo local
- **THEN** el manifiesto tiene `"modo": "local"` y los proveedores que son personas jurídicas muestran su nombre y su RUC
- **AND** `git status` no muestra archivos del paquete local

### Requirement: Datos simulados marcados
Todo registro que no provenga de la fuente oficial SHALL llevar `simulado: true`. Esto incluye los expedientes internos y las señales calculadas sobre ellos.

#### Scenario: Expediente simulado
- **WHEN** se exportan los expedientes internos generados para la demostración
- **THEN** cada expediente y cada señal S08 derivada de él tiene `simulado: true`

### Requirement: Manifiesto del paquete
El paquete SHALL incluir un manifiesto con la versión del contrato y de las reglas, la fuente y su licencia, el texto de atribución, la fecha de corte, la región, los años, el modo, los conteos, las exclusiones y las señales activas y desactivadas.

#### Scenario: Manifiesto completo
- **WHEN** la web lee el manifiesto
- **THEN** obtiene la fecha de corte y el texto de atribución sin tener que calcular nada
