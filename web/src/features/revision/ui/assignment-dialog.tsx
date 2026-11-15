"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { UserRoundPlus } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getReviewStore } from "@/lib/revisiones";

import { canReview } from "../permissions";
import { REVIEW_ROLES, ROLE_LABELS, type ReviewRole } from "../types";
import { isRole, ReviewError, validateAssignment } from "../validation";
import { useReviewRole } from "./review-role";

export function AssignmentDialog({
  ocid,
  title,
}: {
  ocid: string;
  title?: string;
}) {
  const { role, ready } = useReviewRole();
  if (!ready || !canReview(role, "assign")) return null;
  return (
    <AssignmentForm
      key={`${ocid}-${role}`}
      ocid={ocid}
      title={title}
      role={role}
    />
  );
}

function AssignmentForm({
  ocid,
  title,
  role,
}: {
  ocid: string;
  title?: string;
  role: ReviewRole;
}) {
  const [open, setOpen] = useState(false);
  const [assignedTo, setAssignedTo] = useState<ReviewRole>(
    role === "analista" ? "jefatura" : "analista",
  );
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});
  const [feedback, setFeedback] = useState("");
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { ocid, role, assignedTo, note };
    const result = validateAssignment(input);
    setErrors(result.errors);
    if (!result.valid) {
      if (result.errors.note) noteRef.current?.focus();
      return;
    }
    try {
      getReviewStore().assign(input);
      setFeedback(`Caso asignado a ${ROLE_LABELS[assignedTo]}.`);
      setOpen(false);
      setNote("");
    } catch (error) {
      setErrors({
        form:
          error instanceof ReviewError
            ? error.message
            : "No se pudo asignar el caso.",
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
          <Button variant="outline">
            <UserRoundPlus aria-hidden="true" className="size-4" />
            Asignar caso
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar caso</DialogTitle>
            <DialogDescription>
              {title ?? "Indica qué debe revisar el rol destinatario."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${id}-role`}>Asignar a</Label>
              <Select
                value={assignedTo}
                onValueChange={(value) => {
                  if (isRole(value)) setAssignedTo(value);
                }}
              >
                <SelectTrigger id={`${id}-role`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_ROLES.filter((value) => value !== role).map(
                    (value) => (
                      <SelectItem key={value} value={value}>
                        {ROLE_LABELS[value]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              {errors.assignedTo && <p role="alert">{errors.assignedTo}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-note`}>
                Nota para el rol destinatario
              </Label>
              <Textarea
                ref={noteRef}
                id={`${id}-note`}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                required
                aria-invalid={Boolean(errors.note)}
                aria-describedby={errors.note ? `${id}-note-error` : undefined}
                className="aria-invalid:border-ring aria-invalid:ring-ring/20"
              />
              {errors.note && (
                <p id={`${id}-note-error`} role="alert">
                  {errors.note}
                </p>
              )}
              <p className="text-nota text-muted-foreground">
                Describe la revisión pendiente sin incluir datos personales.
              </p>
            </div>
            {errors.form && <p role="alert">{errors.form}</p>}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="plain">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Asignar</Button>
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
