// @vitest-environment jsdom
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import SupplierNotFound from "@/app/(app)/proveedores/[id]/not-found";
import type { DataSource } from "@/lib/data/data-source";
import { StaticDataSource } from "@/lib/data/static-data-source";
import type { Proveedor } from "@/lib/data/types";

import { loadSupplierDetail } from "../supplier-detail";
import { SupplierView } from "./supplier-view";

const source = new StaticDataSource(path.join(process.cwd(), "data/fixture"));
afterEach(cleanup);

describe("Ficha del proveedor", () => {
  it("muestra participación, procesos enlazados y la tarjeta S03 del fixture", async () => {
    const detail = (await loadSupplierDetail(source, "P0003", "entidad-0001"))!;
    render(<SupplierView detail={detail} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      detail.identity.displayName,
    );
    expect(screen.getByText("40.9%", { selector: "p" })).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Proveedor recurrente atípico en una entidad",
      }),
    ).toBeVisible();
    for (const process of detail.wonProcesses)
      expect(
        screen
          .getAllByRole("link", { name: process.descripcion })
          .find(
            (link) =>
              link.getAttribute("href") ===
              `/procesos/${process.ocid}?entidad=entidad-0001`,
          ),
      ).toHaveAttribute(
        "href",
        `/procesos/${process.ocid}?entidad=entidad-0001`,
      );
    expect(screen.queryByText(/^RUC:/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Ficha Única del Proveedor" }),
    ).not.toBeInTheDocument();
  });

  it.each(["publico", "local"] as const)(
    "nunca renderiza el nombre de una persona natural en %s",
    async (mode) => {
      const customized = Object.create(source) as DataSource;
      const manifest = await source.getManifest();
      const supplier = (await source.getSupplier("P0003"))!;
      const personal: Proveedor = {
        ...supplier,
        tipo: "persona_natural",
        nombre: "Nombre privado de prueba",
        ruc: "10999999999",
        url_ficha_unica: "https://ejemplo.gob.pe/ficha/10999999999",
      };
      customized.getSupplier = async () => personal;
      customized.getManifest = async () => ({ ...manifest, modo: mode });
      const detail = (await loadSupplierDetail(
        customized,
        "P0003",
        "entidad-0001",
      ))!;
      const { container } = render(<SupplierView detail={detail} />);
      expect(container.innerHTML).not.toContain(personal.nombre);
      if (mode === "publico")
        expect(container.innerHTML).not.toContain(personal.ruc);
      else expect(screen.getByText(`RUC: ${personal.ruc}`)).toBeVisible();
    },
  );

  it("muestra el nombre y el enlace de una persona jurídica solo en modo local", async () => {
    const detail = (await loadSupplierDetail(source, "P0003", "entidad-0001"))!;
    detail.manifest = { ...detail.manifest, modo: "local" };
    detail.identity = {
      displayName: "Empresa de prueba",
      taxId: "20999999999",
      profileUrl: "https://ejemplo.gob.pe/ficha/20999999999",
    };
    render(<SupplierView detail={detail} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Empresa de prueba",
    );
    expect(
      screen.getByRole("link", { name: "Ficha Única del Proveedor" }),
    ).toHaveAttribute("href", detail.identity.profileUrl);
  });

  it("presenta la ausencia de adjudicaciones y un regreso para proveedores inexistentes", async () => {
    const detail = (await loadSupplierDetail(source, "P0003", "entidad-0001"))!;
    render(
      <SupplierView
        detail={{
          ...detail,
          wonProcesses: [],
          amounts: [],
          participation: null,
          signals: [],
        }}
      />,
    );
    expect(
      screen.getByText(
        "No hay procesos ganados por este proveedor en la entidad seleccionada.",
      ),
    ).toBeVisible();
    cleanup();
    render(<SupplierNotFound />);
    expect(screen.getByText("No encontramos este proveedor")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Volver a señales" }),
    ).toHaveAttribute("href", "/senales");
  });
});
