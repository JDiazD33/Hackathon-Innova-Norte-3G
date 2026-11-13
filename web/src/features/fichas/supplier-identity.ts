import type { Manifest, Proveedor } from "@/lib/data/types";

export interface SupplierIdentity {
  displayName: string;
  taxId: string | null;
  profileUrl: string | null;
}

function profileLink(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? value : null;
  } catch {
    return null;
  }
}

/** Proyecta solo campos visibles; nunca devuelve el objeto original con su identidad. */
export function getSupplierIdentity(supplier: Proveedor, mode: Manifest["modo"]): SupplierIdentity {
  if (mode !== "local") return { displayName: supplier.alias, taxId: null, profileUrl: null };
  const canShowName = supplier.tipo === "persona_juridica" && !supplier.ruc?.startsWith("10");
  return {
    displayName: canShowName && supplier.nombre?.trim() ? supplier.nombre.trim() : supplier.alias,
    taxId: supplier.ruc,
    profileUrl: profileLink(supplier.url_ficha_unica),
  };
}
