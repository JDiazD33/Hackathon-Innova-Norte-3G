import "server-only";

import { cacheLife } from "next/cache";

import { getDataSource } from "@/lib/data";

import { loadProcessDetail } from "./process-detail";

export async function loadProcessPage(ocid: string) {
  "use cache";
  cacheLife("max");
  return loadProcessDetail(getDataSource(), ocid);
}
