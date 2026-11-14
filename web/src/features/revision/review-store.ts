import type {
  AssignmentEntry, AssignmentInput, DecisionEntry, DecisionInput, ImportResult,
  ReviewEntry, ReviewRole, ReviewSnapshot, ReviewState,
} from "./types";

/** Contrato compartido por bandeja (B), fichas (C) y revisión (D). */
export interface ReviewStore {
  listReviews(ocid?: string): readonly ReviewEntry[];
  getState(ocid: string): ReviewState;
  saveDecision(input: DecisionInput): DecisionEntry;
  assign(input: AssignmentInput): AssignmentEntry;
  listAssignedTo(role: ReviewRole): readonly AssignmentEntry[];
  listAssignedBy(role: ReviewRole): readonly AssignmentEntry[];
  listDecided(): readonly DecisionEntry[];
  exportReviews(): string;
  importReviews(json: string, role: ReviewRole): ImportResult;
  resetDemo(role: ReviewRole, confirmed: boolean): void;
  /** Referencia estable entre cambios, apta para useSyncExternalStore. */
  getSnapshot(): ReviewSnapshot;
  getServerSnapshot(): ReviewSnapshot;
  subscribe(listener: () => void): () => void;
  /** La futura UI puede invocarlo al recibir un evento storage de otra pestaña. */
  syncFromStorage(): void;
}
