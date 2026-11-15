# 0009 · Backend del piloto: API, inicio de sesión institucional y bitácora encadenada

**Contexto.** El MVP no tiene backend ni inicio de sesión (ADR 0001 y 0002). Las revisiones se guardan en el navegador y el rol se elige desde un selector, así que no se sabe qué persona tomó cada decisión. Para el piloto en una entidad, la fase 2 de la [ruta de escalamiento](../arquitectura/arquitectura.md#ruta-de-escalamiento), hacen falta tres cosas: revisiones compartidas entre computadoras, identidad real de quien decide y un registro de cambios que nadie pueda reescribir en silencio. También surgió la idea de usar Face ID, la huella y la API de RENIEC con el DNI. El diseño se hace ahora y el código se escribe después del Stage-Gate 1, para no arriesgar la demo. El detalle está en [`docs/arquitectura/piloto/`](../arquitectura/piloto/README.md).

**Decisión.**
- **API con FastAPI y PostgreSQL.** La web cambia `StaticDataSource` por `ApiDataSource` y `LocalReviewStore` por `ApiReviewStore`, sin rehacer pantallas. El contrato está en [`api.openapi.yaml`](../arquitectura/piloto/api.openapi.yaml).
- **Prisma no guarda contraseñas.** El inicio de sesión se delega por OpenID Connect al proveedor de identidad de la entidad o a ID GOB.PE. Para el segundo factor se usan passkeys (WebAuthn): la huella o el rostro se verifican en el dispositivo y Prisma solo guarda una clave pública.
- **No usamos APIs de terceros que consultan el DNI** ni guardamos el DNI. Un número de DNI no prueba quién está frente a la pantalla, y esas APIs no tienen una base legal clara bajo la Ley 29733. Si la entidad tiene convenio con RENIEC mediante la PIDE, esa verificación ocurre en su proveedor de identidad, no en Prisma.
- **El rol viene de la sesión, no del navegador.** El servidor aplica los mismos permisos que `canReview(rol, accion)`, más el rol `administrador` para gestionar las cuentas de la entidad.
- **Bitácora encadenada de solo inserción.** Cada acción relevante (decidir, asignar, exportar, importar, iniciar sesión, cambiar roles) agrega una fila con el hash SHA-256 de la fila anterior. La base impide editar o borrar filas, y la cadena se puede verificar en cualquier momento. El esquema está en [`esquema.sql`](../arquitectura/piloto/esquema.sql).
- **La bitácora es interna.** La ven el auditor y el administrador de la entidad. Nunca se publica en el enlace público.

**Consecuencias.**
- La trazabilidad deja de ser simulada: cada decisión queda atribuida a una persona y a su cargo, y cualquier alteración se detecta.
- Las escrituras de `ReviewStore` pasarán a devolver promesas. Desde ahora, la interfaz debe llamarlas con `await`, como ya permite el README del Lote D, para que el cambio no toque las pantallas.
- Aparecen tareas nuevas: inscribir el banco de datos personales ante la Autoridad Nacional de Protección de Datos Personales, gestionar secretos, desplegar un servidor y operar respaldos. La superficie de ataque crece frente al MVP.
- Dónde se aloja el servidor (nube o centro de datos de la entidad) se decide con la entidad del piloto.
- `resetDemo` no existe en la API: en el piloto nada se borra.
