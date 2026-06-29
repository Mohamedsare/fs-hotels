"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/ui";
import { useToast } from "@/components/ui/toast";
import { frError } from "@/lib/errors";
import type { FormState } from "@/lib/forms";

/** Conteneur d'actions de ligne (aligné à droite, icônes serrées). */
export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>;
}

/** Déclencheur "crayon" réutilisable pour les modales d'édition. */
export function editTrigger(open: () => void) {
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Modifier"
      title="Modifier"
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-fs-on-surface-variant transition-colors hover:bg-fs-surface-container hover:text-fs-text"
    >
      <Pencil className="h-[17px] w-[17px]" />
    </button>
  );
}

/**
 * Bouton "corbeille" + confirmation. `action` est une Server Action déjà liée
 * à l'identifiant (`deleteX.bind(null, id)`), renvoyant un FormState.
 */
export function DeleteButton({
  action,
  itemLabel,
}: {
  action: () => Promise<FormState>;
  itemLabel: string;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      title="Confirmer la suppression"
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          aria-label={`Supprimer ${itemLabel}`}
          title="Supprimer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-fs-on-surface-variant transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-[17px] w-[17px]" />
        </button>
      )}
    >
      {(close) => (
        <div className="space-y-4">
          <p className="text-sm text-fs-text">
            Supprimer <span className="font-semibold">{itemLabel}</span> ? Cette
            action est irréversible.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close} disabled={busy}>
              Annuler
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const res = await action();
                setBusy(false);
                if (res.ok) {
                  toast.success("Supprimé.");
                  close();
                } else {
                  toast.error(frError(res.error));
                }
              }}
            >
              {busy ? "…" : "Supprimer"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
