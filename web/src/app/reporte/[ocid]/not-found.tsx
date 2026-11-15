import Link from "next/link";

import { SinDatos } from "@/components/estado/sin-datos";
import { Button } from "@/components/ui/button";

export default function ReportNotFound() {
  return (
    <div className="mx-auto max-w-lectura p-6">
      <SinDatos
        titulo="No encontramos este proceso"
        mensaje="Comprueba el enlace antes de generar el reporte."
        accion={
          <Button asChild variant="tinted">
            <Link href="/senales">Volver a señales</Link>
          </Button>
        }
      />
    </div>
  );
}
