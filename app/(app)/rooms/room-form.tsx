"use client";

import { Modal } from "@/components/ui/modal";
import { ResourceForm } from "@/components/ui/resource-form";
import { editTrigger } from "@/components/ui/row-actions";
import { Button, Field, Input, Select } from "@/components/ui/ui";
import { ROOM_STATUS } from "@/lib/labels";
import type { Room, RoomStatus, RoomType } from "@/types/db";
import { useState } from "react";
import { createRoom, setRoomStatus, updateRoom } from "./actions";

function RoomFields({
  roomTypes,
  room,
}: {
  roomTypes: RoomType[];
  room?: Room;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Numéro" required>
          <Input
            name="number"
            required
            placeholder="204"
            defaultValue={room?.number ?? ""}
          />
        </Field>
        <Field label="Étage">
          <Input name="floor" placeholder="2" defaultValue={room?.floor ?? ""} />
        </Field>
      </div>
      <Field label="Type de chambre">
        <Select name="room_type_id" defaultValue={room?.room_type_id ?? ""}>
          <option value="">—</option>
          {roomTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Note">
        <Input name="note" defaultValue={room?.note ?? ""} />
      </Field>
    </>
  );
}

export function NewRoomButton({ roomTypes }: { roomTypes: RoomType[] }) {
  return (
    <Modal
      title="Nouvelle chambre"
      trigger={(open) => <Button onClick={open}>+ Nouvelle chambre</Button>}
    >
      {(close) => (
        <ResourceForm action={createRoom} close={close}>
          <RoomFields roomTypes={roomTypes} />
        </ResourceForm>
      )}
    </Modal>
  );
}

export function EditRoomButton({
  room,
  roomTypes,
}: {
  room: Room;
  roomTypes: RoomType[];
}) {
  return (
    <Modal title={`Modifier la chambre ${room.number}`} trigger={editTrigger}>
      {(close) => (
        <ResourceForm
          action={updateRoom.bind(null, room.id)}
          close={close}
          successMessage="Chambre mise à jour."
        >
          <RoomFields roomTypes={roomTypes} room={room} />
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