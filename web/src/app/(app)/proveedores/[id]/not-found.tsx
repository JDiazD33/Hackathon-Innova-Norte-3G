import Link from "next/link";

import { SinDatos } from "@/components/estado/sin-datos";
import { Button } from "@/components/ui/button";

export default function SupplierNotFound() {
  return (
    <SinDatos
      titulo="No encontramos este proveedor"
      mensaje="Comprueba el enlace o vuelve a la bandeja para continuar."
      accion={
        <Button asChild variant="tinted">
          <Link href="/senales">Volver a señales</Link>
        </Button>
      }
    />
  );
}
