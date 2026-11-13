import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { DataSource } from "@/lib/data/data-source";
import { StaticDataSource } from "@/lib/data/static-data-source";

import { EmptyReviewStore, type ReviewStore } from "./index";

describe("Contrato inicial de revisión para los lotes B y C", () => {
  it("la bandeja combina procesos del DataSource con un estado inicial", async () => {
    const data: DataSource = new StaticDataSource(fileURLToPath(new URL("../../../data/fixture", import.meta.url)));
    const store: ReviewStore = new EmptyReviewStore();
    const processes = await data.listProcesses("entidad-0001");
    const rows = processes.map((process) => ({ ocid: process.ocid, state: store.getState(process.ocid) }));
    expect(rows).toHaveLength(22);
    expect(rows.every((row) => row.state === "sin_revisar")).toBe(true);
  });

  it("una ficha puede leer el historial vacío", () => {
    const store = new EmptyReviewStore();
    expect(store.listReviews("ocds-fixture-e1-007")).toEqual([]);
    expect(store.listAssignedTo("analista")).toEqual([]);
    expect(store.listAssignedBy("jefatura")).toEqual([]);
    expect(store.listDecided()).toEqual([]);
  });

  it("mantiene snapshots estables y no simula que una decisión fue guardada", () => {
    const store: ReviewStore = new EmptyReviewStore();
    expect(store.getSnapshot()).toBe(store.getSnapshot());
    expect(store.getServerSnapshot()).toBe(store.getServerSnapshot());
    const unsubscribe = store.subscribe(() => {});
    unsubscribe();
    expect(() => store.saveDecision({ ocid: "proceso-1", role: "analista", state: "en_revision" })).toThrow("no está habilitado");
    expect(JSON.parse(store.exportReviews())).toEqual({ version: 1, entradas: [] });
  });
});
