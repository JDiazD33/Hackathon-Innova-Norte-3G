// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { FILTROS_VACIOS, type FiltrosBandeja, type OpcionesFiltro } from "../bandeja";
import { FiltrosDeBandeja } from "./filtros";

/*
 * Pruebas de componente de la barra de filtros de la bandeja (Lote B, tarea 4.2): cada filtro cambia el
 * estado que recibe la bandeja y "Limpiar filtros" lo restablece. La lógica de filtrado tiene sus propias
 * pruebas en bandeja.test.ts.
 */

beforeAll(() => {
  // Radix (popovers) mide los elementos con ResizeObserver, que jsdom no trae.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(cleanup);

const OPCIONES: OpcionesFiltro = {
  prioridades: ["alta", "media", "baja"],
  categorias: [
    { categoria: "competencia", etiqueta: "Competencia" },
    { categoria: "tiempos", etiqueta: "Tiempos" },
  ],
  metodos: ["Adjudicación simplificada", "Licitación pública"],
};

/** Monta la barra con estado propio y devuelve un espía con cada cambio. */
function montar(inicial: FiltrosBandeja = FILTROS_VACIOS) {
  const cambios = vi.fn<(filtros: FiltrosBandeja) => void>();
  function Envoltorio() {
    const [filtros, setFiltros] = useState(inicial);
    return (
      <FiltrosDeBandeja
        opciones={OPCIONES}
        filtros={filtros}
        onChange={(nuevos) => {
          cambios(nuevos);
          setFiltros(nuevos);
        }}
      />
    );
  }
  render(<Envoltorio />);
  return { cambios, ultimo: () => cambios.mock.lastCall?.[0] };
}

describe("FiltrosDeBandeja", () => {
  it("la prioridad es un control segmentado de una sola opción, con 'Todas' por defecto", () => {
    const { ultimo } = montar();
    const grupo = screen.getByRole("radiogroup", { name: "Prioridad" });
    const segmentos = within(grupo).getAllByRole("radio");
    expect(segmentos.map((s) => s.textContent)).toEqual(["Todas", "Alta", "Media", "Baja"]);
    expect(within(grupo).getByRole("radio", { name: "Todas" })).toHaveAttribute("aria-checked", "true");

    fireEvent.click(within(grupo).getByRole("radio", { name: "Alta" }));
    expect(ultimo()?.prioridades).toEqual(["alta"]);

    fireEvent.click(within(grupo).getByRole("radio", { name: "Media" }));
    expect(ultimo()?.prioridades).toEqual(["media"]);

    fireEvent.click(within(grupo).getByRole("radio", { name: "Todas" }));
    expect(ultimo()?.prioridades).toEqual([]);
  });

  it("elegir otra vez el segmento activo no lo desmarca", () => {
    const { cambios } = montar({ ...FILTROS_VACIOS, prioridades: ["alta"] });
    fireEvent.click(screen.getByRole("radio", { name: "Alta" }));
    expect(cambios).not.toHaveBeenCalled();
  });

  it("filtra por categoría, método y revisión con casillas en un botón emergente", () => {
    const { ultimo } = montar();

    fireEvent.click(screen.getByRole("button", { name: "Categoría" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Tiempos" }));
    expect(ultimo()?.categorias).toEqual(["tiempos"]);
    expect(screen.getByRole("button", { name: "Categoría: 1 elegida" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Método" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Licitación pública" }));
    expect(ultimo()?.metodos).toEqual(["Licitación pública"]);

    fireEvent.click(screen.getByRole("button", { name: "Revisión" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Requiere atención" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Justificada" }));
    expect(ultimo()?.estados).toEqual(["requiere_atencion", "justificada"]);

    fireEvent.click(screen.getByRole("checkbox", { name: "Justificada" }));
    expect(ultimo()?.estados).toEqual(["requiere_atencion"]);
  });

  it("filtra por rango de fechas de convocatoria desde un popover", () => {
    const { ultimo } = montar();
    fireEvent.click(screen.getByRole("button", { name: "Convocatoria: Fechas" }));
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2025-03-01" } });
    expect(ultimo()).toMatchObject({ desde: "2025-03-01", hasta: null });
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2025-12-31" } });
    expect(ultimo()).toMatchObject({ desde: "2025-03-01", hasta: "2025-12-31" });
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "" } });
    expect(ultimo()).toMatchObject({ desde: null, hasta: "2025-12-31" });
  });

  it("muestra 'Limpiar filtros' solo con filtros activos y lo restablece todo", () => {
    montar();
    expect(screen.queryByRole("button", { name: "Limpiar filtros" })).toBeNull();
    cleanup();

    const { ultimo } = montar({ ...FILTROS_VACIOS, prioridades: ["baja"], metodos: ["Licitación pública"] });
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(ultimo()).toEqual(FILTROS_VACIOS);
    expect(screen.queryByRole("button", { name: "Limpiar filtros" })).toBeNull();
    expect(screen.getByRole("radio", { name: "Todas" })).toHaveAttribute("aria-checked", "true");
  });
});
