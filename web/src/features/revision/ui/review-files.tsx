"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatEntero } from "@/lib/format";
import { getReviewStore, useRevisiones } from "@/lib/revisiones";

import { canReview } from "../permissions";
import { getRoleSnapshot } from "../role-store";
import { ReviewError } from "../validation";
import { useReviewRole } from "./review-role";

export function ReviewFiles() {
  const { role, ready } = useReviewRole();
  const { snapshot } = useRevisiones();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();

  function exportFile() {
    const content = getReviewStore().exportReviews();
    const url = URL.createObjectURL(
      new Blob([content], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "prisma-revisiones.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setError("");
    setFeedback("Archivo de revisiones exportado.");
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const content = await file.text();
      const result = getReviewStore().importReviews(
        content,
        getRoleSnapshot().role,
      );
      setError("");
      setFeedback(
        `Importación terminada: ${formatEntero(result.added)} entradas nuevas y ${formatEntero(result.duplicates)} ya existentes.`,
      );
    } catch (cause) {
      setFeedback("");
      setError(
        cause instanceof ReviewError
          ? cause.message
          : "No se pudo leer el archivo de revisiones.",
      );
    }
  }

  function reset() {
    try {
      getReviewStore().resetDemo(getRoleSnapshot().role, true);
      setResetOpen(false);
      setError("");
      setFeedback("Se reiniciaron las revisiones de este navegador.");
    } catch (cause) {
      setError(
        cause instanceof ReviewError
          ? cause.message
          : "No se pudo reiniciar la demostración.",
      );
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={exportFile}
          disabled={!ready}
        >
          <Download aria-hidden="true" className="size-4" />
          Exportar revisiones
        </Button>
        {ready && canReview(role, "import") && (
          <>
            <input
              ref={input}
              id={id}
              type="file"
              accept=".json,application/json"
              onChange={importFile}
              hidden
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => input.current?.click()}
            >
              <Upload aria-hidden="true" className="size-4" />
              Importar revisiones
            </Button>
          </>
        )}
        {ready && canReview(role, "reset") && (
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogTrigger asChild>
              <Button variant="plain">
                <RotateCcw aria-hidden="true" className="size-4" />
                Reiniciar demostración
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Reiniciar las revisiones?</DialogTitle>
                <DialogDescription>
                  Se borrarán las decisiones y asignaciones guardadas en este
                  navegador. Puedes exportarlas antes de continuar. El rol y los
                  datos de contrataciones se conservan.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="plain">Cancelar</Button>
                </DialogClose>
                <Button variant="secondary" onClick={reset}>
                  Reiniciar revisiones
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <p className="text-nota text-muted-foreground">
        El archivo permite trasladar las revisiones manualmente a otro
        navegador.
      </p>
      {feedback && (
        <p role="status" className="text-subtitulo">
          {feedback}
        </p>
      )}
      {error && (
        <p role="alert" className="text-subtitulo">
          {error}
        </p>
      )}
      {snapshot.warning && (
        <p role="status" className="text-subtitulo">
          {snapshot.warning}
        </p>
      )}
    </div>
  );
}
