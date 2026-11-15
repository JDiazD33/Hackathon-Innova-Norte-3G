// @vitest-environment jsdom
import path from "node:path";

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { StaticDataSource } from "@/lib/data/static-data-source";
import { getReviewStore } from "@/lib/revisiones";

import { ReportView } from "./report-view";

const source = new StaticDataSource(path.join(process.cwd(), "data/fixture"));
beforeEach(() => {
  act(() => getReviewStore().resetDemo("analista", true));
});
afterEach(cleanup);

describe("Reporte independiente del Lote D", () => {
  it("incluye los seis bloques, simulación, atribución, versión e historial del navegador", async () => {
    const process = (await source.getProcess("ocds-fixture-e1-007"))!;
    const [manifest, signals, file] = await Promise.all([
      source.getManifest(),
      source.getSignalsForProcess(process.ocid),
      source.getExpediente(process.ocid),
    ]);
    getReviewStore().saveDecision({
      ocid: process.ocid,
      role: "analista",
      state: "justificada",
      comment: "Documentación sintética revisada.",
    });
    render(
      <ReportView
        process={process}
        manifest={manifest}
        signals={signals}
        file={file}
        entityName="Entidad de prueba"
        generatedAt="2026-11-14T18:00:00Z"
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      process.descripcion,
    );
    for (const name of [
      "Qué encontramos",
      "Con qué lo comparamos",
      "Por qué importa",
      "Qué revisar",
      "Qué no significa",
      "Datos usados",
    ])
      expect(screen.getAllByRole("heading", { name }).length).toBe(
        signals.length,
      );
    expect(screen.getAllByText("Dato simulado").length).toBeGreaterThan(0);
    expect(screen.getByText(manifest.atribucion)).toBeVisible();
    expect(screen.getByText("Documentación sintética revisada.")).toBeVisible();
    expect(screen.getByText(/Reglas fixture-1/)).toBeVisible();
    expect(
      screen.queryByRole("navigation", { name: "Principal" }),
    ).not.toBeInTheDocument();
  });
});
