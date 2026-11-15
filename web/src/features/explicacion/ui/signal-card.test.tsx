// @vitest-environment jsdom
import path from "node:path";

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import { StaticDataSource } from "@/lib/data/static-data-source";

import { SignalCard } from "./signal-card";

const source = new StaticDataSource(path.join(process.cwd(), "data/fixture"));
const entities = await source.listEntities();
const signals = (
  await Promise.all(entities.map((entity) => source.listSignals(entity.id)))
).flat();
const manifest = await source.getManifest();
beforeAll(() =>
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  ),
);
afterAll(() => vi.unstubAllGlobals());
afterEach(cleanup);

describe("Tarjeta de señal", () => {
  it.each(signals)(
    "$id imprime los seis bloques en orden con valores del paquete",
    (signal) => {
      const { container } = render(
        <SignalCard
          signal={signal}
          context={{ manifest, process: { url_seace: null } }}
          variant="print"
        />,
      );
      expect(
        screen
          .getAllByRole("heading", { level: 4 })
          .slice(0, 6)
          .map((heading) => heading.textContent),
      ).toEqual([
        "Qué encontramos",
        "Con qué lo comparamos",
        "Por qué importa",
        "Qué revisar",
        "Qué no significa",
        "Datos usados",
      ]);
      expect(
        screen.getByRole("link", { name: /Cardinal|OCP|Trazabilidad/ }),
      ).toHaveAttribute("href", "/metodologia");
      expect(container.textContent).not.toMatch(
        /null|undefined|NaN|corrupci[oó]n|fraude|irregular|sospechos|culpable/i,
      );
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      if (signal.simulado || signal.codigo === "S08")
        expect(screen.getAllByText("Dato simulado").length).toBeGreaterThan(0);
      for (const note of signal.calidad)
        expect(screen.getByText(note)).toBeVisible();
    },
  );

  it("expande la explicación y permite marcar cada punto de revisión", () => {
    render(<SignalCard signal={signals[0]} />);
    expect(
      screen.queryByRole("heading", { name: "Qué no significa" }),
    ).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", {
      name: "Ver explicación completa",
    });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("heading", { name: "Qué no significa" }),
    ).toBeVisible();
    const check = screen.getAllByRole("checkbox")[0];
    fireEvent.click(check);
    expect(check).toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("muestra el enlace real, la fuente y el corte al abrir Datos usados", async () => {
    const signal = signals.find((item) => item.codigo === "S01")!;
    const process = await source.getProcess(signal.ocids[0]);
    render(
      <SignalCard
        signal={signal}
        context={{
          manifest,
          process: {
            url_seace: process!.url_seace ?? "https://ejemplo.gob.pe/proceso/1",
          },
        }}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Ver explicación completa" }),
    );
    fireEvent.click(screen.getByText("Datos usados"));
    const disclosure = screen.getByText("Datos usados").closest("details")!;
    disclosure.open = true;
    expect(
      screen.getByRole("link", { name: "Ver en el SEACE" }),
    ).toHaveAttribute(
      "href",
      process!.url_seace ?? "https://ejemplo.gob.pe/proceso/1",
    );
    expect(
      screen.getByText(`Fuente: ${manifest.fuente.nombre}.`),
    ).toBeVisible();
    expect(screen.getByText("Datos al 4 oct 2026.")).toBeVisible();
  });

  it("no inventa estadísticas ni enlaces si faltan datos", () => {
    const signal = {
      ...signals[0],
      comparacion: null,
      entradas: {},
      calidad: ["Postor duplicado corregido"],
    };
    render(
      <SignalCard
        signal={signal}
        context={{ manifest, process: { url_seace: null } }}
        variant="print"
      />,
    );
    expect(
      screen.getByText("La fuente no publica un enlace para este proceso."),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Ver en el SEACE" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Postor duplicado corregido")).toBeVisible();
  });

  it("expone el desglose en el foco del teclado mediante el componente compartido", async () => {
    const priority = {
      puntaje: 5,
      nivel: "alta" as const,
      desglose: [
        { codigo: "S01" as const, peso: 3 },
        { codigo: "S02" as const, peso: 2 },
      ],
    };
    render(
      <TooltipProvider>
        <SignalCard signal={signals[0]} priority={priority} />
      </TooltipProvider>,
    );
    const button = screen.getByRole("button", {
      name: "Prioridad de revisión: Alta · S01 (3) + S02 (2) = 5",
    });
    act(() => button.focus());
    expect(button).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "S01 (3) + S02 (2) = 5",
    );
  });
});
