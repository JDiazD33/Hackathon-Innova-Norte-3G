"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { Check, Clock3, Flag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ControlSegmentado } from "@/components/ui/control-segmentado";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getReviewStore, useRevisiones } from "@/lib/revisiones";

import { canReview } from "../permissions";
import {
  DECISION_STATES,
  ROLE_LABELS,
  STATE_LABELS,
  type DecisionState,
} from "../types";
import { validateDecision } from "../validation";
import { useReviewRole } from "./review-role";

const STATE_ICONS = {
  en_revision: Clock3,
  justificada: Check,
  requiere_atencion: Flag,
};

interface DecisionDialogProps {
  ocid: string;
  title?: string;
  variant?: "default" | "outline";
}

export function DecisionDialog(props: DecisionDialogProps) {
  const { role, ready } = useReviewRole();
  if (!ready || !canReview(role, "decide")) return null;
  return <DecisionForm key={`${props.ocid}-${role}`} {...props} role={role} />;
}

function DecisionForm({
  ocid,
  title,
  variant = "default",
  role,
}: DecisionDialogProps & { role: import("../types").ReviewRole }) {
  const { snapshot } = useRevisiones();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<DecisionState>("en_revision");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});
  const [feedback, setFeedback] = useState("");
  const id = useId();
  const commentRef = useRef<HTMLTextAreaElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { ocid, role, state, comment };
    const result = validateDecision(input);
    setErrors(result.errors);
    if (!result.valid) {
      if (result.errors.comment) commentRef.current?.focus();
      return;
    }
    try {
      getReviewStore().saveDecision(input);
      setFeedback(`Revisión registrada: ${STATE_LABELS[state]}.`);
      setOpen(false);
      setComment("");
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "No se pudo registrar la revisión.",
      });
    }
  }

  return (
    <div className="space-y-2">
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          setErrors({});
        }}
      >
        <DialogTrigger asChild>
          <Button variant={variant}>Registrar revisión</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar revisión</DialogTitle>
            <DialogDescription>
              {title ?? "Deja constancia de tu decisión sobre este proceso."} ·{" "}
              {ROLE_LABELS[role]} · Rol simulado
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} noValidate className="space-y-5">
            <fieldset className="min-w-0 space-y-3">
              <legend className="mb-2 text-subtitulo font-medium">
                Estado de la revisión
              </legend>
              <ControlSegmentado
                etiqueta="Estado de la revisión"
                valor={state}
                onChange={setState}
                className="h-auto w-full flex-wrap gap-1 p-1"
                opciones={DECISION_STATES.map((value) => {
                  const Icon = STATE_ICONS[value];
                  return {
                    valor: value,
                    etiqueta: (
                      <span className="flex flex-col items-center gap-1 py-2 text-leyenda sm:flex-row sm:text-subtitulo">
                        <Icon aria-hidden="true" className="size-4" />
                        <span className="whitespace-normal text-center">
                          {STATE_LABELS[value]}
                        </span>
                      </span>
                    ),
                  };
                })}
              />
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor={`${id}-comment`}>
                Comentario{" "}
                {state === "en_revision" ? "(opcional)" : "(obligatorio)"}
              </Label>
              <Textarea
                ref={commentRef}
                id={`${id}-comment`}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                required={state !== "en_revision"}
                aria-invalid={Boolean(errors.comment)}
                aria-describedby={`${id}-help${errors.comment ? ` ${id}-error` : ""}`}
                className="aria-invalid:border-ring aria-invalid:ring-ring/20"
              />
              <p id={`${id}-help`} className="text-nota text-muted-foreground">
                Indica el documento o enlace consultado, qué contrastaste y por
                qué sustenta tu decisión. Si falta evidencia, describe la
                revisión pendiente. No incluyas datos personales.
              </p>
              {errors.comment && (
                <p id={`${id}-error`} role="alert" className="text-subtitulo">
                  {errors.comment}
                </p>
              )}
            </div>
            {errors.form && <p role="alert">{errors.form}</p>}
            {snapshot.warning && (
              <p role="status" className="text-nota text-muted-foreground">
                {snapshot.warning}
              </p>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="plain">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Registrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {feedback && (
        <p role="status" className="text-subtitulo text-muted-foreground">
          {feedback}
        </p>
      )}
    </div>
  );
}
