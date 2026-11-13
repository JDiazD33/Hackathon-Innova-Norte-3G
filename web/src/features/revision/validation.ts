import { esIdSeguro } from "@/lib/data/types";

import { canReview } from "./permissions";
import { DECISION_STATES, REVIEW_ROLES, type AssignmentInput, type DecisionInput, type ReviewEntry, type ReviewRole } from "./types";

export class ReviewError extends Error {
  constructor(public readonly code: "validation" | "permission" | "invalid-import" | "conflict" | "confirmation-required", message: string) {
    super(message);
    this.name = "ReviewError";
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: Readonly<Record<string, string>>;
}

export function isRole(value: unknown): value is ReviewRole {
  return typeof value === "string" && (REVIEW_ROLES as readonly string[]).includes(value);
}

function validId(value: unknown): value is string {
  return typeof value === "string" && esIdSeguro(value);
}

export function validateDecision(input: DecisionInput): ValidationResult {
  const errors: Record<string, string> = {};
  if (!validId(input.ocid)) errors.ocid = "Elige un proceso válido para registrar la revisión.";
  if (!canReview(input.role, "decide")) errors.role = "Este rol no puede registrar decisiones.";
  if (!(DECISION_STATES as readonly string[]).includes(input.state)) errors.state = "Elige un estado de revisión válido.";
  if (input.comment != null && typeof input.comment !== "string") errors.comment = "El comentario debe ser un texto.";
  else if (!input.comment?.trim()) {
    if (input.state === "requiere_atencion") errors.comment = "Explica por qué requiere atención";
    if (input.state === "justificada") errors.comment = "Explica por qué la señal está justificada";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateAssignment(input: AssignmentInput): ValidationResult {
  const errors: Record<string, string> = {};
  if (!validId(input.ocid)) errors.ocid = "Elige un proceso válido para asignar.";
  if (!canReview(input.role, "assign")) errors.role = "Este rol no puede asignar casos.";
  if (!isRole(input.assignedTo) || input.assignedTo === input.role) errors.assignedTo = "Elige otro rol para la asignación.";
  if (typeof input.note !== "string" || !input.note.trim()) errors.note = "Añade una nota para el rol destinatario.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function assertValid(result: ValidationResult): void {
  if (!result.valid) throw new ReviewError(result.errors.role ? "permission" : "validation", Object.values(result.errors)[0]);
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidFile(): never {
  throw new ReviewError("invalid-import", "El archivo no contiene revisiones válidas de la versión 1.");
}

/** Valida todo el archivo antes de modificar el historial. Rechaza campos ajenos al contrato. */
export function parseReviewFile(json: string): readonly ReviewEntry[] {
  let file: unknown;
  try { file = JSON.parse(json); } catch { return invalidFile(); }
  if (!record(file) || file.version !== 1 || !Array.isArray(file.entradas) ||
    Object.keys(file).some((key) => key !== "version" && key !== "entradas")) return invalidFile();

  return file.entradas.map((value: unknown): ReviewEntry => {
    if (!record(value) || !validId(value.id) || !validId(value.ocid) || !isRole(value.rol) ||
      typeof value.fecha !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value.fecha) || !Number.isFinite(Date.parse(value.fecha))) return invalidFile();
    const base = { id: value.id, ocid: value.ocid, rol: value.rol, fecha: value.fecha };
    if (value.tipo === "decision") {
      const keys = ["id", "ocid", "rol", "fecha", "tipo", "estado", "comentario"];
      if (Object.keys(value).some((key) => !keys.includes(key)) ||
        typeof value.estado !== "string" || !(DECISION_STATES as readonly string[]).includes(value.estado) ||
        typeof value.comentario !== "string") return invalidFile();
      const state = value.estado as DecisionInput["state"];
      if (!validateDecision({ ocid: base.ocid, role: base.rol, state, comment: value.comentario }).valid) return invalidFile();
      return Object.freeze({ ...base, tipo: "decision", estado: state, comentario: value.comentario.trim() });
    }
    if (value.tipo === "asignacion") {
      const keys = ["id", "ocid", "rol", "fecha", "tipo", "asignado_a", "nota"];
      if (Object.keys(value).some((key) => !keys.includes(key)) || !isRole(value.asignado_a) || typeof value.nota !== "string" ||
        !validateAssignment({ ocid: base.ocid, role: base.rol, assignedTo: value.asignado_a, note: value.nota }).valid) return invalidFile();
      return Object.freeze({ ...base, tipo: "asignacion", asignado_a: value.asignado_a, nota: value.nota.trim() });
    }
    return invalidFile();
  });
}
