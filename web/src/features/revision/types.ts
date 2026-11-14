export const REVIEW_ROLES = ["analista", "jefatura", "auditor"] as const;
export type ReviewRole = (typeof REVIEW_ROLES)[number];
export const DECISION_STATES = ["en_revision", "justificada", "requiere_atencion"] as const;
export type DecisionState = (typeof DECISION_STATES)[number];
export type ReviewState = "sin_revisar" | DecisionState;
export type ReviewAction = "read" | "decide" | "assign" | "export" | "import" | "reset";

export const ROLE_LABELS: Record<ReviewRole, string> = {
  analista: "Analista de integridad", jefatura: "Jefatura", auditor: "Auditor",
};
export const STATE_LABELS: Record<ReviewState, string> = {
  sin_revisar: "Sin revisar", en_revision: "En revisión",
  justificada: "Justificada", requiere_atencion: "Requiere atención",
};

interface EntryBase {
  readonly id: string;
  readonly ocid: string;
  readonly rol: ReviewRole;
  readonly fecha: string;
}
// Los campos persistidos siguen el contrato de eventos del design.md del lote D.
export interface DecisionEntry extends EntryBase {
  readonly tipo: "decision";
  readonly estado: DecisionState;
  readonly comentario: string;
}
export interface AssignmentEntry extends EntryBase {
  readonly tipo: "asignacion";
  readonly asignado_a: ReviewRole;
  readonly nota: string;
}
export type ReviewEntry = DecisionEntry | AssignmentEntry;

export interface DecisionInput {
  ocid: string;
  role: ReviewRole;
  state: DecisionState;
  comment?: string;
}
export interface AssignmentInput {
  ocid: string;
  role: ReviewRole;
  assignedTo: ReviewRole;
  note: string;
}
export interface ReviewFile {
  version: 1;
  entradas: readonly ReviewEntry[];
}
export interface ReviewSnapshot {
  readonly entries: readonly ReviewEntry[];
  readonly persistence: "local" | "memory";
  readonly warning: string | null;
}
export interface ImportResult {
  added: number;
  duplicates: number;
}
/** Se puede inyectar un almacenamiento en Node, sin window ni navegador. */
export interface ReviewStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
