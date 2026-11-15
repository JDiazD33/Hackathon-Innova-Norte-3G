// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getReviewStore } from "@/lib/revisiones";

import { setReviewRole } from "../role-store";
import { DecisionDialog } from "./decision-dialog";
import { ReviewHistory } from "./review-history";
import { ReviewView } from "./review-view";

beforeEach(() => {
  window.localStorage.clear();
  act(() => {
    setReviewRole("analista");
    getReviewStore().resetDemo("analista", true);
  });
});
afterEach(cleanup);

const cases = [
  {
    ocid: "proceso-1",
    description: "Compra de prueba",
    nomenclatura: "AS-SM-1-2026-PRUEBA-1",
    estado: "CONVOCADO",
    date: "2026-10-01",
    signals: 1,
    priority: 3,
    simulated: false,
  },
];
const entity = { id: "entidad-0001", nombre: "Entidad de prueba" };

describe("Revisión desde los componentes reales", () => {
  it("no guarda requiere atención sin comentario y sí registra el sustento", () => {
    render(
      <>
        <DecisionDialog ocid="proceso-1" />
        <ReviewHistory ocid="proceso-1" />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Registrar revisión" }));
    fireEvent.click(screen.getByRole("radio", { name: "Requiere atención" }));
    fireEvent.click(
      screen.getByRole("button", { name: /^Registrar$/ }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Explica por qué requiere atención",
    );
    expect(getReviewStore().listReviews()).toHaveLength(0);
    fireEvent.change(screen.getByRole("textbox", { name: /Comentario/ }), {
      target: { value: "Falta contrastar el documento de sustento." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /^Registrar$/ }),
    );
    expect(getReviewStore().getState("proceso-1")).toBe("requiere_atencion");
    expect(getReviewStore().listReviews()[0].rol).toBe("analista");
    expect(
      screen.getByText("Falta contrastar el documento de sustento."),
    ).toBeVisible();
  });

  it("admite en revisión sin comentario y cancelar no registra nada", () => {
    render(<DecisionDialog ocid="proceso-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Registrar revisión" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(getReviewStore().listReviews()).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Registrar revisión" }));
    fireEvent.click(
      screen.getByRole("button", { name: /^Registrar$/ }),
    );
    expect(getReviewStore().getState("proceso-1")).toBe("en_revision");
  });

  it("un cambio a auditor cierra la decisión y oculta todas las escrituras", () => {
    render(<ReviewView entity={entity} cases={cases} />);
    fireEvent.click(screen.getByRole("button", { name: "Registrar revisión" }));
    act(() => setReviewRole("auditor"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Registrar revisión" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Asignar caso" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Importar revisiones" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reiniciar demostración" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Exportar revisiones" }),
    ).toBeEnabled();
    expect(getReviewStore().listReviews()).toHaveLength(0);
  });

  it("exige una nota y la asignación aparece para el rol destinatario", () => {
    render(<ReviewView entity={entity} cases={cases} />);
    fireEvent.click(screen.getByRole("button", { name: "Asignar caso" }));
    fireEvent.click(
      screen.getByRole("button", { name: /^Asignar$/ }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Añade una nota");
    expect(getReviewStore().listAssignedTo("jefatura")).toHaveLength(0);
    fireEvent.change(
      screen.getByRole("textbox", { name: "Nota para el rol destinatario" }),
      { target: { value: "Contrastar las fechas con el documento oficial." } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: /^Asignar$/ }),
    );
    act(() => setReviewRole("jefatura"));
    const panel = screen.getByRole("tabpanel", { name: "Asignados a mí" });
    expect(
      within(panel).getByText(
        "Contrastar las fechas con el documento oficial.",
      ),
    ).toBeVisible();
    expect(
      within(panel).getByRole("link", { name: "Compra de prueba" }),
    ).toHaveAttribute("href", "/procesos/proceso-1?entidad=entidad-0001");
  });

  it("conserva el estado más reciente en fechas empatadas y muestra primero la última entrada", () => {
    getReviewStore().importReviews(
      JSON.stringify({
        version: 1,
        entradas: [
          {
            id: "primera",
            ocid: "proceso-1",
            rol: "analista",
            fecha: "2026-11-14T18:00:00Z",
            tipo: "decision",
            estado: "en_revision",
            comentario: "Primera entrada",
          },
          {
            id: "segunda",
            ocid: "proceso-1",
            rol: "analista",
            fecha: "2026-11-14T18:00:00Z",
            tipo: "decision",
            estado: "justificada",
            comentario: "Segunda entrada",
          },
        ],
      }),
      "analista",
    );
    render(<ReviewHistory ocid="proceso-1" />);
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      "Segunda entrada",
    );
    expect(screen.getAllByText("Justificada")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /editar|borrar/i }),
    ).not.toBeInTheDocument();
  });

  it("reiniciar requiere confirmación y conserva el rol", () => {
    getReviewStore().saveDecision({
      ocid: "proceso-1",
      role: "analista",
      state: "en_revision",
    });
    render(<ReviewView entity={entity} cases={cases} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Reiniciar demostración" }),
    );
    expect(getReviewStore().listReviews()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(getReviewStore().listReviews()).toHaveLength(1);
    fireEvent.click(
      screen.getByRole("button", { name: "Reiniciar demostración" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Reiniciar revisiones" }),
    );
    expect(getReviewStore().listReviews()).toHaveLength(0);
    expect(window.localStorage.getItem("rol:v1")).toBe("analista");
  });
});
