// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import { STATE_LABELS, type ReviewState } from "@/features/revision";

import { EstadoRevisionBadge } from "./estado-revision-badge";
import { PrioridadBadge } from "./prioridad-badge";
import { SinDatos } from "./sin-datos";

/*
 * Los componentes compartidos conservan su API con la apariencia Prisma y siguen comunicando prioridad y
 * estado con ícono y texto, no solo con color (docs/diseno/sistema-de-diseno.md · ADR 0007).
 */
afterEach(cleanup);

describe("EstadoRevisionBadge", () => {
  it.each(Object.keys(STATE_LABELS) as ReviewState[])("muestra ícono y texto para %s", (estado) => {
    const { container } = render(<EstadoRevisionBadge estado={estado} />);
    expect(screen.getByText(STATE_LABELS[estado])).toBeInTheDocument();
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
  });

  it("solo 'requiere atención' usa los tokens rojos", () => {
    const { container } = render(<EstadoRevisionBadge estado="requiere_atencion" />);
    expect(container.firstElementChild?.className).toContain("bg-estado-requiere-atencion");
    const otro = render(<EstadoRevisionBadge estado="en_revision" />);
    expect(otro.container.firstElementChild?.className).not.toContain("requiere-atencion");
  });
});

describe("PrioridadBadge", () => {
  it("muestra el nivel, el indicador de puntos y el desglose accesible, sin rojo", () => {
    const { container } = render(
      <TooltipProvider>
        <PrioridadBadge prioridad={{ puntaje: 6, nivel: "alta", desglose: [{ codigo: "S01", peso: 3 }, { codigo: "S03", peso: 3 }] }} />
      </TooltipProvider>,
    );
    const boton = screen.getByRole("button", { name: /^Prioridad de revisión:/ });
    expect(boton).toHaveTextContent("Alta");
    expect(container.querySelectorAll("span[aria-hidden='true'] > span")).toHaveLength(3);
    expect(boton.className).toContain("bg-prioridad-alta");
    expect(boton.className).not.toMatch(/requiere-atencion|destructive/);
  });
});

describe("SinDatos", () => {
  it("funciona con las props de antes (mensaje y acción)", () => {
    render(<SinDatos mensaje="Ningún proceso coincide con los filtros." accion={<button type="button">Limpiar filtros</button>} />);
    expect(screen.getByText("Ningún proceso coincide con los filtros.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpiar filtros" })).toBeInTheDocument();
  });

  it("acepta un título opcional", () => {
    render(<SinDatos titulo="Sin resultados" mensaje="Prueba con otros filtros." />);
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
  });
});
