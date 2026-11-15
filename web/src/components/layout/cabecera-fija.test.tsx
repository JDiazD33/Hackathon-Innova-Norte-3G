// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CabeceraFija } from "./cabecera-fija";

/*
 * La cabecera publica su alto real en --alto-cabecera para que la barra de filtros y la cabecera de la
 * tabla de la bandeja se fijen justo debajo, aunque la cabecera crezca (segunda línea, selector de rol).
 */
let alto = 56;
let avisar: (() => void) | null = null;

beforeEach(() => {
  alto = 56;
  avisar = null;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        avisar = callback;
      }
      observe() {}
      disconnect() {
        avisar = null;
      }
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () => ({ height: alto }) as DOMRect,
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const variable = () => document.documentElement.style.getPropertyValue("--alto-cabecera");

describe("CabeceraFija", () => {
  it("publica su alto al montarse y lo actualiza cuando cambia", () => {
    render(<CabeceraFija>contenido</CabeceraFija>);
    expect(variable()).toBe("56px");

    alto = 111;
    act(() => avisar?.());
    expect(variable()).toBe("111px");
  });

  it("es un landmark de cabecera fijo y quita la variable al desmontarse", () => {
    const { container, unmount } = render(<CabeceraFija>contenido</CabeceraFija>);
    const cabecera = container.querySelector("header");
    expect(cabecera).not.toBeNull();
    expect(cabecera?.className).toContain("sticky");
    expect(cabecera?.className).toContain("@container/cabecera");
    unmount();
    expect(variable()).toBe("");
  });
});
