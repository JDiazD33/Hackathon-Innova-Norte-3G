import Link from "next/link";

/** Pie con la atribución de los datos (CC BY 4.0) y la versión de las reglas. */
export function Pie({ atribucion, versionReglas }: { atribucion: string; versionReglas: string }) {
  return (
    <footer className="px-4 pt-2 pb-6 text-leyenda text-muted-foreground md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-contenido flex-col gap-1 border-t border-separador pt-4">
        <p>{atribucion}</p>
        <p>
          Reglas {versionReglas} ·{" "}
          <Link href="/metodologia" className="font-medium text-primary underline-offset-2 hover:underline">
            Metodología, fuentes y licencias
          </Link>
        </p>
      </div>
    </footer>
  );
}
