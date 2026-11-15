import type { Manifest, Proveedor } from "@/lib/data/types";

export interface SupplierIdentity {
  displayName: string;
  taxId: string | null;
  profileUrl: string | null;
  /** `true` cuando solo se muestra el seudónimo para proteger la identidad. */
  pseudonymized: boolean;
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

/**
 * Proyecta solo campos visibles; nunca devuelve el objeto original con su identidad.
 * Solo una persona jurídica en modo local muestra nombre, RUC y enlace. Una persona natural, un RUC 10
 * o un tipo desconocido quedan con el seudónimo: el RUC 10 contiene el DNI y la Ficha Única muestra
 * el nombre, así que exponer cualquiera de los dos revelaría a la persona.
 */
export function getSupplierIdentity(supplier: Proveedor, mode: Manifest["modo"]): SupplierIdentity {
  const pseudonym: SupplierIdentity = { displayName: supplier.alias, taxId: null, profileUrl: null, pseudonymized: true };
  if (mode !== "local") return pseudonym;
  const isLegalEntity = supplier.tipo === "persona_juridica" && !supplier.ruc?.startsWith("10");
  if (!isLegalEntity) return pseudonym;
  return {
    displayName: supplier.nombre?.trim() || supplier.alias,
    taxId: supplier.ruc,
    profileUrl: profileLink(supplier.url_ficha_unica),
    pseudonymized: false,
  };
}
