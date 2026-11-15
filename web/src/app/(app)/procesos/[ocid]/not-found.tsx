import Link from "next/link";

import { SinDatos } from "@/components/estado/sin-datos";
import { Button } from "@/components/ui/button";

export default function ProcessNotFound() {
  return (
    <SinDatos
      titulo="No encontramos este proceso"
      mensaje="Comprueba el enlace o vuelve a la bandeja para consultar otro proceso."
      accion={
        <Button asChild variant="tinted">
          <Link href="/senales">Volver a señales</Link>
        </Button>
      }
    />
  );
}
