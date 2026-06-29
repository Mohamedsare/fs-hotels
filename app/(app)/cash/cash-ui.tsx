"use client";

import { Modal } from "@/components/ui/modal";
import { ResourceForm } from "@/components/ui/resource-form";
import { Button, Field, Input, Select } from "@/components/ui/ui";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/labels";
import { addExpense } from "./actions";

export function NewExpenseButton() {
  return (
    <Modal
      title="Nouvelle dépense"
      trigger={(open) => (
        <Button variant="secondary" onClick={open}>
          + Dépense
        </Button>
      )}
    >
      {(close) => (
        <ResourceForm
          action={addExpense}
          close={close}
          successMessage="Dépense enregistrée."
        >
          <Field label="Libellé" required>
            <Input name="label" required placeholder="Achat savon…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Montant" required>
              <Input name="amount" inputMode="numeric" required />
            </Field>
            <Field label="Mode">
              <Select name="method" defaultValue="cash">
                {PAYMENT_METHOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </ResourceForm>
      )}
    </Modal>
  );
}