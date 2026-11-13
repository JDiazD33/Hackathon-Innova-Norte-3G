import type { CategoriaSenal, CodigoSenal, Manifest } from "@/lib/data/types";

/** Redacción propia a partir de docs/datos/catalogo-de-senales.md (catálogo v1). */
export const SIGNAL_METHODOLOGY = {
  S01: { name: "Oferta única", category: "competencia", rule: "Procedimiento competitivo con exactamente un postor; se excluye la contratación directa.", reference: "Cardinal R018 · guía de OCP", simulated: false },
  S02: { name: "Plazo corto para presentar ofertas", category: "tiempos", rule: "Duración en días calendario inferior al percentil configurado del grupo de comparación (valor inicial del catálogo: 10).", reference: "Cardinal R003 · guía de OCP", simulated: false },
  S03: { name: "Proveedor recurrente atípico en una entidad", category: "concentracion", rule: "Participación del proveedor superior al límite de comparación en una ventana de 12 meses y al menos tres adjudicaciones, según los parámetros del catálogo v1.", reference: "Guía de OCP · concentración en Arachne", simulated: false },
  S04: { name: "Compras similares cercanas en el tiempo", category: "fraccionamiento", rule: "Dos o más procesos de la misma entidad y clase de ítem, dentro de la ventana configurada (inicial: 60 días), cuya suma supera el umbral del método superior.", reference: "Guía de OCP · trazabilidad de las compras", simulated: false },
  S05: { name: "Uso atípico de contratación directa", category: "competencia", rule: "Proporción de contratación directa superior al límite de comparación de entidades del mismo tipo. Se presenta a nivel de entidad y no suma a la prioridad del proceso.", reference: "Guía de OCP", simulated: false },
  S06: { name: "Monto final mayor que el contratado", category: "ejecucion", rule: "Monto final igual o superior al monto contratado multiplicado por el factor configurado (inicial: 1,15). Solo se calcula cuando existen los montos necesarios.", reference: "Guía de OCP", simulated: false },
  S07: { name: "Proveedor con sanción vigente adjudicado", category: "reputacional", rule: "Señal prevista para una fase posterior; requiere una fuente abierta y la comprobación de la vigencia en la fecha de adjudicación.", reference: "Categoría reputacional de Arachne", simulated: false },
  S08: { name: "Sustento y separación de funciones del expediente", category: "trazabilidad", rule: "Ejemplo sintético de etapas a cargo de una misma persona, conformidad sin documento o pago sin conformidad registrada. Los datos abiertos no contienen este expediente interno.", reference: "Trazabilidad interna del caso de demostración", simulated: true },
} satisfies Record<CodigoSenal, { name: string; category: CategoriaSenal; rule: string; reference: string; simulated: boolean }>;

/** Referentes y forma de uso según docs/producto/referentes-internacionales.md. */
export const METHODOLOGY_REFERENCES = [
  { name: "Cardinal", url: "https://github.com/open-contracting/cardinal-rs", license: "MIT", use: "Dependencia prevista del pipeline y contraste de indicadores; su disponibilidad para estos datos se confirma en el trabajo de datos." },
  { name: "Guía de banderas rojas de OCP", url: "https://www.open-contracting.org/resources/red-flags-in-public-procurement-a-guide-to-using-data-to-detect-and-mitigate-risks/", license: "CC BY 4.0 en el sitio de OCP; pendiente confirmar la licencia específica del PDF", use: "Definiciones metodológicas, adaptadas con código y textos propios." },
  { name: "Arachne", url: "https://antifraud-knowledge-centre.ec.europa.eu/useful-tools/what-arachne_en", license: "Software propietario", use: "Inspiración para categorías, prioridad y confirmación humana. No se usa su código ni sus bases externas." },
  { name: "Serenata de Amor", url: "https://github.com/okfn-brasil/serenata-de-amor", license: "MIT", use: "Lección de diseño: señalar casos para que una persona los verifique, sin decidir por ella." },
] as const;

export const SOFTWARE_ACKNOWLEDGEMENTS = [
  { name: "Next.js", license: "MIT", use: "Aplicación web" },
  { name: "React", license: "MIT", use: "Interfaz web" },
  { name: "Tailwind CSS", license: "MIT", use: "Estilos de la web" },
  { name: "TypeScript", license: "Apache-2.0", use: "Tipos del código web" },
  { name: "Python", license: "PSF-2.0", use: "Pipeline previsto, todavía por implementar" },
  { name: "DuckDB", license: "MIT", use: "Consultas del pipeline previsto" },
  { name: "uv", license: "MIT o Apache-2.0", use: "Gestión del entorno del pipeline previsto" },
] as const;

export const METHODOLOGY_LIMITS = [
  "Una señal no prueba corrupción.",
  "La prioridad de revisión no es una probabilidad de corrupción.",
  "Los parámetros iniciales del catálogo son configurables. Cada explicación debe mostrar el umbral y las entradas usados por la versión de la regla del paquete.",
  "Los grupos comparables usan método, año y, cuando hay cobertura, tipo de objeto. Si el grupo tiene menos de 30 casos, el catálogo prevé ampliar la referencia al ámbito nacional e indicarlo.",
  "Los datos abiertos no incluyen compras sin procedimiento de selección, incluidas las menores a 8 UIT; esto limita el análisis de compras similares.",
  "La fuente no publica pagos, hitos ni modificaciones contractuales. El monto final permite una comparación cuando existe, pero no reconstruye todos los cambios del contrato.",
  "Las etapas internas, sus responsables y los pagos de S08 son datos simulados y deben identificarse como tales.",
  "Los datos ausentes no se inventan. Los procesos excluidos y las correcciones se informan en el manifiesto y en la explicación correspondiente.",
  "En el enlace público se muestran seudónimos de proveedores. Las personas naturales nunca muestran su nombre.",
  "Los roles son simulados. Las decisiones y asignaciones las registra una persona; el sistema no decide automáticamente. El rojo se reserva para requiere atención.",
  "Las revisiones se guardan en el navegador y no se comparten automáticamente entre dispositivos. El historial agrega entradas; solo el reinicio confirmado borra la demostración.",
  "La aplicación no incorpora analítica ni perfiles personales de quienes la usan. No incluyas datos personales en comentarios o notas.",
] as const;

/** Fuente, señales activas, pesos y cortes proceden siempre del manifiesto recibido. */
export function buildMethodology(manifest: Manifest) {
  return {
    title: "Metodología y límites",
    signals: manifest.senales_activas.map((code) => ({ code, ...SIGNAL_METHODOLOGY[code] })),
    disabledSignals: manifest.senales_desactivadas.map((signal) => ({ ...signal })),
    priority: {
      formula: "Puntaje del proceso = suma de los pesos de sus señales. El nivel se toma del paquete y la web no lo recalcula.",
      weights: { ...manifest.prioridad.pesos },
      cutoffs: { ...manifest.prioridad.cortes },
      note: "S05 es una señal de entidad y no suma a la prioridad del proceso.",
    },
    source: {
      name: manifest.fuente.nombre, url: manifest.fuente.url, license: manifest.licencia,
      attribution: manifest.atribucion, cutoffDate: manifest.fecha_corte, generatedAt: manifest.generado,
      ruleVersion: manifest.version_reglas, contractVersion: manifest.version_contrato,
      region: manifest.region, years: [...manifest.anios], mode: manifest.modo,
      exclusions: manifest.exclusiones.map((item) => ({ ...item })),
      corrections: manifest.correcciones.map((item) => ({ ...item })),
    },
    references: METHODOLOGY_REFERENCES,
    software: SOFTWARE_ACKNOWLEDGEMENTS,
    limits: METHODOLOGY_LIMITS,
  };
}
