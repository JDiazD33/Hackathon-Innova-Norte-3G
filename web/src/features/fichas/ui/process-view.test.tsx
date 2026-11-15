// @vitest-environment jsdom
import path from "node:path";

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ProcessNotFound from "@/app/(app)/procesos/[ocid]/not-found";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StaticDataSource } from "@/lib/data/static-data-source";
import { formatSoles } from "@/lib/format";

import { loadProcessDetail } from "../process-detail";
import { ProcessView } from "./process-view";

vi.mock("@/lib/revisiones", () => ({
  useRevisiones: () => ({
    snapshot: { entries: [], warning: null },
    estadoDe: () => "sin_revisar",
  }),
}));
const source = new StaticDataSource(path.join(process.cwd(), "data/fixture"));
const entities = await source.listEntities();
const processes = (
  await Promise.all(entities.map((entity) => source.listProcesses(entity.id)))
).flat();
afterEach(cleanup);

describe("Ficha del proceso", () => {
  it("muestra el resumen completo y los documentos del fixture", async () => {
    const process = processes.find(
      (item) => item.documentos.length > 0 && item.monto_final != null,
    )!;
    const detail = (await loadProcessDetail(source, process.ocid))!;
    render(
      <TooltipProvider>
        <ProcessView detail={detail} />
      </TooltipProvider>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      process.descripcion,
    );
    expect(
      screen.getByText("Monto final").parentElement?.querySelector("dd")
        ?.textContent,
    ).toBe(formatSoles(process.monto_final));
    // Contrato 1.1: la nomenclatura permite buscar el proceso en el SEACE.
    expect(
      screen.getByText("Nomenclatura en el SEACE").parentElement?.querySelector("dd")
        ?.textContent,
    ).toBe(process.nomenclatura || "Sin dato");
    expect(
      screen.getByRole("link", { name: "Volver a señales" }),
    ).toHaveAttribute("href", `/senales?entidad=${process.entidad_id}`);
    for (const document of process.documentos)
      expect(
        screen.getByRole("link", { name: document.titulo }),
      ).toHaveAttribute("href", document.url);
    const timeline = screen
      .getByRole("heading", { name: "Línea de tiempo" })
      .closest("[data-slot='card']")!;
    expect(
      within(timeline as HTMLElement).getAllByRole("listitem"),
    ).toHaveLength(detail.timeline.length);
  });

  it("marca las etapas del expediente simulado en la línea de tiempo", async () => {
    const details = await Promise.all(
      processes.map((process) => loadProcessDetail(source, process.ocid)),
    );
    const detail = details.find((item) =>
      item!.timeline.some((event) => event.source === "internal"),
    )!;
    render(
      <TooltipProvider>
        <ProcessView detail={detail} />
      </TooltipProvider>,
    );
    const timeline = screen
      .getByRole("heading", { name: "Línea de tiempo" })
      .closest("[data-slot='card']")!;
    expect(
      within(timeline as HTMLElement).getAllByText("Dato simulado").length,
    ).toBe(detail.timeline.filter((event) => event.isSimulated).length);
  });

  it("muestra Sin dato sin ocultar el resto del resumen cuando faltan montos y estado", async () => {
    const process = processes.find((item) => item.monto_final === null)!;
    const detail = (await loadProcessDetail(source, process.ocid))!;
    detail.process = { ...detail.process, estado: null, numero_postores: null };
    render(
      <TooltipProvider>
        <ProcessView detail={detail} />
      </TooltipProvider>,
    );
    for (const label of [
      "Monto final",
      "Estado del proceso",
      "Participantes registrados",
    ]) {
      expect(screen.getByText(label).parentElement).toHaveTextContent(
        "Sin dato",
      );
    }
    expect(
      screen.getByRole("heading", { name: "Resumen del proceso" }),
    ).toBeVisible();
    expect(
      screen.getByText(detail.entity!.nombre, { selector: "dd" }),
    ).toBeVisible();
  });

  it("explica que no hay documentos ni señales cuando la fuente no los incluye", async () => {
    const detail = (await loadProcessDetail(source, processes[0].ocid))!;
    detail.process = {
      ...detail.process,
      documentos: [],
      url_seace: null,
      prioridad: null,
    };
    detail.signals = [];
    render(
      <TooltipProvider>
        <ProcessView detail={detail} />
      </TooltipProvider>,
    );
    expect(
      screen.getByText("La fuente no publica documentos para este proceso"),
    ).toBeVisible();
    expect(
      screen.getByText("No se encontraron señales para este proceso."),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Ver en el SEACE" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Aún no hay revisiones registradas para este proceso."),
    ).toBeVisible();
  });

  it("ofrece un regreso a la bandeja cuando no existe el proceso", () => {
    render(<ProcessNotFound />);
    expect(screen.getByText("No encontramos este proceso")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Volver a señales" }),
    ).toHaveAttribute("href", "/senales");
  });
});
