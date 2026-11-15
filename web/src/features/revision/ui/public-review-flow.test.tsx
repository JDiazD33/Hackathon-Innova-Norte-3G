// @vitest-environment jsdom
import path from "node:path";
import { cwd } from "node:process";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { StaticDataSource } from "@/lib/data/static-data-source";
import { getReviewStore } from "@/lib/revisiones";
import { setReviewRole } from "../role-store";
import { ReviewView } from "./review-view";
import { ReportView } from "./report-view";

afterEach(cleanup);

it("conserva el caso público de la entidad al decidir, asignar y generar trazabilidad", async () => {
  const source = new StaticDataSource(path.join(cwd(), "data/publico"));
  const entity = (await source.getEntity("PE-CONSUCODE-10489"))!;
  const processes = await source.listProcesses(entity.id);
  const process = processes.find((item) => item.prioridad !== null)!;
  const manifest = await source.getManifest();
  expect(manifest.modo).toBe("publico");
  expect(process.simulado).toBe(false);
  act(() => {
    setReviewRole("analista");
    getReviewStore().resetDemo("analista", true);
  });
  const view = render(<ReviewView entity={entity} cases={[{
    ocid: process.ocid, description: process.descripcion,
    date: process.fechas.convocatoria, simulated: process.simulado,
  }]} />);
  expect(screen.getByRole("link", { name: "Consultar ficha y evidencia" })).toHaveAttribute("href", `/procesos/${process.ocid}?entidad=${entity.id}`);
  expect(screen.getByRole("link", { name: "bandeja de señales" })).toHaveAttribute("href", `/senales?entidad=${entity.id}`);
  fireEvent.click(screen.getByRole("button", { name: "Registrar revisión" }));
  fireEvent.click(screen.getByRole("radio", { name: "Requiere atención" }));
  fireEvent.change(screen.getByRole("textbox", { name: /Comentario/ }), { target: { value: "Prueba de interfaz: pendiente contrastar el sustento publicado." } });
  fireEvent.click(screen.getByRole("button", { name: /^Registrar$/ }));
  fireEvent.click(screen.getByRole("button", { name: "Asignar caso" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Nota para el rol destinatario" }), { target: { value: "Prueba de interfaz: revisar el documento oficial y registrar el resultado." } });
  fireEvent.click(screen.getByRole("button", { name: /^Asignar$/ }));
  act(() => setReviewRole("jefatura"));
  expect(within(screen.getByRole("tabpanel", { name: "Asignados a mí" })).getByText(process.descripcion)).toBeVisible();
  expect(getReviewStore().listReviews(process.ocid)).toHaveLength(2);
  view.unmount();
  render(<ReportView process={process} manifest={manifest} entityName={entity.nombre}
    signals={await source.getSignalsForProcess(process.ocid)} file={await source.getExpediente(process.ocid)}
    generatedAt="2026-11-15T18:00:00Z" />);
  expect(screen.getByText(manifest.atribucion)).toBeVisible();
  expect(screen.getByText(/Prueba de interfaz: pendiente contrastar/)).toBeVisible();
  expect(screen.getByText(/Prueba de interfaz: revisar el documento/)).toBeVisible();
  expect(screen.queryByRole("navigation", { name: "Principal" })).not.toBeInTheDocument();
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Volver a revisión" })).toHaveAttribute("href", `/revision?entidad=${entity.id}`);
});
