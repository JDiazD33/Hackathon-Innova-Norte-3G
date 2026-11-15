import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { conEntidad } from "@/lib/entidad";

// Inspiración de gobierno, sin copiar código: Arachne, Comisión Europea.
// https://antifraud-knowledge-centre.ec.europa.eu/useful-tools/what-arachne_en
export function ReviewGuide({ entityId }: { entityId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle><h2>Cómo revisar un caso de integridad</h2></CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-subtitulo">
        <ol className="list-decimal space-y-3 pl-5">
          <li><strong>Prioriza.</strong> Abre la <Link className="text-primary underline underline-offset-4" href={conEntidad("/senales", entityId)}>bandeja de señales</Link> de esta entidad. La prioridad orienta el orden de revisión.</li>
          <li><strong>Contrasta.</strong> En la ficha, consulta la explicación, las limitaciones y los documentos oficiales. Distingue los datos públicos de las etapas marcadas como simuladas.</li>
          <li><strong>Registra.</strong> Usa En revisión mientras falta evidencia; Justificada si el sustento explica la señal; Requiere atención si corresponde continuar la revisión. Documenta la fuente consultada y el motivo.</li>
          <li><strong>Da seguimiento.</strong> Asigna a otro rol con una nota que indique qué falta contrastar. Cuando llegue nueva evidencia, registra otra decisión: las anteriores permanecen en el historial.</li>
          <li><strong>Deja trazabilidad.</strong> Consulta el historial y genera el reporte. El auditor puede leer y exportar, sin registrar decisiones ni asignaciones.</li>
        </ol>
        <p className="text-nota text-muted-foreground">Roles simulados y revisiones guardadas en este navegador. Una asignación no envía notificaciones ni comparte el caso con otra computadora. Requiere atención es una decisión de seguimiento, no una sanción.</p>
        <Link href={conEntidad("/metodologia", entityId)} className="text-primary underline underline-offset-4">Consultar metodología y límites</Link>
      </CardContent>
    </Card>
  );
}
