import { describe, expect, it, vi } from "vitest";

import { LocalReviewStore, MEMORY_WARNING, REVIEW_STORAGE_KEY } from "./local-review-store";
import type { DecisionEntry, ReviewEntry, ReviewStorage } from "./types";

class MemoryStorage implements ReviewStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

function makeStore(storage: ReviewStorage | null = new MemoryStorage()) {
  let count = 0;
  return new LocalReviewStore({ storage, createId: () => `entrada-${++count}`, now: () => new Date("2026-11-13T10:00:00-05:00") });
}
function start(store: LocalReviewStore, ocid = "proceso-1") {
  return store.saveDecision({ ocid, role: "analista", state: "en_revision" });
}
function file(entries: readonly ReviewEntry[]) { return JSON.stringify({ version: 1, entradas: entries }); }
function entry(overrides: Partial<DecisionEntry> = {}): DecisionEntry {
  return { id: "importada-1", ocid: "proceso-1", rol: "jefatura", fecha: "2026-11-13T17:00:00Z", tipo: "decision", estado: "justificada", comentario: "Sustento revisado", ...overrides };
}

describe("Historial local que solo agrega entradas", () => {
  it("guarda con id, rol y hora generados y se conserva al recargar", () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage);
    const saved = start(store);
    expect(saved).toEqual({ id: "entrada-1", ocid: "proceso-1", rol: "analista", fecha: "2026-11-13T15:00:00.000Z", tipo: "decision", estado: "en_revision", comentario: "" });
    expect(JSON.parse(storage.getItem(REVIEW_STORAGE_KEY)!)).toEqual({ version: 1, entradas: [saved] });
    expect(new LocalReviewStore({ storage }).listReviews()).toEqual([saved]);
    expect(store.getSnapshot().persistence).toBe("local");
  });

  it("agrega una nueva decisión sin editar la anterior, incluso con la misma hora", () => {
    const store = makeStore();
    const first = start(store);
    const final = store.saveDecision({ ocid: "proceso-1", role: "jefatura", state: "justificada", comment: "  Documentación revisada  " });
    expect(store.listReviews("proceso-1")).toEqual([first, final]);
    expect(first.estado).toBe("en_revision");
    expect(final.comentario).toBe("Documentación revisada");
    expect(store.getState("proceso-1")).toBe("justificada");
    expect(store.getState("otro-proceso")).toBe("sin_revisar");
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(store.listReviews())).toBe(true);
  });

  it("una asignación conserva el estado de la última decisión", () => {
    const store = makeStore();
    start(store);
    const assignment = store.assign({ ocid: "proceso-1", role: "analista", assignedTo: "jefatura", note: "  Contrastar los documentos  " });
    expect(assignment.nota).toBe("Contrastar los documentos");
    expect(store.getState("proceso-1")).toBe("en_revision");
    expect(store.listAssignedTo("jefatura")).toEqual([assignment]);
    expect(store.listAssignedBy("analista")).toEqual([assignment]);
    expect(store.listAssignedTo("analista")).toEqual([]);
  });

  it("la reasignación actualiza las consultas y conserva todo el historial", () => {
    const store = makeStore();
    store.assign({ ocid: "proceso-1", role: "analista", assignedTo: "jefatura", note: "Primera revisión" });
    const current = store.assign({ ocid: "proceso-1", role: "jefatura", assignedTo: "analista", note: "Verificar un documento adicional" });
    expect(store.listAssignedTo("jefatura")).toEqual([]);
    expect(store.listAssignedTo("analista")).toEqual([current]);
    expect(store.listAssignedBy("jefatura")).toEqual([current]);
    expect(store.listReviews()).toHaveLength(2);
    expect(store.getState("proceso-1")).toBe("sin_revisar");
  });

  it("decididos incluye cada caso una sola vez y excluye casos reabiertos", () => {
    const store = makeStore();
    store.saveDecision({ ocid: "proceso-1", role: "analista", state: "justificada", comment: "Sustento revisado" });
    store.saveDecision({ ocid: "proceso-2", role: "analista", state: "requiere_atencion", comment: "Falta revisar un documento" });
    expect(store.listDecided().map((item) => item.ocid)).toEqual(["proceso-1", "proceso-2"]);
    start(store);
    expect(store.listDecided().map((item) => item.ocid)).toEqual(["proceso-2"]);
  });

  it("rechaza decisiones sin comentario antes de guardar", () => {
    const store = makeStore();
    expect(() => store.saveDecision({ ocid: "proceso-1", role: "analista", state: "requiere_atencion", comment: " " })).toThrow("Explica por qué requiere atención");
    expect(() => store.saveDecision({ ocid: "proceso-1", role: "jefatura", state: "justificada" })).toThrow("justificada");
    expect(store.listReviews()).toEqual([]);
  });

  it("el auditor no puede escribir aunque llame directamente al almacén", () => {
    const store = makeStore();
    expect(() => store.saveDecision({ ocid: "proceso-1", role: "auditor", state: "en_revision" })).toThrow("Este rol");
    expect(() => store.assign({ ocid: "proceso-1", role: "auditor", assignedTo: "analista", note: "Revisar" })).toThrow("Este rol");
    expect(() => store.importReviews(file([entry()]), "auditor")).toThrow("Este rol");
    expect(() => store.resetDemo("auditor", true)).toThrow("Este rol");
    expect(store.listReviews()).toEqual([]);
  });

  it("un id repetido no sustituye entradas anteriores", () => {
    const store = new LocalReviewStore({ storage: null, createId: () => "misma-entrada" });
    const first = start(store);
    expect(() => start(store, "proceso-2")).toThrow("identificador nuevo");
    expect(store.listReviews()).toEqual([first]);
  });

  it("los snapshots son estables; suscripciones y desuscripciones reflejan cambios", () => {
    const store = makeStore();
    const listener = vi.fn();
    const initial = store.getSnapshot();
    expect(store.getSnapshot()).toBe(initial);
    const stop = store.subscribe(listener);
    start(store);
    const changed = store.getSnapshot();
    expect(changed).not.toBe(initial);
    expect(store.listReviews()).toEqual(changed.entries);
    expect(store.getSnapshot()).toBe(changed);
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    start(store, "proceso-2");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getServerSnapshot().entries).toEqual([]);
  });

  it("sincroniza cambios de otra instancia antes de escribir", () => {
    const storage = new MemoryStorage();
    const first = makeStore(storage);
    const other = new LocalReviewStore({ storage, createId: () => "otra-entrada" });
    start(first);
    start(other, "proceso-2");
    expect(first.listReviews()).toHaveLength(2);
    expect(other.listReviews()).toHaveLength(2);
    other.resetDemo("jefatura", true);
    first.syncFromStorage();
    expect(first.getSnapshot().entries).toEqual([]);
  });
  it("un error de un suscriptor no se confunde con un fallo de almacenamiento", () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage);
    const stop = store.subscribe(() => { throw new Error("Error del consumidor"); });
    expect(() => start(store)).toThrow("Error del consumidor");
    stop();
    expect(store.getSnapshot().persistence).toBe("local");
    expect(store.getSnapshot().warning).toBeNull();
    expect(new LocalReviewStore({ storage }).getState("proceso-1")).toBe("en_revision");
  });
});

describe("Almacenamiento no disponible", () => {
  it("funciona en memoria y ofrece el aviso para la futura interfaz", () => {
    const store = makeStore(null);
    start(store);
    expect(store.getSnapshot()).toMatchObject({ persistence: "memory", warning: MEMORY_WARNING });
    expect(store.listReviews()).toHaveLength(1);
  });
  it("un fallo de lectura no impide registrar durante la sesión", () => {
    const storage = new MemoryStorage();
    storage.getItem = () => { throw new Error("bloqueado"); };
    const store = makeStore(storage);
    start(store);
    expect(store.getState("proceso-1")).toBe("en_revision");
    expect(store.getSnapshot().warning).toContain("memoria");
  });
  it("un fallo al guardar conserva también las entradas que ya estaban persistidas", () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage);
    start(store);
    storage.setItem = () => { throw new Error("cuota"); };
    start(store, "proceso-2");
    expect(store.listReviews()).toHaveLength(2);
    expect(store.getSnapshot().persistence).toBe("memory");
    expect(store.getSnapshot().warning).toBe(MEMORY_WARNING);
    expect(JSON.parse(store.exportReviews()).entradas).toHaveLength(2);
  });
  it("un archivo guardado dañado no se sobrescribe silenciosamente", () => {
    const storage = new MemoryStorage();
    storage.setItem(REVIEW_STORAGE_KEY, "datos-no-válidos");
    const store = makeStore(storage);
    expect(store.getSnapshot().warning).toContain("recuperar");
    start(store);
    expect(storage.getItem(REVIEW_STORAGE_KEY)).toBe("datos-no-válidos");
    expect(store.listReviews()).toHaveLength(1);
  });
  it("acceder a localStorage puede fallar incluso antes de leer una clave", () => {
    vi.stubGlobal("window", { get localStorage() { throw new Error("bloqueado"); } });
    try {
      const store = new LocalReviewStore();
      expect(store.getSnapshot().persistence).toBe("memory");
      expect(store.getSnapshot().warning).toBe(MEMORY_WARNING);
    } finally { vi.unstubAllGlobals(); }
  });
});

describe("Exportación, importación y reinicio", () => {
  it("exportar e importar dos veces no duplica decisiones ni asignaciones", () => {
    const original = makeStore();
    start(original);
    original.assign({ ocid: "proceso-1", role: "analista", assignedTo: "jefatura", note: "Ver documentos" });
    const exported = original.exportReviews();
    const destination = makeStore();
    expect(destination.importReviews(exported, "jefatura")).toEqual({ added: 2, duplicates: 0 });
    expect(destination.importReviews(exported, "jefatura")).toEqual({ added: 0, duplicates: 2 });
    expect(destination.listReviews()).toEqual(original.listReviews());
  });
  it("una decisión antigua importada no cambia el estado de una posterior", () => {
    const store = makeStore();
    store.importReviews(file([entry()]), "analista");
    store.importReviews(file([entry({ id: "antigua", fecha: "2026-11-12T15:00:00Z", estado: "en_revision", comentario: "" })]), "analista");
    expect(store.getState("proceso-1")).toBe("justificada");
    expect(store.listReviews()[0].id).toBe("antigua");
  });
  it("fusiona duplicados del mismo archivo y rechaza ids con contenido distinto de forma atómica", () => {
    const store = makeStore();
    expect(store.importReviews(file([entry(), entry()]), "analista")).toEqual({ added: 1, duplicates: 1 });
    const before = store.exportReviews();
    expect(() => store.importReviews(file([entry({ id: "nueva" }), entry({ comentario: "Otro sustento" })]), "analista")).toThrow("otro contenido");
    expect(store.exportReviews()).toBe(before);
  });
  it.each([
    "no-es-json", JSON.stringify({ version: 2, entradas: [] }), JSON.stringify({ version: 1, entradas: {} }),
    file([entry({ rol: "auditor" })]), file([entry({ estado: "justificada", comentario: " " })]),
    file([entry({ fecha: "sin-fecha" })]), file([entry({ id: "../otro" })]),
    JSON.stringify({ version: 1, entradas: [{ ...entry(), nombre_usuario: "No debe recolectarse" }] }),
  ])("rechaza un archivo inválido sin importar parcialmente: %s", (json) => {
    const store = makeStore();
    start(store);
    const before = store.exportReviews();
    expect(() => store.importReviews(json, "analista")).toThrow("archivo");
    expect(store.exportReviews()).toBe(before);
  });
  it("reiniciar exige confirmación y solo elimina la clave de revisiones", () => {
    const storage = new MemoryStorage();
    storage.setItem("otra-clave", "conservar");
    const store = makeStore(storage);
    start(store);
    expect(() => store.resetDemo("analista", false)).toThrow("Confirma");
    expect(store.listReviews()).toHaveLength(1);
    store.resetDemo("analista", true);
    expect(store.getState("proceso-1")).toBe("sin_revisar");
    expect(store.listReviews()).toEqual([]);
    expect(storage.getItem(REVIEW_STORAGE_KEY)).toBeNull();
    expect(storage.getItem("otra-clave")).toBe("conservar");
    expect(new LocalReviewStore({ storage }).listReviews()).toEqual([]);
  });
  it("si falla el borrado avisa que los datos persistidos podrían reaparecer", () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage);
    start(store);
    storage.removeItem = () => { throw new Error("bloqueado"); };
    store.resetDemo("jefatura", true);
    expect(store.listReviews()).toEqual([]);
    expect(store.getSnapshot().warning).toContain("reaparecer");
  });
  it("el reinicio confirmado también puede limpiar un archivo dañado que causó el modo memoria", () => {
    const storage = new MemoryStorage();
    storage.setItem(REVIEW_STORAGE_KEY, "archivo-dañado");
    const store = makeStore(storage);
    expect(store.getSnapshot().persistence).toBe("memory");
    store.resetDemo("analista", true);
    expect(storage.getItem(REVIEW_STORAGE_KEY)).toBeNull();
    expect(store.getSnapshot().persistence).toBe("local");
    expect(new LocalReviewStore({ storage }).listReviews()).toEqual([]);
  });
});
