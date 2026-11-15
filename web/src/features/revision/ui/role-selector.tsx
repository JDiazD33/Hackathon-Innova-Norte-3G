"use client";

import { UserRound } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { REVIEW_ROLES, ROLE_LABELS } from "../types";
import { isRole } from "../validation";
import { ReviewRoleProvider, useReviewRole } from "./review-role";

const SHORT_LABELS = {
  analista: "Analista",
  jefatura: "Jefatura",
  auditor: "Auditor",
};

export function RoleSelector() {
  return (
    <ReviewRoleProvider>
      <RoleSelectorControl />
    </ReviewRoleProvider>
  );
}

function RoleSelectorControl() {
  const { role, ready, warning, setRole } = useReviewRole();
  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5">
      <Select
        value={role}
        disabled={!ready}
        onValueChange={(value) => {
          if (isRole(value)) setRole(value);
        }}
      >
        <SelectTrigger
          size="sm"
          aria-label={`Rol simulado: ${ROLE_LABELS[role]}`}
          aria-describedby={warning ? "role-storage-warning" : undefined}
        >
          <UserRound aria-hidden="true" className="hidden size-4 lg:block" />
          <SelectValue>{SHORT_LABELS[role]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <p className="px-3 py-2 text-nota text-muted-foreground">
            Roles simulados
          </p>
          {REVIEW_ROLES.map((value) => (
            <SelectItem key={value} value={value}>
              {ROLE_LABELS[value]}
            </SelectItem>
          ))}
          {warning && (
            <p
              id="role-storage-warning"
              role="status"
              className="max-w-64 px-3 py-2 text-nota"
            >
              {warning}
            </p>
          )}
        </SelectContent>
      </Select>
      <span className="text-leyenda text-muted-foreground">
        Roles simulados
      </span>
    </div>
  );
}
