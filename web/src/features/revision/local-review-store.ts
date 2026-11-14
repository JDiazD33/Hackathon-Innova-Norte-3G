import { EMPTY_REVIEW_SNAPSHOT } from "./empty-review-store";
import { canReview } from "./permissions";
import type { ReviewStore } from "./review-store";
import { assignedBy, assignedTo, chronologicalEntries, decidedCases, getReviewState } from "./selectors";
import type {
  AssignmentEntry, AssignmentInput, DecisionEntry, DecisionInput, ImportResult,
  ReviewEntry, ReviewRole, ReviewSnapshot, ReviewStorage,
} from "./types";
import { assertValid, parseReviewFile, ReviewError, validateAssignment, validateDecision } from "./validation";

export const REVIEW_STORAGE_KEY = "revisiones:v1";
export const MEMORY_WARNING = "No se pueden guardar las revisiones en este navegador. Se conservarán en memoria durante esta sesión y se perderán al cerrar la pestaña.";

export interface LocalReviewStoreOptions {
  storage?: ReviewStorage | null;
  now?: () => Date;
  createId?: () => string;
}

function browserStorage(): ReviewStorage | null {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
}

function mergeEntries(existing: readonly ReviewEntry[], incoming: readonly ReviewEntry[]) {
  const byId = new Map(existing.map((entry) => [entry.id, entry]));
  let added = 0;
  for (const entry of incoming) {
    const previous = byId.get(entry.id);
    if (previous) {
      if (JSON.stringify(previous) !== JSON.stringify(entry)) {
        throw new ReviewError("conflict", "Un identificador ya existe con otro contenido. No se modificó el historial.");
      }
    } else {
      byId.set(entry.id, entry);
      added++;
    }
  }
  return { entries: chronologicalEntries([...byId.values()]), added, duplicates: incoming.length - added };
}

export class LocalReviewStore implements ReviewStore {
  private storage: ReviewStorage | null;
  private readonly initialStorage: ReviewStorage | null;
  private snapshot: ReviewSnapshot = EMPTY_REVIEW_SNAPSHOT;
  private listeners = new Set<() => void>();
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(options: LocalReviewStoreOptions = {}) {
    this.storage = options.storage === undefined ? browserStorage() : options.storage;
    this.initialStorage = this.storage;
    this.now = options.now ?? (() => new Date());
    this.createId = options.createId ?? (() => crypto.randomUUID());
    if (this.storage) this.syncFromStorage();
    else this.publish([], "memory", MEMORY_WARNING);
  }

  private publish(entries: readonly ReviewEntry[], persistence: ReviewSnapshot["persistence"], warning: string | null) {
    if (persistence === this.snapshot.persistence && warning === this.snapshot.warning &&
      JSON.stringify(entries) === JSON.stringify(this.snapshot.entries)) return;
    this.snapshot = Object.freeze({ entries: Object.freeze([...entries]), persistence, warning });
    for (const listener of this.listeners) listener();
  }

  private persist(entries: readonly ReviewEntry[]) {
    if (this.storage) {
      try {
        this.storage.setItem(REVIEW_STORAGE_KEY, JSON.stringify({ version: 1, entradas: entries }));
      } catch { this.storage = null; }
      if (this.storage) {
        this.publish(entries, "local", null);
        return;
      }
    }
    this.publish(entries, "memory", MEMORY_WARNING);
  }

  syncFromStorage = (): void => {
    if (!this.storage) return;
    let entries: readonly ReviewEntry[];
    try {
      const json = this.storage.getItem(REVIEW_STORAGE_KEY);
      entries = json === null ? [] : mergeEntries([], parseReviewFile(json)).entries;
    } catch {
      this.storage = null;
      this.publish(this.snapshot.entries, "memory", `No se pudieron recuperar las revisiones guardadas. ${MEMORY_WARNING}`);
      return;
    }
    this.publish(entries, "local", null);
  };

  getSnapshot = (): ReviewSnapshot => this.snapshot;
  getServerSnapshot = (): ReviewSnapshot => EMPTY_REVIEW_SNAPSHOT;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  listReviews(ocid?: string): readonly ReviewEntry[] {
    this.syncFromStorage();
    return ocid === undefined ? this.snapshot.entries : Object.freeze(this.snapshot.entries.filter((entry) => entry.ocid === ocid));
  }

  getState(ocid: string) { return getReviewState(this.listReviews(), ocid); }
  listAssignedTo(role: ReviewRole) { return assignedTo(this.listReviews(), role); }
  listAssignedBy(role: ReviewRole) { return assignedBy(this.listReviews(), role); }
  listDecided() { return decidedCases(this.listReviews()); }

  private append<T extends ReviewEntry>(build: (id: string, date: string) => T): T {
    this.syncFromStorage();
    const id = this.createId();
    if (this.snapshot.entries.some((entry) => entry.id === id)) throw new ReviewError("conflict", "No se pudo generar un identificador nuevo para la revisión.");
    const entry = build(id, this.now().toISOString());
    // Se aplica el mismo contrato a las escrituras y a los archivos importados.
    const validated = parseReviewFile(JSON.stringify({ version: 1, entradas: [entry] }))[0] as T;
    const entries = chronologicalEntries([...this.snapshot.entries, validated]);
    this.persist(entries);
    return validated;
  }

  saveDecision(input: DecisionInput): DecisionEntry {
    assertValid(validateDecision(input));
    return this.append((id, fecha) => ({
      id, ocid: input.ocid, rol: input.role, fecha, tipo: "decision",
      estado: input.state, comentario: input.comment?.trim() ?? "",
    }));
  }

  assign(input: AssignmentInput): AssignmentEntry {
    assertValid(validateAssignment(input));
    return this.append((id, fecha) => ({
      id, ocid: input.ocid, rol: input.role, fecha, tipo: "asignacion",
      asignado_a: input.assignedTo, nota: input.note.trim(),
    }));
  }

  exportReviews(): string { return JSON.stringify({ version: 1, entradas: this.listReviews() }, null, 2); }

  importReviews(json: string, role: ReviewRole): ImportResult {
    if (!canReview(role, "import")) throw new ReviewError("permission", "Este rol no puede importar revisiones.");
    const incoming = parseReviewFile(json);
    this.syncFromStorage();
    const merged = mergeEntries(this.snapshot.entries, incoming);
    if (merged.added > 0) this.persist(merged.entries);
    return { added: merged.added, duplicates: merged.duplicates };
  }

  resetDemo(role: ReviewRole, confirmed: boolean): void {
    if (!canReview(role, "reset")) throw new ReviewError("permission", "Este rol no puede reiniciar la demostración.");
    if (confirmed !== true) throw new ReviewError("confirmation-required", "Confirma que deseas borrar las revisiones de la demostración.");
    const storage = this.storage ?? this.initialStorage;
    if (storage) {
      try {
        storage.removeItem(REVIEW_STORAGE_KEY);
      } catch {
        this.storage = null;
        this.publish([], "memory", "No se pudo borrar el almacenamiento del navegador. Las revisiones guardadas podrían reaparecer al recargar; esta sesión se reinició en memoria.");
        return;
      }
      this.storage = storage;
      this.publish([], "local", null);
      return;
    }
    this.publish([], "memory", MEMORY_WARNING);
  }
}
