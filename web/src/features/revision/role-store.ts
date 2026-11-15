import { isRole } from "./validation";
import type { ReviewRole } from "./types";

export const ROLE_STORAGE_KEY = "rol:v1";
export interface RoleSnapshot {
  role: ReviewRole;
  ready: boolean;
  warning: string | null;
}

const SERVER_SNAPSHOT: RoleSnapshot = Object.freeze({
  role: "analista",
  ready: false,
  warning: null,
});
const ROLE_MEMORY_WARNING =
  "El rol se conservará solo durante esta sesión porque el navegador no permite guardarlo.";
let snapshot: RoleSnapshot | null = null;
const listeners = new Set<() => void>();

function readRole(): RoleSnapshot {
  try {
    const saved = window.localStorage.getItem(ROLE_STORAGE_KEY);
    return {
      role: isRole(saved) ? saved : "analista",
      ready: true,
      warning: null,
    };
  } catch {
    return {
      role: snapshot?.role ?? "analista",
      ready: true,
      warning: ROLE_MEMORY_WARNING,
    };
  }
}

function publish(next: RoleSnapshot) {
  if (
    snapshot?.role === next.role &&
    snapshot.ready === next.ready &&
    snapshot.warning === next.warning
  )
    return;
  snapshot = Object.freeze(next);
  for (const listener of listeners) listener();
}

export function getRoleSnapshot(): RoleSnapshot {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  if (!snapshot) snapshot = Object.freeze(readRole());
  return snapshot;
}

export const getServerRoleSnapshot = () => SERVER_SNAPSHOT;

export function setReviewRole(role: ReviewRole): void {
  if (!isRole(role)) return;
  let warning: string | null = null;
  try {
    window.localStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch {
    warning = ROLE_MEMORY_WARNING;
  }
  publish({ role, ready: true, warning });
}

function syncRole(event: StorageEvent) {
  if (event.key === ROLE_STORAGE_KEY || event.key === null) publish(readRole());
}

export function subscribeRole(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", syncRole);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", syncRole);
  };
}
