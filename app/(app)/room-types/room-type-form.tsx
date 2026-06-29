"use client";

import { Modal } from "@/components/ui/modal";
import { ResourceForm } from "@/components/ui/resource-form";
import { Button, Field, Input, Textarea } from "@/components/ui/ui";
import { createRoomType } from "./actions";

export function NewRoomTypeButton() {
  return (
    <Modal
      title="Nouveau type de chambre"
      trigger={(open) => <Button onClick={open}>+ Nouveau type</Button>}
    >
      {(close) => (
        <ResourceForm action={createRoomType} close={close}>
          <Field label="Nom" required>
            <Input name="name" required placeholder="Standard, VIP, Suite…" />
          </Field>
          <Field label="Description">
            <Textarea name="description" rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Capacité (pers.)">
              <Input name="max_occupancy" inputMode="numeric" defaultValue={2} />
            </Field>
            <Field label="Prix / nuit (FCFA)" required>
              <Input name="base_price" inputMode="numeric" required placeholder="15000" />
            </Field>
            <Field label="Prix week-end">
              <Input name="weekend_price" inputMode="numeric" />
            </Field>
            <Field label="Prix entreprise">
              <Input name="corporate_price" inputMode="numeric" />
            </Field>
            <Field label="Caution">
              <Input name="deposit" inputMode="numeric" defaultValue={0} />
            </Field>
          </div>
        </ResourceForm>
      )}
    </Modal>
  );
}