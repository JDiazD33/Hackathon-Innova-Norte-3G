import type { CodigoSenal, Senal } from "@/lib/data/types";

import { explainS01 } from "./textos/s01";
import { explainS02 } from "./textos/s02";
import { explainS03 } from "./textos/s03";
import { explainS04 } from "./textos/s04";
import { explainS05 } from "./textos/s05";
import { explainS06 } from "./textos/s06";
import { explainS08 } from "./textos/s08";
import type { ExplanationContext, SignalExplanation } from "./types";

export { describeComparison } from "./comparison";
export { describePriority } from "./priority";
export type { ExplanationContext, SignalExplanation } from "./types";

const TEMPLATES = {
  S01: explainS01, S02: explainS02, S03: explainS03, S04: explainS04,
  S05: explainS05, S06: explainS06, S08: explainS08,
} satisfies Partial<Record<CodigoSenal, (signal: Senal, context?: ExplanationContext) => SignalExplanation>>;

/** S07 está desactivada: no se inventa una explicación sin fuente ni regla. */
export function explainSignal(signal: Senal, context?: ExplanationContext): SignalExplanation | null {
  if (signal.codigo === "S07") return null;
  return TEMPLATES[signal.codigo](signal, context);
}
