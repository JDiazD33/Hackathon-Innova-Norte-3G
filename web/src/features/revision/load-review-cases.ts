import "server-only";

import { cacheLife } from "next/cache";

import { getDataSource } from "@/lib/data";

import { toReviewCases } from "./review-cases";

export async function loadReviewCases(entityId: string) {
  "use cache";
  cacheLife("max");
  const source = getDataSource();
  return toReviewCases(await source.listProcesses(entityId));
}
