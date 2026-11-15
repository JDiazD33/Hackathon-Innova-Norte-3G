// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { setReviewRole } from "@/features/revision/role-store";

import { ProcessHistory } from "./process-history";

const OCID = "ocds-fixture-e1-007";

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("Revisión en la ficha del proceso (C 2.5)", () => {
  it("muestra el botón Registrar revisión al analista", () => {
    act(() => setReviewRole("analista"));
    render(<ProcessHistory ocid={OCID} description="Proceso de prueba" />);
    expect(
      screen.getByRole("button", { name: "Registrar revisión" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Historial de revisión" }),
    ).toBeVisible();
  });

  it("muestra el historial al auditor, sin el botón ni la asignación", () => {
    act(() => setReviewRole("auditor"));
    render(<ProcessHistory ocid={OCID} description="Proceso de prueba" />);
    expect(
      screen.queryByRole("button", { name: "Registrar revisión" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /asignar/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Estado vigente")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver reporte" })).toHaveAttribute(
      "href",
      `/reporte/${OCID}`,
    );
  });
});
