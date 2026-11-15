"use client";

import { EstadoRevisionBadge } from "@/components/estado/estado-revision-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/features/revision";
import { formatFecha } from "@/lib/format";
import { useRevisiones } from "@/lib/revisiones";

/** Solo lee el almacén común. El diálogo y el selector de rol están pendientes del Lote D. */
export function ProcessHistory({ ocid }: { ocid: string }) {
  const { snapshot, estadoDe } = useRevisiones();
  const entries = snapshot.entries.filter((entry) => entry.ocid === ocid);
  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>
          <h2>Historial de revisión</h2>
        </CardTitle>
        <div>
          <EstadoRevisionBadge estado={estadoDe(ocid)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-subtitulo">
        <p className="text-muted-foreground">
          Las revisiones se guardan en este navegador.
        </p>
        {snapshot.warning && <p role="status">{snapshot.warning}</p>}
        {entries.length === 0 ? (
          <p>Aún no hay revisiones registradas para este proceso.</p>
        ) : (
          <ol className="divide-y divide-separador">
            {entries.map((entry) => (
              <li key={entry.id} className="space-y-2 py-4">
                <p className="text-nota text-muted-foreground">
                  {formatFecha(entry.fecha)} · {ROLE_LABELS[entry.rol]}
                </p>
                {entry.tipo === "decision" ? (
                  <>
                    <EstadoRevisionBadge estado={entry.estado} />
                    <p className="whitespace-pre-wrap break-words">
                      {entry.comentario}
                    </p>
                  </>
                ) : (
                  <>
                    <p>Asignado a {ROLE_LABELS[entry.asignado_a]}</p>
                    <p className="whitespace-pre-wrap break-words">
                      {entry.nota}
                    </p>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
