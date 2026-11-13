# Proposal

## Why

Una señal solo sirve si una persona la revisa y deja constancia de lo que decidió. Arachne lo exige: ninguna decisión es automática. Además, la herramienta debe ser transparente sobre sus fuentes, licencias y límites, y no debe acusar a nadie: el criterio de seguridad y ética vale 10 puntos, y la declaración jurada del anexo 2 obliga a reconocer a terceros. Este lote (André, ★★) construye el flujo de revisión humana y todo lo que hace confiable al producto.

## What Changes

- **Revisión humana:**
  - roles simulados: analista de integridad, jefatura y auditor (solo lectura);
  - registro de decisiones (en revisión, justificada o requiere atención), con un comentario obligatorio cuando corresponde;
  - asignación de casos y vista "Revisión" con lo asignado a mí, lo que asigné y lo decidido;
  - historial que no se edita ni se borra;
  - persistencia en el navegador, con exportación e importación de las revisiones y reinicio para la demostración.
- **Reporte de trazabilidad imprimible** por proceso.
- **Transparencia y lenguaje:**
  - página de metodología: señales, fórmula de prioridad, referentes y licencias, fuente y límites de los datos, versión de las reglas;
  - atribución CC BY 4.0 en el pie;
  - etiqueta "Dato simulado" y aviso de modo demostración;
  - verificación automática de que la interfaz no use vocabulario acusatorio;
  - sin analítica de usuarios.

## Capabilities

### New Capabilities

- `revision/decisiones-de-revision`: roles simulados, decisiones humanas, asignaciones, historial, persistencia local y reporte de trazabilidad.
- `etica/transparencia-y-lenguaje`: metodología visible, atribución de fuentes y licencias, marca de datos simulados, lenguaje no acusatorio y ausencia de analítica.

### Modified Capabilities

Ninguna.

## Impact

- **Código nuevo:** en `web/`, la vista `/revision`, el reporte `/reporte/[ocid]`, la página `/metodologia`, el `ReviewStore` y la verificación del vocabulario en las pruebas.
- **Usa:** `DataSource` y la base del Lote B, y la tarjeta de señal del Lote C para el reporte.
- **Expone:** el `ReviewStore`, que la bandeja (Lote B) y la ficha del proceso (Lote C) leen para mostrar el estado y el historial.
- **Sin backend en el MVP:** en un piloto, las revisiones pasarían a un servidor con inicio de sesión institucional (ruta de escalamiento en `docs/arquitectura/arquitectura.md`).
