"use client";

import { Modal } from "@/components/ui/modal";
import { ResourceForm } from "@/components/ui/resource-form";
import { Button, Field, Input, Select } from "@/components/ui/ui";
import type { Client, Room, RoomType } from "@/types/db";
import { useState } from "react";
import {
  checkInReservation,
  createReservation,
  setReservationStatus,
} from "./actions";

export function NewReservationButton({
  clients,
  roomTypes,
}: {
  clients: Client[];
  roomTypes: RoomType[];
}) {
  return (
    <Modal
      title="Nouvelle réservation"
      trigger={(open) => <Button onClick={open}>+ Nouvelle réservation</Button>}
    >
      {(close) => (
        <ResourceForm action={createReservation} close={close}>
          <Field label="Client">
            <Select name="client_id" defaultValue="">
              <option value="">— (sans client)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` · ${c.phone}` : ""}
                </option>
              ))}
            </Select>
          </Field>
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Arrivée" required>
              <Input name="check_in_date" type="date" required />
            </Field>
            <Field label="Départ" required>
              <Input name="check_out_date" type="date" required />
            </Field>
            <Field label="Personnes">
              <Input name="guests_count" inputMode="numeric" defaultValue={1} />
            </Field>
            <Field label="Prix négocié / nuit">
              <Input name="agreed_rate" inputMode="numeric" />
            </Field>
            <Field label="Avance payée">
              <Input name="advance_paid" inputMode="numeric" defaultValue={0} />
            </Field>
            <Field label="Source">
              <Input name="source" placeholder="Téléphone, WhatsApp…" />
            </Field>
          </div>
        </ResourceForm>
      )}
    </Modal>
  );
}

export function CheckInButton({
  reservationId,
  availableRooms,
}: {
  reservationId: string;
  availableRooms: Room[];
}) {
  return (
    <Modal
      title="Check-in — attribuer une chambre"
      trigger={(open) => (
        <Button onClick={open} className="h-8 px-3 text-xs">
          Check-in
        </Button>
      )}
    >
      {(close) => (
        <CheckInForm
          reservationId={reservationId}
          availableRooms={availableRooms}
          close={close}
        />
      )}
    </Modal>
  );
}

function CheckInForm({
  reservationId,
  availableRooms,
  close,
}: {
  reservationId: string;
  availableRooms: Room[];
  close: () => void;
}) {
  const [roomId, setRoomId] = useState(availableRooms[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (availableRooms.length === 0)
    return (
      <p className="text-sm text-fs-on-surface-variant">
        Aucune chambre libre. Libérez ou nettoyez une chambre d&apos;abord.
      </p>
    );

  return (
    <div className="space-y-3">
      <Field label="Chambre à attribuer" required>
        <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
          {availableRooms.map((r) => (
            <option key={r.id} value={r.id}>
              Ch. {r.number}
              {r.room_type?.name ? ` · ${r.room_type.name}` : ""}
            </option>
          ))}
        </Select>
      </Field>
      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : null}
      <Button
        disabled={busy || !roomId}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const res = await checkInReservation(reservationId, roomId);
          setBusy(false);
          if (res.ok) close();
          else setError(res.error ?? "Échec du check-in.");
        }}
      >
        {busy ? "…" : "Confirmer le check-in"}
      </Button>
    </div>
  );
}

export function ReservationActions({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        className="h-8 px-3 text-xs"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await setReservationStatus(id, "cancelled");
          setBusy(false);
        }}
      >
        Annuler
      </Button>
    </div>
  );
}