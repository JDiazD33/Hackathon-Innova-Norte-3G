"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  getRoleSnapshot,
  getServerRoleSnapshot,
  setReviewRole,
  subscribeRole,
  type RoleSnapshot,
} from "../role-store";

const RoleContext = createContext<RoleSnapshot | null>(null);

/** Las islas de interfaz comparten el mismo rol, sin requerir cambios en la estructura común. */
export function ReviewRoleProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeRole,
    getRoleSnapshot,
    getServerRoleSnapshot,
  );
  return <RoleContext value={snapshot}>{children}</RoleContext>;
}

export function useReviewRole() {
  const context = useContext(RoleContext);
  const shared = useSyncExternalStore(
    subscribeRole,
    getRoleSnapshot,
    getServerRoleSnapshot,
  );
  return { ...(context ?? shared), setRole: setReviewRole };
}
