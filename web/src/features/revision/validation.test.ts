import { describe, expect, it } from "vitest";

import { canReview, puede } from "./permissions";
import { REVIEW_ROLES, type ReviewAction, type ReviewRole } from "./types";
import { validateAssignment, validateDecision } from "./validation";

describe("Permisos de roles simulados", () => {
  it.each(REVIEW_ROLES)("%s puede consultar y exportar", (role) => {
    expect(canReview(role, "read")).toBe(true);
    expect(canReview(role, "export")).toBe(true);
    expect(puede).toBe(canReview);
  });
  it.each(["decide", "assign", "import", "reset"] as const)("el auditor no puede ejecutar %s", (action) => {
    expect(canReview("auditor", action)).toBe(false);
    expect(canReview("analista", action)).toBe(true);
    expect(canReview("jefatura", action)).toBe(true);
  });
  it("un rol o acción desconocidos no reciben permiso", () => {
    expect(canReview("otro" as ReviewRole, "read")).toBe(false);
    expect(canReview("analista", "otra" as ReviewAction)).toBe(false);
  });
});

describe("Validación de decisiones y asignaciones", () => {
  it.each([undefined, "", "  \n\t"])("requiere atención rechaza comentario vacío: %s", (comment) => {
    const result = validateDecision({ ocid: "proceso-1", role: "analista", state: "requiere_atencion", comment });
    expect(result.valid).toBe(false);
    expect(result.errors.comment).toBe("Explica por qué requiere atención");
  });
  it("una decisión justificada también exige explicación", () => {
    expect(validateDecision({ ocid: "proceso-1", role: "jefatura", state: "justificada" }).valid).toBe(false);
    expect(validateDecision({ ocid: "proceso-1", role: "jefatura", state: "justificada", comment: "Sustento revisado" }).valid).toBe(true);
  });
  it("en revisión permite comenzar sin comentario", () => {
    expect(validateDecision({ ocid: "proceso-1", role: "analista", state: "en_revision" })).toEqual({ valid: true, errors: {} });
  });
  it("rechaza procesos inválidos y decisiones del auditor", () => {
    const result = validateDecision({ ocid: "../otro", role: "auditor", state: "en_revision" });
    expect(result.errors.ocid).toBeDefined();
    expect(result.errors.role).toBeDefined();
  });
  it("las asignaciones exigen otro rol y una nota", () => {
    expect(validateAssignment({ ocid: "proceso-1", role: "analista", assignedTo: "analista", note: " " }).valid).toBe(false);
    expect(validateAssignment({ ocid: "proceso-1", role: "analista", assignedTo: "jefatura", note: "Revisar el sustento" }).valid).toBe(true);
  });
});
