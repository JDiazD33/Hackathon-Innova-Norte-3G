import "server-only";

import { cacheLife } from "next/cache";

import { getDataSource } from "@/lib/data";

import { loadSupplierDetail } from "./supplier-detail";

export async function loadSupplierPage(supplierId: string, entityId: string) {
  "use cache";
  cacheLife("max");
  return loadSupplierDetail(getDataSource(), supplierId, entityId);
}
