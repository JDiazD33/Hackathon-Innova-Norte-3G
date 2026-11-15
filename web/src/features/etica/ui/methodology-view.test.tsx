// @vitest-environment jsdom
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StaticDataSource } from "@/lib/data/static-data-source";

import { MethodologyView } from "./methodology-view";

afterEach(cleanup);
const source = new StaticDataSource(path.join(process.cwd(), "data/fixture"));

describe("Página de metodología", () => {
  it("presenta el origen y los pesos recibidos sin sustituirlos por los valores iniciales", async () => {
    const manifest = await source.getManifest();
    manifest.prioridad = {
      pesos: { S01: 7, S03: 4 },
      cortes: { alta: 11, media: 7 },
    };
    manifest.senales_activas = ["S01", "S03", "S08"];
    render(<MethodologyView manifest={manifest} />);
    expect(screen.getByText(manifest.fuente.nombre)).toBeVisible();
    expect(screen.getByText(manifest.atribucion)).toBeVisible();
    expect(screen.getByRole("row", { name: "S01 7" })).toBeVisible();
    expect(screen.getByText("S01 (7) + S03 (4) = 11 puntos.")).toBeVisible();
    expect(screen.getByText(manifest.version_reglas)).toBeVisible();
    expect(screen.getByText("Dato simulado")).toBeVisible();
    expect(screen.getByRole("link", { name: "Cardinal" })).toHaveAttribute(
      "href",
      "https://github.com/open-contracting/cardinal-rs",
    );
    expect(
      screen.queryByRole("heading", {
        name: "Plazo corto para presentar ofertas",
      }),
    ).not.toBeInTheDocument();
  });
});
