import type { ReviewStore } from "./review-store";
import type { AssignmentEntry, DecisionEntry, ImportResult, ReviewSnapshot } from "./types";

export const EMPTY_REVIEW_SNAPSHOT: ReviewSnapshot = Object.freeze({
  entries: Object.freeze([]), persistence: "memory", warning: null,
});

function unavailable(): never {
  throw new Error("El registro de revisiones todavía no está habilitado.");
}

/** Permite integrar lecturas antes de conectar el almacenamiento de la demo. */
export class EmptyReviewStore implements ReviewStore {
  listReviews() { return EMPTY_REVIEW_SNAPSHOT.entries; }
  getState() { return "sin_revisar" as const; }
  listAssignedTo(): readonly AssignmentEntry[] { return []; }
  listAssignedBy(): readonly AssignmentEntry[] { return []; }
  listDecided(): readonly DecisionEntry[] { return []; }
  getSnapshot() { return EMPTY_REVIEW_SNAPSHOT; }
  getServerSnapshot() { return EMPTY_REVIEW_SNAPSHOT; }
  subscribe() { return () => {}; }
  syncFromStorage() {}
  exportReviews() { return JSON.stringify({ version: 1, entradas: [] }); }
  saveDecision(): DecisionEntry { return unavailable(); }
  assign(): AssignmentEntry { return unavailable(); }
  importReviews(): ImportResult { return unavailable(); }
  resetDemo(): void { unavailable(); }
}
