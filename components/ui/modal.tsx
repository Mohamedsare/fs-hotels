"use client";

import { Button } from "@/components/ui/ui";
import { useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Modal contrôlé avec render-prop : `children` reçoit `close` pour fermer
 * après soumission réussie.
 */
export function Modal({
  trigger,
  title,
  children,
}: {
  trigger: (open: () => void) => React.ReactNode;
  title: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {trigger(() => setOpen(true))}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-fs-card shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
              <h2 className="text-base font-bold">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-xl leading-none hover:bg-fs-surface-container"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {children(() => setOpen(false))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function SubmitButton({
  children = "Enregistrer",
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? "…" : children}
    </Button>
  );
}