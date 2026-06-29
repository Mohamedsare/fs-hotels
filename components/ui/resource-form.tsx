"use client";

import { SubmitButton } from "@/components/ui/modal";
import { FORM_IDLE, type FormState } from "@/lib/forms";
import { useActionState, useEffect, useRef } from "react";

/**
 * Formulaire branché sur une Server Action `(prev, formData) => FormState`.
 * Ferme le modal (`close`) quand l'action réussit.
 */
export function ResourceForm({
  action,
  close,
  submitLabel = "Enregistrer",
  children,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  close: () => void;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, FORM_IDLE);
  const onDone = useRef(close);
  useEffect(() => {
    onDone.current = close;
  });

  useEffect(() => {
    if (state.ok) onDone.current();
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      {children}
      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
      <div className="pt-1">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}