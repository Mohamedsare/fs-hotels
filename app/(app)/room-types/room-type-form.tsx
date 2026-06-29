"use client";

import { Modal } from "@/components/ui/modal";
import { ResourceForm } from "@/components/ui/resource-form";
import { editTrigger } from "@/components/ui/row-actions";
import { Button, Field, Input, Textarea } from "@/components/ui/ui";
import type { RoomType } from "@/types/db";
import { createRoomType, updateRoomType } from "./actions";

function numValue(v: number | null | undefined) {
  return v ? String(v) : "";
}

function RoomTypeFields({ t }: { t?: RoomType }) {
  return (
    <>
      <Field label="Nom" required>
        <Input
          name="name"
          required
          placeholder="Standard, VIP, Suite…"
          defaultValue={t?.name ?? ""}
        />
      </Field>
      <Field label="Description">
        <Textarea name="description" rows={2} defaultValue={t?.description ?? ""} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Capacité (pers.)">
          <Input
            name="max_occupancy"
            inputMode="numeric"
            defaultValue={t?.max_occupancy ?? 2}
          />
        </Field>
        <Field label="Prix / nuit (FCFA)" required>
          <Input
            name="base_price"
            inputMode="numeric"
            required
            placeholder="15000"
            defaultValue={numValue(t?.base_price)}
          />
        </Field>
        <Field label="Prix week-end">
          <Input
            name="weekend_price"
            inputMode="numeric"
            defaultValue={numValue(t?.weekend_price)}
          />
        </Field>
        <Field label="Prix entreprise">
          <Input
            name="corporate_price"
            inputMode="numeric"
            defaultValue={numValue(t?.corporate_price)}
          />
        </Field>
        <Field label="Caution">
          <Input
            name="deposit"
            inputMode="numeric"
            defaultValue={t?.deposit ?? 0}
          />
        </Field>
      </div>
    </>
  );
}

export function NewRoomTypeButton() {
  return (
    <Modal
      title="Nouveau type de chambre"
      trigger={(open) => <Button onClick={open}>+ Nouveau type</Button>}
    >
      {(close) => (
        <ResourceForm action={createRoomType} close={close}>
          <RoomTypeFields />
        </ResourceForm>
      )}
    </Modal>
  );
}

export function EditRoomTypeButton({ roomType }: { roomType: RoomType }) {
  return (
    <Modal title="Modifier le type" trigger={editTrigger}>
      {(close) => (
        <ResourceForm
          action={updateRoomType.bind(null, roomType.id)}
          close={close}
          successMessage="Type mis à jour."
        >
          <RoomTypeFields t={roomType} />
        </ResourceForm>
      )}
    </Modal>
  );
}
