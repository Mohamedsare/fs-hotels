"use client";

import { SubmitButton } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { FORM_IDLE, type FormState } from "@/lib/forms";
import { frError } from "@/lib/errors";
import { useActionState, useEffect, useRef } from "react";

/**
 * Formulaire branché sur une Server Action `(prev, formData) => FormState`.
 * Affiche un toast (succès / erreur traduite) et ferme le modal en cas de succès.
 */
export function ResourceForm({
  action,
  close,
  submitLabel = "Enregistrer",
  successMessage = "Enregistré.",
  children,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  close: () => void;
  submitLabel?: string;
  successMessage?: string;
  children: React.ReactNode;
}) {
  const toast = useToast();
  const [state, formAction] = useActionState(action, FORM_IDLE);

  const onDone = useRef(close);
  useEffect(() => {
    onDone.current = close;
  });

  const processed = useRef<FormState>(FORM_IDLE);
  useEffect(() => {
    if (state === processed.current) return;
    processed.current = state;
    if (state.ok) {
      toast.success(successMessage);
      onDone.current();
    } else if (state.error) {
      toast.error(frError(state.error));
    }
  }, [state, toast, successMessage]);

  return (
    <form action={formAction} className="space-y-3">
      {children}
      <div className="pt-1">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
