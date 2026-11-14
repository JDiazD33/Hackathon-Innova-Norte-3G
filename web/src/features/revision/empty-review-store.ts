import type { ReviewStore } from "./review-store";
import type { ReviewSnapshot } from "./types";

export const EMPTY_REVIEW_SNAPSHOT: ReviewSnapshot = Object.freeze({
  entries: Object.freeze([]), persistence: "memory", warning: null,
});

function unavailable(): never {
  throw new Error("El registro de revisiones todavía no está habilitado.");
}

/** Permite integrar lecturas antes de conectar el almacenamiento de la demo. */
export class EmptyReviewStore implements ReviewStore {
  listReviews: ReviewStore["listReviews"] = () => EMPTY_REVIEW_SNAPSHOT.entries;
  getState: ReviewStore["getState"] = () => "sin_revisar";
  listAssignedTo: ReviewStore["listAssignedTo"] = () => [];
  listAssignedBy: ReviewStore["listAssignedBy"] = () => [];
  listDecided: ReviewStore["listDecided"] = () => [];
  getSnapshot() { return EMPTY_REVIEW_SNAPSHOT; }
  getServerSnapshot() { return EMPTY_REVIEW_SNAPSHOT; }
  subscribe: ReviewStore["subscribe"] = () => () => {};
  syncFromStorage() {}
  exportReviews() { return JSON.stringify({ version: 1, entradas: [] }); }
  saveDecision: ReviewStore["saveDecision"] = unavailable;
  assign: ReviewStore["assign"] = unavailable;
  importReviews: ReviewStore["importReviews"] = unavailable;
  resetDemo: ReviewStore["resetDemo"] = unavailable;
}
