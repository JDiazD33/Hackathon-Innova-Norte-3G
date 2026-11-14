import { useCallback, useSyncExternalStore } from "react";

import {
  EmptyReviewStore,
  getReviewState,
  LocalReviewStore,
  type ReviewSnapshot,
  type ReviewState,
  type ReviewStore,
} from "@/features/revision";

/*
 * Conexión de la interfaz con el almacén de revisiones del Lote D. Hay un único almacén
 * por pestaña; en el servidor se usa uno vacío y nunca se guarda nada.
 * Solo se importa desde componentes cliente.
 */

const almacenVacio = new EmptyReviewStore();
let almacenDelNavegador: ReviewStore | null = null;

export function getReviewStore(): ReviewStore {
  if (typeof window === "undefined") return almacenVacio;
  if (!almacenDelNavegador) {
    const almacen = new LocalReviewStore();
    // Si otra pestaña registra una revisión, esta pestaña se actualiza.
    window.addEventListener("storage", () => almacen.syncFromStorage());
    almacenDelNavegador = almacen;
  }
  return almacenDelNavegador;
}

const suscribir = (aviso: () => void) => getReviewStore().subscribe(aviso);
const leer = () => getReviewStore().getSnapshot();
const leerEnServidor = () => almacenVacio.getServerSnapshot();

/** Revisiones de este navegador y una función para consultar el estado de un proceso. */
export function useRevisiones(): { snapshot: ReviewSnapshot; estadoDe: (ocid: string) => ReviewState } {
  const snapshot = useSyncExternalStore(suscribir, leer, leerEnServidor);
  const estadoDe = useCallback((ocid: string) => getReviewState(snapshot.entries, ocid), [snapshot]);
  return { snapshot, estadoDe };
}
