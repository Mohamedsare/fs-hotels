"use client";

import { Modal } from "@/components/ui/modal";
import { ResourceForm } from "@/components/ui/resource-form";
import { Button, Field, Input, Select } from "@/components/ui/ui";
import { ROOM_STATUS } from "@/lib/labels";
import type { RoomStatus, RoomType } from "@/types/db";
import { useState } from "react";
import { createRoom, setRoomStatus } from "./actions";

export function NewRoomButton({ roomTypes }: { roomTypes: RoomType[] }) {
  return (
    <Modal
      title="Nouvelle chambre"
      trigger={(open) => <Button onClick={open}>+ Nouvelle chambre</Button>}
    >
      {(close) => (
        <ResourceForm action={createRoom} close={close}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Numéro" required>
              <Input name="number" required placeholder="204" />
            </Field>
            <Field label="Étage">
              <Input name="floor" placeholder="2" />
            </Field>
          </div>
          <Field label="Type de chambre">
            <Select name="room_type_id" defaultValue="">
              <option value="">—</option>
              {roomTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Note">
            <Input name="note" />
          </Field>
        </ResourceForm>
      )}
    </Modal>
  );
}

const STATUS_CHOICES: RoomStatus[] = [
  "available",
  "occupied",
  "dirty",
  "cleaning",
  "clean",
  "maintenance",
  "blocked",
];

/** Sélecteur rapide de statut sur chaque chambre. */
export function RoomStatusSelect({
  id,
  status,
}: {
  id: string;
  status: RoomStatus;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Select
      value={status}
      disabled={busy}
      onChange={async (e) => {
        setBusy(true);
        await setRoomStatus(id, e.target.value as RoomStatus);
        setBusy(false);
      }}
      className="h-8 py-0 text-xs"
    >
      {STATUS_CHOICES.map((s) => (
        <option key={s} value={s}>
          {ROOM_STATUS[s].label}
        </option>
      ))}
    </Select>
  );
}