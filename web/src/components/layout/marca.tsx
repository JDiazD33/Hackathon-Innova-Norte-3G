import { ScanSearch } from "lucide-react";
import Link from "next/link";

import { producto } from "@/config/producto";

export function Marca() {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-lg px-1">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <ScanSearch aria-hidden="true" className="size-5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">{producto.nombre}</span>
        <span className="text-xs text-muted-foreground">Señales para revisar compras públicas</span>
      </span>
    </Link>
  );
}
