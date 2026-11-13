# Contrato del paquete de datos (v1)

Es el punto de encuentro entre lotes. El **Lote A** lo produce con el pipeline, y los **lotes B, C y D** lo leen solo a través de `DataSource`. Lo acuerdan A y B en la Fase 0, y los cuatro lo aprueban.

**Cambios al contrato:** cualquier cambio de forma pasa por un PR que actualiza, a la vez:

- este documento;
- el JSON Schema (`contracts/paquete-de-datos.schema.json`);
- el fixture sintético.

## Reglas generales

- **Formato:** JSON en UTF-8. Las fechas siguen ISO 8601 (`2026-03-15` o `2026-03-15T10:00:00-05:00`) y los montos son números en la moneda indicada.
- **Datos faltantes:** un dato que no existe vale `null`. Nunca se inventa ni se rellena.
- **Datos simulados:** todo lo que no venga de la fuente oficial lleva `"simulado": true`.
- **Modo público** (`manifest.modo = "publico"`): ningún archivo contiene nombres, RUC ni enlaces que identifiquen a un proveedor. Solo seudónimos estables.
- **Personas naturales:** no muestran nombre en ningún modo.

## Archivos

| Archivo | Contenido | Lo usa |
|---|---|---|
| `manifest.json` | Versiones, fuente, licencia, fecha de corte, región, conteos, exclusiones y señales activas | Todas las pantallas (cabecera, metodología) |
| `entidades.json` | Entidades con su resumen para el panel | B |
| `procesos/<entidad_id>.json` | Procesos de una entidad, con prioridad | B, C, D |
| `senales/<entidad_id>.json` | Señales de una entidad, con su comparación y sus entradas | B, C, D |
| `proveedores.json` | Proveedores (seudónimo en modo público) | C |
| `expedientes-simulados.json` | Expedientes internos sintéticos para S08 y la línea de tiempo interna | C, D |

## `manifest.json`

```json
{
  "version_contrato": "1.0",
  "version_reglas": "2026.11.1",
  "generado": "2026-11-15T10:00:00-05:00",
  "fecha_corte": "2026-10-04",
  "fuente": {
    "nombre": "OECE – Contrataciones Abiertas (SEACE), vía OCP Data Registry",
    "url": "https://data.open-contracting.org/en/publication/135",
    "archivos": ["2025.jsonl.gz", "2026.jsonl.gz"]
  },
  "licencia": "CC BY 4.0",
  "atribucion": "Datos: OECE – Contrataciones Abiertas (SEACE), vía OCP Data Registry, licencia CC BY 4.0. Datos filtrados y transformados por el equipo para calcular señales de revisión.",
  "region": "LA LIBERTAD",
  "anios": [2025, 2026],
  "modo": "publico",
  "conteos": { "procesos": 0, "senales": 0, "proveedores": 0, "entidades": 0 },
  "exclusiones": [{ "motivo": "región indeterminada", "cantidad": 0 }],
  "correcciones": [{ "tipo": "postor duplicado", "cantidad": 0 }],
  "senales_activas": ["S01", "S02", "S03", "S04"],
  "senales_desactivadas": [{ "codigo": "S06", "motivo": "menos del 10 % de contratos con monto final" }]
}
```

## `entidades.json`

```json
[
  {
    "id": "entidad-0001",
    "nombre": "Nombre oficial de la entidad",
    "tipo": "universidad | municipalidad | gobierno regional | otro",
    "resumen": {
      "procesos": 0,
      "monto_total": 0,
      "procesos_con_senales": 0,
      "por_categoria": { "competencia": 0, "tiempos": 0, "concentracion": 0, "fraccionamiento": 0, "ejecucion": 0 },
      "tendencia_mensual": [{ "mes": "2026-01", "procesos": 0, "con_senales": 0 }],
      "top_proveedores": [{ "proveedor_id": "P0137", "participacion": 0.31, "adjudicaciones": 9 }]
    },
    "senales_entidad": ["S05-entidad-0001"]
  }
]
```

## `procesos/<entidad_id>.json`

```json
[
  {
    "ocid": "ocds-dgv273-…",
    "entidad_id": "entidad-0001",
    "descripcion": "Adquisición de equipos de laboratorio",
    "metodo": "Adjudicación simplificada",
    "objeto": "bienes | servicios | obras | consultoria_de_obras",
    "moneda": "PEN",
    "monto_referencial": 0,
    "monto_adjudicado": 0,
    "monto_final": null,
    "fechas": {
      "convocatoria": "2026-03-02",
      "inicio_presentacion": "2026-03-03",
      "fin_presentacion": "2026-03-05",
      "adjudicacion": "2026-03-12",
      "contrato": "2026-03-20",
      "culminacion": null
    },
    "numero_postores": 1,
    "estado": "Contratado",
    "ganadores": ["P0137"],
    "documentos": [{ "tipo": "bases", "titulo": "Bases integradas", "url": "https://…" }],
    "url_seace": "https://…",
    "senales": ["S01-ocds-dgv273-…", "S03-P0137-entidad-0001"],
    "prioridad": {
      "puntaje": 6,
      "nivel": "alta",
      "desglose": [{ "codigo": "S01", "peso": 3 }, { "codigo": "S03", "peso": 3 }]
    },
    "simulado": false
  }
]
```

`prioridad` vale `null` si el proceso no tiene señales.

## `senales/<entidad_id>.json`

```json
[
  {
    "id": "S01-ocds-dgv273-…",
    "codigo": "S01",
    "categoria": "competencia",
    "nivel": "proceso | proveedor_entidad | grupo | entidad | expediente",
    "objeto": { "tipo": "proceso", "id": "ocds-dgv273-…" },
    "ocids": ["ocds-dgv273-…"],
    "valor": 1,
    "unidad": "postores",
    "umbral": { "operador": "igual", "valor": 1, "descripcion": "procedimiento competitivo con un solo postor" },
    "comparacion": {
      "descripcion": "Adjudicaciones simplificadas de La Libertad en 2025",
      "ambito": "region | nacional",
      "n": 812,
      "q1": 2, "mediana": 3, "q3": 5,
      "valla_superior": null,
      "percentil_del_caso": 4,
      "proporcion_referencia": 0.62
    },
    "referencia": { "cardinal": "R018", "ocp": "Single bid received" },
    "version_regla": "S01@1",
    "entradas": { "numero_postores": 1, "metodo": "Adjudicación simplificada" },
    "calidad": [],
    "simulado": false
  }
]
```

Los campos de `comparacion` que no apliquen a una señal valen `null`. Los textos explicativos no viajan en el paquete: la web los arma a partir de estos valores ([Lote C](../plan/cronograma-y-lotes.md)).

## `proveedores.json`

```json
[
  {
    "id": "P0137",
    "alias": "Proveedor 0137",
    "nombre": null,
    "ruc": null,
    "tipo": "persona_juridica | persona_natural | desconocido",
    "url_ficha_unica": null
  }
]
```

- **Modo local** (validación con usuarios en una laptop): `nombre`, `ruc` y `url_ficha_unica` se llenan, salvo el `nombre` de las personas naturales.
- **Modo público:** los tres valen `null`.
- **Enlace oficial:** en modo local apunta a la Ficha Única del Proveedor del OECE (`https://apps.oece.gob.pe/perfilprov-ui/ficha/<RUC>`; el formato exacto se verifica en el spike).

## `expedientes-simulados.json`

```json
[
  {
    "ocid": "ocds-dgv273-…",
    "simulado": true,
    "etapas": [
      { "etapa": "requerimiento", "responsable": "Área usuaria · Persona A", "fecha": "2026-02-20", "documento": "Requerimiento N.° 015" },
      { "etapa": "evaluacion", "responsable": "Comité · Persona A", "fecha": "2026-03-10", "documento": "Acta de evaluación" },
      { "etapa": "conformidad", "responsable": "Área usuaria · Persona A", "fecha": "2026-04-02", "documento": null },
      { "etapa": "pago", "responsable": "Tesorería · Persona C", "fecha": "2026-04-05", "documento": "Comprobante de pago" }
    ]
  }
]
```

Este ejemplo dispara S08: la misma persona solicita, evalúa y da conformidad, y la conformidad no tiene documento.
