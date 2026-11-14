#!/usr/bin/env node
/**
 * Genera el fixture sintético del contrato v1 en web/data/fixture/.
 * Todos los datos son ficticios y el resultado es siempre el mismo (semilla fija).
 * Cubre todas las señales del catálogo y casos borde: proceso sin postores, sin
 * documentos, sin enlace oficial, persona natural, nota de calidad y expedientes simulados.
 *
 * Uso (desde web/): npm run fixture
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "fixture");

// --- Utilidades deterministas ------------------------------------------------

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261113);
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pick = (items) => items[Math.floor(rand() * items.length)];
const round = (n, decimals = 4) => Math.round(n * 10 ** decimals) / 10 ** decimals;

function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** Porcentaje (0–100) de valores del grupo iguales o menores que el del caso. */
function percentilDelCaso(sorted, value) {
  return round((sorted.filter((v) => v <= value).length / sorted.length) * 100, 1);
}

const minDate = (a, b) => (a <= b ? a : b);

// --- Configuración del fixture --------------------------------------------------

const FECHA_CORTE = "2026-10-04";
const PESOS = { S01: 3, S02: 2, S03: 3, S04: 3, S06: 2, S08: 3 };
const CORTES = { alta: 5, media: 3 };
const ORDEN = ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08"];

const CATEGORIA = {
  S01: "competencia",
  S02: "tiempos",
  S03: "concentracion",
  S04: "fraccionamiento",
  S05: "competencia",
  S06: "ejecucion",
  S08: "trazabilidad",
};
const NIVEL = {
  S01: "proceso",
  S02: "proceso",
  S03: "proveedor_entidad",
  S04: "grupo",
  S05: "entidad",
  S06: "proceso",
  S08: "expediente",
};
// Igual que el pipeline (pipeline/src/pipeline/signals): solo S01 y S02 tienen equivalente en Cardinal.
const SIN_REFERENCIA = { cardinal: null, ocp: null };
const REFERENCIA = {
  S01: { cardinal: "R018", ocp: "Single bid received" },
  S02: { cardinal: "R003", ocp: "Short submission period" },
  S03: SIN_REFERENCIA,
  S04: SIN_REFERENCIA,
  S05: SIN_REFERENCIA,
  S06: SIN_REFERENCIA,
  S08: SIN_REFERENCIA,
};

const COMPRAS = [
  { descripcion: "Adquisición de equipos de laboratorio", objeto: "bienes" },
  { descripcion: "Servicio de limpieza de ambientes", objeto: "servicios" },
  { descripcion: "Adquisición de material de escritorio", objeto: "bienes" },
  { descripcion: "Servicio de mantenimiento de aire acondicionado", objeto: "servicios" },
  { descripcion: "Adquisición de computadoras de escritorio", objeto: "bienes" },
  { descripcion: "Servicio de seguridad y vigilancia", objeto: "servicios" },
  { descripcion: "Mejoramiento de servicios higiénicos del pabellón B", objeto: "obras" },
  { descripcion: "Adquisición de reactivos químicos", objeto: "bienes" },
  { descripcion: "Consultoría para el expediente técnico de un auditorio", objeto: "consultoria_de_obras" },
  { descripcion: "Adquisición de combustible para vehículos", objeto: "bienes" },
];
const MOBILIARIO = { descripcion: "Adquisición de mobiliario para aulas", objeto: "bienes" };

const RANGO_MONTO = {
  bienes: [30000, 450000],
  servicios: [40000, 380000],
  obras: [600000, 2500000],
  consultoria_de_obras: [120000, 600000],
};

const ENTIDADES = [
  {
    id: "entidad-0001",
    clave: "e1",
    nombre: "Universidad Pública Ficticia del Norte",
    tipo: "universidad",
    total: 22,
    inicio: "2025-01-06",
    rotacion: ["P0001", "P0002", "P0004", "P0005", "P0006", "P0007", "P0008", "P0009"],
    escenario: {
      concentrado: { proveedor: "P0003", procesos: [1, 3, 5, 7, 9, 12, 14, 17, 20] },
      directas: [2, 16],
      unaOferta: [3, 9, 14],
      // Pocos casos cortos para que el percentil 10 del grupo quede por encima de ellos.
      plazoCorto: [3, 17],
      fraccionamiento: [10, 11],
      sobrecosto: 15,
      culminados: [4, 8, 15],
      expedienteConSenal: 7,
      expedienteSinSenal: 1,
      sinDocumentos: 19,
      sinPostores: [],
      notaCalidad: 9,
    },
  },
  {
    id: "entidad-0002",
    clave: "e2",
    nombre: "Municipalidad Provincial Ficticia",
    tipo: "municipalidad",
    total: 18,
    inicio: "2025-01-20",
    rotacion: ["P0004", "P0005", "P0008", "P0010", "P0011", "P0012", "P0001", "P0002", "P0006"],
    escenario: {
      concentrado: null,
      directas: [1, 3, 6, 9, 12, 15, 18],
      unaOferta: [2, 8],
      plazoCorto: [8],
      fraccionamiento: [],
      sobrecosto: null,
      culminados: [5],
      expedienteConSenal: null,
      expedienteSinSenal: null,
      sinDocumentos: null,
      sinPostores: [10],
      notaCalidad: null,
    },
  },
];

const PROVEEDORES = Array.from({ length: 12 }, (_, index) => {
  const numero = String(index + 1).padStart(4, "0");
  return {
    id: `P${numero}`,
    alias: `Proveedor ${numero}`,
    nombre: null,
    ruc: null,
    tipo: index === 6 ? "persona_natural" : "persona_juridica",
    url_ficha_unica: null,
  };
});

function metodoPara(compra, esDirecta, esFraccion) {
  if (esDirecta) return "Contratación directa";
  if (esFraccion) return "Comparación de precios";
  switch (compra.objeto) {
    case "obras":
      return pick(["Licitación pública", "Adjudicación simplificada"]);
    case "consultoria_de_obras":
    case "servicios":
      return pick(["Concurso público", "Adjudicación simplificada"]);
    default:
      return pick(["Subasta inversa electrónica", "Licitación pública", "Adjudicación simplificada", "Comparación de precios"]);
  }
}

// --- Procesos -------------------------------------------------------------------

const procesosPorEntidad = new Map();
const metaPorOcid = new Map();

for (const entidad of ENTIDADES) {
  const esc = entidad.escenario;
  const procesos = [];
  let turno = 0;
  let primeraFraccion = null;

  for (let i = 1; i <= entidad.total; i++) {
    const ocid = `ocds-fixture-${entidad.clave}-${String(i).padStart(3, "0")}`;
    const esDirecta = esc.directas.includes(i);
    const esFraccion = esc.fraccionamiento.includes(i);
    const compra = esFraccion ? MOBILIARIO : COMPRAS[(i * 7 + (entidad.clave === "e1" ? 0 : 3)) % COMPRAS.length];
    const metodo = metodoPara(compra, esDirecta, esFraccion);

    let convocatoria = addDays(entidad.inicio, (i - 1) * 27 + int(0, 5));
    if (esFraccion && i === esc.fraccionamiento[0]) primeraFraccion = convocatoria;
    if (esFraccion && i === esc.fraccionamiento[1]) convocatoria = addDays(primeraFraccion, 20);

    const plazo = esc.plazoCorto.includes(i) ? 2 : int(8, 20);
    const inicio = addDays(convocatoria, 1);
    const fin = addDays(inicio, plazo);
    const adjudicacion = addDays(fin, int(3, 8));
    const contrato = addDays(adjudicacion, int(5, 12));

    let postores = esDirecta || esc.unaOferta.includes(i) ? 1 : int(2, 6);
    if (esc.sinPostores.includes(i)) postores = null;

    const [minimo, maximo] = RANGO_MONTO[compra.objeto];
    const referencial = esFraccion
      ? i === esc.fraccionamiento[0]
        ? 230000
        : 210000
      : Math.round(int(minimo, maximo) / 100) * 100;
    const adjudicado = round(referencial * (0.88 + rand() * 0.11), 2);

    let montoFinal = null;
    let culminacion = null;
    if (esc.culminados.includes(i)) {
      montoFinal = i === esc.sobrecosto ? round(adjudicado * 1.22, 2) : round(adjudicado * (1 + rand() * 0.05), 2);
      culminacion = minDate(addDays(contrato, int(60, 150)), FECHA_CORTE);
    }

    const ganador = esc.concentrado?.procesos.includes(i)
      ? esc.concentrado.proveedor
      : entidad.rotacion[turno++ % entidad.rotacion.length];

    const sinDocumentos = esc.sinDocumentos === i;
    procesos.push({
      ocid,
      entidad_id: entidad.id,
      descripcion: compra.descripcion,
      metodo,
      objeto: compra.objeto,
      moneda: "PEN",
      monto_referencial: referencial,
      monto_adjudicado: adjudicado,
      monto_final: montoFinal,
      fechas: {
        convocatoria,
        inicio_presentacion: inicio,
        fin_presentacion: fin,
        adjudicacion,
        contrato,
        culminacion,
      },
      numero_postores: postores,
      estado: montoFinal !== null ? "Culminado" : contrato <= FECHA_CORTE ? "Contratado" : "Adjudicado",
      ganadores: [ganador],
      documentos: sinDocumentos
        ? []
        : [
            { tipo: "bases", titulo: "Bases integradas", url: `https://example.org/fixture/${ocid}/bases.pdf` },
            { tipo: "acta", titulo: "Acta de otorgamiento de la buena pro", url: `https://example.org/fixture/${ocid}/acta.pdf` },
          ],
      url_seace: sinDocumentos ? null : `https://example.org/fixture/seace/${ocid}`,
      senales: [],
      prioridad: null,
      simulado: false,
    });
    metaPorOcid.set(ocid, { indice: i, plazo, esDirecta });
  }
  procesosPorEntidad.set(entidad.id, procesos);
}

// --- Señales --------------------------------------------------------------------

function senal({ id, codigo, objeto, ocids, valor, unidad, umbral, comparacion = null, entradas, calidad = [], simulado = false }) {
  return {
    id,
    codigo,
    categoria: CATEGORIA[codigo],
    nivel: NIVEL[codigo],
    objeto,
    ocids,
    valor,
    unidad,
    umbral,
    comparacion,
    referencia: REFERENCIA[codigo],
    version_regla: `${codigo}@1`,
    entradas,
    calidad,
    simulado,
  };
}

const comparacionVacia = { n: null, q1: null, mediana: null, q3: null, valla_superior: null, percentil_del_caso: null, proporcion_referencia: null };

// Proporción de contratos con monto final (S06 la informa en sus entradas, como el pipeline).
const todosLosProcesos = [...procesosPorEntidad.values()].flat();
const COBERTURA_MONTO_FINAL = round(
  todosLosProcesos.filter((p) => p.monto_final !== null).length / todosLosProcesos.filter((p) => p.fechas.contrato).length,
);

// Grupo de comparación de S02: plazos de todos los procesos competitivos del fixture.
const plazosCompetitivos = [...metaPorOcid.values()].filter((m) => !m.esDirecta).map((m) => m.plazo).sort((a, b) => a - b);
const p10 = round(quantile(plazosCompetitivos, 0.1), 1);
if (!(2 < p10)) throw new Error(`El percentil 10 (${p10}) debe ser mayor que el plazo corto del escenario.`);

const senalesPorEntidad = new Map();
const expedientes = [];

for (const entidad of ENTIDADES) {
  const esc = entidad.escenario;
  const procesos = procesosPorEntidad.get(entidad.id);
  const porIndice = (i) => procesos[i - 1];
  const senales = [];

  // S01 · oferta única.
  const competitivosConDato = procesos.filter((p) => p.metodo !== "Contratación directa" && p.numero_postores !== null);
  const conCompetencia = competitivosConDato.filter((p) => p.numero_postores >= 2).length / competitivosConDato.length;
  for (const i of esc.unaOferta) {
    const p = porIndice(i);
    senales.push(
      senal({
        id: `S01-${p.ocid}`,
        codigo: "S01",
        objeto: { tipo: "proceso", id: p.ocid },
        ocids: [p.ocid],
        valor: 1,
        unidad: "postores",
        umbral: { operador: "igual", valor: 1, descripcion: "procedimiento competitivo con un solo postor" },
        comparacion: {
          ...comparacionVacia,
          descripcion: "Procesos competitivos de la entidad (2025–2026)",
          ambito: "region",
          n: competitivosConDato.length,
          proporcion_referencia: round(conCompetencia),
        },
        entradas: { numero_postores: 1, metodo: p.metodo },
        calidad: esc.notaCalidad === i ? ["Se corrigió un postor duplicado en este proceso."] : [],
      }),
    );
  }

  // S02 · plazo corto.
  for (const i of esc.plazoCorto) {
    const p = porIndice(i);
    const plazo = metaPorOcid.get(p.ocid).plazo;
    senales.push(
      senal({
        id: `S02-${p.ocid}`,
        codigo: "S02",
        objeto: { tipo: "proceso", id: p.ocid },
        ocids: [p.ocid],
        valor: plazo,
        unidad: "días",
        umbral: { operador: "menor_que", valor: p10, descripcion: "percentil 10 del plazo de presentación de procesos competitivos comparables" },
        comparacion: {
          descripcion: "Procesos competitivos de la región (2025–2026)",
          ambito: "region",
          n: plazosCompetitivos.length,
          q1: round(quantile(plazosCompetitivos, 0.25), 1),
          mediana: round(quantile(plazosCompetitivos, 0.5), 1),
          q3: round(quantile(plazosCompetitivos, 0.75), 1),
          valla_superior: null,
          percentil_del_caso: percentilDelCaso(plazosCompetitivos, plazo),
          proporcion_referencia: null,
        },
        entradas: { dias: plazo, inicio: p.fechas.inicio_presentacion, fin: p.fechas.fin_presentacion, metodo: p.metodo },
      }),
    );
  }

  // S03 · proveedor recurrente atípico.
  if (esc.concentrado) {
    const victorias = new Map();
    for (const p of procesos) for (const g of p.ganadores) victorias.set(g, (victorias.get(g) ?? 0) + 1);
    const participaciones = [...victorias.values()].map((v) => v / procesos.length).sort((a, b) => a - b);
    const q1 = quantile(participaciones, 0.25);
    const q3 = quantile(participaciones, 0.75);
    const valla = q3 + 1.5 * (q3 - q1);
    const procesosGanados = esc.concentrado.procesos.map(porIndice);
    const ganados = procesosGanados.map((p) => p.ocid);
    const valor = ganados.length / procesos.length;
    if (!(valor > valla)) throw new Error("El escenario de S03 no supera la valla superior.");
    const montoProveedor = procesosGanados.reduce((total, p) => total + p.monto_adjudicado, 0);
    const montoEntidad = procesos.reduce((total, p) => total + p.monto_adjudicado, 0);
    const convocatorias = procesos.map((p) => p.fechas.convocatoria).sort();
    senales.push(
      senal({
        id: `S03-${esc.concentrado.proveedor}-${entidad.id}`,
        codigo: "S03",
        objeto: { tipo: "proveedor", id: esc.concentrado.proveedor },
        ocids: ganados,
        valor: round(valor),
        unidad: "participación en los procesos adjudicados",
        umbral: {
          operador: "mayor_que",
          valor: round(valla),
          descripcion: "valla superior de Tukey (Q3 + 1,5 × RIC) de la participación de los proveedores de la entidad",
        },
        comparacion: {
          descripcion: "Proveedores con adjudicaciones en la entidad durante el periodo",
          ambito: "region",
          n: participaciones.length,
          q1: round(q1),
          mediana: round(quantile(participaciones, 0.5)),
          q3: round(q3),
          valla_superior: round(valla),
          percentil_del_caso: percentilDelCaso(participaciones, valor),
          proporcion_referencia: null,
        },
        entradas: {
          proveedor_id: esc.concentrado.proveedor,
          procesos_ganados: ganados.length,
          procesos_entidad: procesos.length,
          monto_proveedor_pen: round(montoProveedor, 2),
          monto_entidad_pen: round(montoEntidad, 2),
          participacion_procesos: round(valor),
          participacion_monto: round(montoProveedor / montoEntidad),
          medida: "procesos",
          ventana_inicio: convocatorias[0],
          ventana_fin: convocatorias.at(-1),
        },
      }),
    );
  }

  // S04 · compras similares cercanas en el tiempo.
  if (esc.fraccionamiento.length === 2) {
    const [a, b] = esc.fraccionamiento.map(porIndice);
    senales.push(
      senal({
        id: `S04-${entidad.id}-g01`,
        codigo: "S04",
        objeto: { tipo: "grupo", id: `${entidad.id}-g01` },
        ocids: [a.ocid, b.ocid],
        valor: a.monto_referencial + b.monto_referencial,
        unidad: "soles",
        umbral: { operador: "mayor_que", valor: 400000, descripcion: "umbral configurado del método superior (valor ficticio del fixture)" },
        entradas: {
          clase_item: "Mobiliario",
          metodo: a.metodo,
          categoria: a.objeto,
          anio: Number(a.fechas.convocatoria.slice(0, 4)),
          procesos: 2,
          suma_pen: a.monto_referencial + b.monto_referencial,
          umbral_pen: 400000,
          ventana_dias: 60,
          dias_entre_convocatorias: 20,
          norma: "Umbral ficticio del fixture; no es una cifra legal",
          fechas: [a.fechas.convocatoria, b.fechas.convocatoria],
          montos: [a.monto_referencial, b.monto_referencial],
        },
      }),
    );
  }

  // S05 · uso atípico de contratación directa (nivel entidad; no suma a la prioridad).
  const directas = procesos.filter((p) => p.metodo === "Contratación directa");
  if (directas.length / procesos.length > 0.305) {
    senales.push(
      senal({
        id: `S05-${entidad.id}`,
        codigo: "S05",
        objeto: { tipo: "entidad", id: entidad.id },
        ocids: directas.map((p) => p.ocid),
        valor: round(directas.length / procesos.length),
        unidad: "proporción de procesos por contratación directa",
        umbral: { operador: "mayor_que", valor: 0.305, descripcion: "valla superior de Tukey de entidades del mismo tipo (referencia ficticia del fixture)" },
        comparacion: {
          descripcion: "Entidades del mismo tipo (referencia ficticia del fixture)",
          ambito: "region",
          n: 12,
          q1: 0.08,
          mediana: 0.12,
          q3: 0.17,
          valla_superior: 0.305,
          percentil_del_caso: 100,
          proporcion_referencia: null,
        },
        entradas: {
          tipo_entidad: entidad.tipo,
          procesos_totales: procesos.length,
          procesos_directos: directas.length,
          monto_pen: round(procesos.reduce((total, p) => total + p.monto_adjudicado, 0), 2),
          monto_directo_pen: round(directas.reduce((total, p) => total + p.monto_adjudicado, 0), 2),
          proporcion_procesos: round(directas.length / procesos.length),
          proporcion_monto: round(
            directas.reduce((total, p) => total + p.monto_adjudicado, 0) /
              procesos.reduce((total, p) => total + p.monto_adjudicado, 0),
          ),
          medida: "procesos",
          metodos_directos: ["Contratación directa"],
        },
      }),
    );
  }

  // S06 · monto final mayor que el contratado.
  if (esc.sobrecosto) {
    const p = porIndice(esc.sobrecosto);
    senales.push(
      senal({
        id: `S06-${p.ocid}`,
        codigo: "S06",
        objeto: { tipo: "proceso", id: p.ocid },
        ocids: [p.ocid],
        valor: round(p.monto_final / p.monto_adjudicado, 2),
        unidad: "veces el monto contratado",
        umbral: { operador: "mayor_o_igual", valor: 1.15, descripcion: "monto final igual o mayor que el contratado más 15 %" },
        entradas: {
          contrato_id: `${p.ocid}-contrato-1`,
          monto_contratado: p.monto_adjudicado,
          monto_final: p.monto_final,
          moneda: p.moneda,
          cobertura_monto_final: COBERTURA_MONTO_FINAL,
        },
      }),
    );
  }

  // Expedientes simulados y S08.
  if (esc.expedienteSinSenal) {
    const p = porIndice(esc.expedienteSinSenal);
    expedientes.push({
      ocid: p.ocid,
      simulado: true,
      etapas: [
        { etapa: "requerimiento", responsable: "Área usuaria · Persona B", fecha: addDays(p.fechas.convocatoria, -15), documento: "Requerimiento N.° 004-2025" },
        { etapa: "evaluacion", responsable: "Comité de selección · Persona D", fecha: p.fechas.adjudicacion, documento: "Acta de evaluación" },
        { etapa: "conformidad", responsable: "Área usuaria · Persona B", fecha: addDays(p.fechas.contrato, 30), documento: "Acta de conformidad N.° 004" },
        { etapa: "pago", responsable: "Tesorería · Persona C", fecha: addDays(p.fechas.contrato, 34), documento: "Comprobante de pago N.° 0118" },
      ],
    });
  }
  if (esc.expedienteConSenal) {
    const p = porIndice(esc.expedienteConSenal);
    expedientes.push({
      ocid: p.ocid,
      simulado: true,
      etapas: [
        { etapa: "requerimiento", responsable: "Área usuaria · Persona A", fecha: addDays(p.fechas.convocatoria, -20), documento: "Requerimiento N.° 015-2025" },
        { etapa: "evaluacion", responsable: "Comité de selección · Persona A", fecha: p.fechas.adjudicacion, documento: "Acta de evaluación" },
        { etapa: "conformidad", responsable: "Área usuaria · Persona A", fecha: addDays(p.fechas.contrato, 30), documento: null },
        { etapa: "pago", responsable: "Tesorería · Persona C", fecha: addDays(p.fechas.contrato, 33), documento: "Comprobante de pago N.° 0231" },
      ],
    });
    senales.push(
      senal({
        id: `S08-${p.ocid}`,
        codigo: "S08",
        objeto: { tipo: "expediente", id: p.ocid },
        ocids: [p.ocid],
        // Igual que el pipeline: valor = condiciones que se cumplen (misma persona y pago sin conformidad documentada).
        valor: 2,
        unidad: "condiciones",
        umbral: {
          operador: "mayor_o_igual",
          valor: 1,
          descripcion: "misma persona en requerimiento, evaluación y conformidad, o pago sin conformidad documentada",
        },
        entradas: { misma_persona: true, persona: "Persona A", pago_sin_conformidad_documentada: true },
        simulado: true,
      }),
    );
  }

  senalesPorEntidad.set(entidad.id, senales);

  // Señales y prioridad de cada proceso (S05 es de nivel entidad y no suma).
  for (const p of procesos) {
    const propias = senales
      .filter((s) => s.codigo !== "S05" && s.ocids.includes(p.ocid))
      .sort((a, b) => ORDEN.indexOf(a.codigo) - ORDEN.indexOf(b.codigo));
    p.senales = propias.map((s) => s.id);
    if (propias.length > 0) {
      const desglose = propias
        .map((s) => ({ codigo: s.codigo, peso: PESOS[s.codigo] }))
        .sort((a, b) => b.peso - a.peso || ORDEN.indexOf(a.codigo) - ORDEN.indexOf(b.codigo));
      const puntaje = desglose.reduce((total, d) => total + d.peso, 0);
      p.prioridad = { puntaje, nivel: puntaje >= CORTES.alta ? "alta" : puntaje >= CORTES.media ? "media" : "baja", desglose };
    }
  }
}

// --- Entidades, índice y manifiesto ---------------------------------------------------

const entidades = ENTIDADES.map((entidad) => {
  const procesos = procesosPorEntidad.get(entidad.id);
  const senales = senalesPorEntidad.get(entidad.id);

  const porCategoria = {};
  for (const s of senales) porCategoria[s.categoria] = (porCategoria[s.categoria] ?? 0) + 1;

  const porMes = new Map();
  for (const p of procesos) {
    const mes = p.fechas.convocatoria.slice(0, 7);
    const actual = porMes.get(mes) ?? { mes, procesos: 0, con_senales: 0 };
    actual.procesos += 1;
    if (p.prioridad) actual.con_senales += 1;
    porMes.set(mes, actual);
  }

  const victorias = new Map();
  for (const p of procesos) for (const g of p.ganadores) victorias.set(g, (victorias.get(g) ?? 0) + 1);
  const top = [...victorias.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([proveedor_id, adjudicaciones]) => ({ proveedor_id, participacion: round(adjudicaciones / procesos.length), adjudicaciones }));

  return {
    id: entidad.id,
    nombre: entidad.nombre,
    tipo: entidad.tipo,
    resumen: {
      procesos: procesos.length,
      monto_total: round(procesos.reduce((total, p) => total + (p.monto_adjudicado ?? 0), 0), 2),
      procesos_con_senales: procesos.filter((p) => p.prioridad).length,
      por_categoria: porCategoria,
      tendencia_mensual: [...porMes.values()].sort((a, b) => a.mes.localeCompare(b.mes)),
      top_proveedores: top,
    },
    senales_entidad: senales.filter((s) => s.nivel === "entidad").map((s) => s.id),
  };
});

const indice = { procesos: {}, proveedores: {} };
for (const proveedor of PROVEEDORES) indice.proveedores[proveedor.id] = [];
for (const [entidadId, procesos] of procesosPorEntidad) {
  for (const p of procesos) {
    indice.procesos[p.ocid] = entidadId;
    for (const g of p.ganadores) if (!indice.proveedores[g].includes(entidadId)) indice.proveedores[g].push(entidadId);
  }
}

const todasLasSenales = [...senalesPorEntidad.values()].flat();
const manifest = {
  version_contrato: "1.0",
  version_reglas: "fixture-1",
  generado: "2026-11-13T12:00:00-05:00",
  fecha_corte: FECHA_CORTE,
  fuente: {
    nombre: "Fixture sintético con datos ficticios (no proviene del OECE)",
    url: "https://data.open-contracting.org/en/publication/135",
    archivos: [],
  },
  licencia: "CC BY 4.0",
  atribucion: "Datos ficticios generados para pruebas; no corresponden a procesos ni a proveedores reales.",
  region: "LA LIBERTAD",
  anios: [2025, 2026],
  modo: "publico",
  conteos: {
    procesos: [...procesosPorEntidad.values()].reduce((total, lista) => total + lista.length, 0),
    senales: todasLasSenales.length,
    proveedores: PROVEEDORES.length,
    entidades: entidades.length,
  },
  exclusiones: [{ motivo: "S01: sin dato de postores", cantidad: ENTIDADES.reduce((t, e) => t + e.escenario.sinPostores.length, 0) }],
  correcciones: [{ tipo: "postor duplicado", cantidad: 1 }],
  senales_activas: ["S01", "S02", "S03", "S04", "S05", "S06", "S08"],
  senales_desactivadas: [{ codigo: "S07", motivo: "falta una fuente abierta de proveedores sancionados" }],
  prioridad: { pesos: PESOS, cortes: CORTES },
};

// --- Escritura ----------------------------------------------------------------------

async function escribir(relativo, datos) {
  const destino = path.join(OUT_DIR, relativo);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, `${JSON.stringify(datos, null, 2)}\n`, "utf8");
}

await rm(OUT_DIR, { recursive: true, force: true });
await escribir("manifest.json", manifest);
await escribir("entidades.json", entidades);
for (const [entidadId, procesos] of procesosPorEntidad) await escribir(`procesos/${entidadId}.json`, procesos);
for (const [entidadId, senales] of senalesPorEntidad) await escribir(`senales/${entidadId}.json`, senales);
await escribir("proveedores.json", PROVEEDORES);
await escribir("expedientes-simulados.json", expedientes);
await escribir("indice.json", indice);

console.log(
  `Fixture generado en ${path.relative(process.cwd(), OUT_DIR)}: ${manifest.conteos.procesos} procesos, ` +
    `${manifest.conteos.senales} señales, ${expedientes.length} expedientes simulados.`,
);
