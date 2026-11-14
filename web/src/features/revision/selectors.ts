import type { AssignmentEntry, DecisionEntry, ReviewEntry, ReviewRole, ReviewState } from "./types";

/** Orden estable en empates: una importación antigua no reemplaza una decisión posterior. */
export function chronologicalEntries(entries: readonly ReviewEntry[]): ReviewEntry[] {
  return [...entries].sort((a, b) => Date.parse(a.fecha) - Date.parse(b.fecha));
}

export function getReviewState(entries: readonly ReviewEntry[], ocid: string): ReviewState {
  const decisions = chronologicalEntries(entries).filter((entry) => entry.ocid === ocid && entry.tipo === "decision");
  const last = decisions.at(-1);
  return last?.tipo === "decision" ? last.estado : "sin_revisar";
}

export function currentAssignments(entries: readonly ReviewEntry[]): AssignmentEntry[] {
  const assignments = new Map<string, AssignmentEntry>();
  for (const entry of chronologicalEntries(entries)) {
    if (entry.tipo === "asignacion") assignments.set(entry.ocid, entry);
  }
  return [...assignments.values()];
}

export function assignedTo(entries: readonly ReviewEntry[], role: ReviewRole): AssignmentEntry[] {
  return currentAssignments(entries).filter((entry) => entry.asignado_a === role);
}

export function assignedBy(entries: readonly ReviewEntry[], role: ReviewRole): AssignmentEntry[] {
  return currentAssignments(entries).filter((entry) => entry.rol === role);
}

export function decidedCases(entries: readonly ReviewEntry[]): DecisionEntry[] {
  const decisions = new Map<string, DecisionEntry>();
  for (const entry of chronologicalEntries(entries)) {
    if (entry.tipo === "decision") decisions.set(entry.ocid, entry);
  }
  return [...decisions.values()].filter((entry) => entry.estado !== "en_revision");
}
