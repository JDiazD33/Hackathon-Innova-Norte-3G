import { REVIEW_ROLES, type ReviewAction, type ReviewRole } from "./types";

/** Roles de demostración; no sustituyen autenticación ni autorización de un servidor. */
export function canReview(role: ReviewRole, action: ReviewAction): boolean {
  if (!REVIEW_ROLES.includes(role)) return false;
  if (action === "read" || action === "export") return true;
  return role !== "auditor" && ["decide", "assign", "import", "reset"].includes(action);
}

export { canReview as puede };
