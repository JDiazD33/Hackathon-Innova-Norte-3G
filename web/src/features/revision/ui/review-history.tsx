"use client";

import { EstadoRevisionBadge } from "@/components/estado/estado-revision-badge";
import { useRevisiones } from "@/lib/revisiones";
import { Check, Circle, Clock3, Flag } from "lucide-react";

import { formatReviewDate } from "../format-date";
import { chronologicalEntries, getReviewState } from "../selectors";
import {
  ROLE_LABELS,
  STATE_LABELS,
  type ReviewEntry,
  type ReviewState,
} from "../types";

const STATE_ICONS = {
  sin_revisar: Circle,
  en_revision: Clock3,
  justificada: Check,
  requiere_atencion: Flag,
};

export function ReviewHistory({
  ocid,
  entries,
  print = false,
}: {
  ocid: string;
  entries?: readonly ReviewEntry[];
  print?: boolean;
}) {
  const { snapshot } = useRevisiones();
  const history = chronologicalEntries(entries ?? snapshot.entries)
    .filter((entry) => entry.ocid === ocid)
    .reverse();
  function stateLabel(state: ReviewState) {
    const Icon = STATE_ICONS[state];
    return print ? (
      <span className="inline-flex items-center gap-2 text-subtitulo">
        <Icon aria-hidden="true" className="size-4" />
        {STATE_LABELS[state]}
      </span>
    ) : (
      <EstadoRevisionBadge estado={state} />
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-subtitulo">Estado vigente</span>
        {stateLabel(getReviewState(entries ?? snapshot.entries, ocid))}
      </div>
      {!print && (
        <p className="text-nota text-muted-foreground">
          Las revisiones se guardan en este navegador. El historial muestra
          primero lo más reciente.
        </p>
      )}
      {!entries && snapshot.warning && (
        <p role="status" className="text-subtitulo">
          {snapshot.warning}
        </p>
      )}
      {history.length === 0 ? (
        <p className="text-subtitulo text-muted-foreground">
          Aún no hay revisiones registradas para este proceso.
        </p>
      ) : (
        <ol className="divide-y divide-separador">
          {history.map((entry) => (
            <li key={entry.id} className="space-y-2 py-4">
              <p className="text-nota text-muted-foreground">
                <time dateTime={entry.fecha}>
                  {formatReviewDate(entry.fecha)}
                </time>{" "}
                · {ROLE_LABELS[entry.rol]}
              </p>
              {entry.tipo === "decision" ? (
                <>
                  {stateLabel(entry.estado)}
                  <p className="whitespace-pre-wrap break-words text-subtitulo">
                    {entry.comentario || "Sin comentario adicional."}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-subtitulo font-medium">
                    Asignado a {ROLE_LABELS[entry.asignado_a]}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-subtitulo">
                    {entry.nota}
                  </p>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
