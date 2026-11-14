import Link from "next/link";

/** Pie con la atribución de los datos (CC BY 4.0) y la versión de las reglas. */
export function Pie({ atribucion, versionReglas }: { atribucion: string; versionReglas: string }) {
  return (
    <footer className="border-t px-4 py-4 text-xs text-muted-foreground md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-1">
        <p>{atribucion}</p>
        <p>
          Reglas {versionReglas} ·{" "}
          <Link href="/metodologia" className="underline underline-offset-2 hover:text-foreground">
            Metodología, fuentes y licencias
          </Link>
        </p>
      </div>
    </footer>
  );
}
