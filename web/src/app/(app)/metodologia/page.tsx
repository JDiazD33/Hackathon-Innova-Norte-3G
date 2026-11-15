import type { Metadata } from "next";

import { MethodologyView } from "@/features/etica/ui/methodology-view";
import { cargarManifest } from "@/lib/data/cached";

export const metadata: Metadata = { title: "Metodología" };

export default async function MethodologyPage() {
  return <MethodologyView manifest={await cargarManifest()} />;
}
