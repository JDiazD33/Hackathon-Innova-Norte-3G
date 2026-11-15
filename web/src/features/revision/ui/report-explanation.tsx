import type { Proceso, Manifest, Senal } from "@/lib/data/types";

import { explainSignal } from "@/features/explicacion";
import { SimulatedDataBadge } from "@/features/etica";
import { SIGNAL_METHODOLOGY } from "@/features/etica/metodologia";

/** Vista de reporte independiente: usa las plantillas que ya existen en main.
 * La sustitución por SignalCard variant="print" espera la integración del Lote C (D 5.1).
 */
export function ReportExplanation({
  signal,
  manifest,
  process,
}: {
  signal: Senal;
  manifest: Manifest;
  process: Proceso;
}) {
  const explanation = explainSignal(signal, { manifest, process });
  if (!explanation) return null;
  const blocks = [
    { title: "Qué encontramos", body: <p>{explanation.finding}</p> },
    { title: "Con qué lo comparamos", body: <p>{explanation.comparison}</p> },
    { title: "Por qué importa", body: <p>{explanation.importance}</p> },
    {
      title: "Qué revisar",
      body: (
        <ul className="list-disc space-y-2 pl-5">
          {explanation.review.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ),
    },
    { title: "Qué no significa", body: <p>{explanation.limitation}</p> },
    {
      title: "Datos usados",
      body: (
        <ul className="list-disc space-y-2 pl-5">
          {explanation.dataUsed.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ),
    },
  ];
  const reference =
    [
      signal.referencia.cardinal && `Cardinal ${signal.referencia.cardinal}`,
      signal.referencia.ocp,
    ]
      .filter(Boolean)
      .join(" · ") || SIGNAL_METHODOLOGY[signal.codigo].reference;
  return (
    <section className="space-y-4 border-t border-separador pt-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-titulo-3">
          {signal.codigo} · {SIGNAL_METHODOLOGY[signal.codigo].name}
        </h3>
        {(signal.simulado || signal.codigo === "S08") && <SimulatedDataBadge />}
      </div>
      {blocks.map((block) => (
        <section key={block.title} className="space-y-2">
          <h4 className="text-encabezado">{block.title}</h4>
          <div className="text-subtitulo">{block.body}</div>
        </section>
      ))}
      {reference && <p className="text-nota">Referencia: {reference}</p>}
      {signal.calidad.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-encabezado">Calidad de datos</h4>
          <ul className="list-disc space-y-2 pl-5 text-subtitulo">
            {signal.calidad.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
