"use client";

import { Modal, SubmitButton } from "@/components/ui/modal";
import { ResourceForm } from "@/components/ui/resource-form";
import { Button, Field, Input, Select } from "@/components/ui/ui";
import { FORM_IDLE } from "@/lib/forms";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/labels";
import type { Client, Room, Service } from "@/types/db";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  addConsumption,
  addPayment,
  checkOutStay,
  createWalkInStay,
} from "./actions";

export function NewWalkInStayButton({
  availableRooms,
  clients,
}: {
  availableRooms: Room[];
  clients: Client[];
}) {
  return (
    <Modal
      title="Check-in direct (sans réservation)"
      trigger={(open) => <Button onClick={open}>+ Check-in direct</Button>}
    >
      {(close) =>
        availableRooms.length === 0 ? (
          <p className="text-sm text-fs-on-surface-variant">
            Aucune chambre libre.
          </p>
        ) : (
          <ResourceForm
            action={createWalkInStay}
            close={close}
            submitLabel="Check-in"
          >
            <Field label="Chambre" required>
              <Select name="room_id" required defaultValue={availableRooms[0]?.id}>
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Ch. {r.number}
                    {r.room_type?.name ? ` · ${r.room_type.name}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Client">
              <Select name="client_id" defaultValue="">
                <option value="">— (de passage)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tarif / nuit" required>
                <Input name="nightly_rate" inputMode="numeric" required />
              </Field>
              <Field label="Personnes">
                <Input name="guests_count" inputMode="numeric" defaultValue={1} />
              </Field>
            </div>
            <Field label="Départ prévu" required>
              <Input name="expected_check_out" type="date" required />
            </Field>
          </ResourceForm>
        )
      }
    </Modal>
  );
}

export function AddConsumptionButton({
  stayId,
  services,
}: {
  stayId: string;
  services: Service[];
}) {
  return (
    <Modal
      title="Ajouter une consommation"
      trigger={(open) => (
        <Button variant="secondary" className="h-8 px-3 text-xs" onClick={open}>
          + Consommation
        </Button>
      )}
    >
      {(close) => (
        <ConsumptionForm stayId={stayId} services={services} close={close} />
      )}
    </Modal>
  );
}

function ConsumptionForm({
  stayId,
  services,
  close,
}: {
  stayId: string;
  services: Service[];
  close: () => void;
}) {
  const [state, formAction] = useActionState(addConsumption, FORM_IDLE);
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const onDone = useRef(close);
  useEffect(() => {
    onDone.current = close;
  });
  useEffect(() => {
    if (state.ok) onDone.current();
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="stay_id" value={stayId} />
      {services.length > 0 ? (
        <Field label="Service (préremplit)">
          <Select
            defaultValue=""
            onChange={(e) => {
              const svc = services.find((s) => s.id === e.target.value);
              if (svc) {
                setLabel(svc.name);
                setPrice(String(svc.price));
              }
            }}
          >
            <option value="">— Saisie libre</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <Field label="Désignation" required>
        <Input
          name="label"
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Eau minérale, plat…"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prix unitaire" required>
          <Input
            name="unit_price"
            inputMode="numeric"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
        <Field label="Quantité">
          <Input name="quantity" inputMode="numeric" defaultValue={1} />
        </Field>
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
      <SubmitButton>Ajouter</SubmitButton>
    </form>
  );
}

export function AddPaymentButton({ stayId }: { stayId: string }) {
  return (
    <Modal
      title="Encaisser un paiement"
      trigger={(open) => (
        <Button className="h-8 px-3 text-xs" onClick={open}>
          + Paiement
        </Button>
      )}
    >
      {(close) => (
        <ResourceForm action={addPayment} close={close} submitLabel="Encaisser">
          <input type="hidden" name="stay_id" value={stayId} />
          <Field label="Montant" required>
            <Input name="amount" inputMode="numeric" required />
          </Field>
          <Field label="Mode de paiement">
            <Select name="method" defaultValue="cash">
              {PAYMENT_METHOD_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Référence (ID transaction — facultatif)">
            <Input name="reference" placeholder="ID Orange Money, Moov…" />
          </Field>
        </ResourceForm>
      )}
    </Modal>
  );
}

export function CheckOutButton({ stayId }: { stayId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span>
      <Button
        variant="danger"
        className="h-8 px-3 text-xs"
        disabled={busy}
        onClick={async () => {
          if (!confirm("Confirmer le check-out et générer la facture ?")) return;
          setBusy(true);
          setError(null);
          const res = await checkOutStay(stayId);
          setBusy(false);
          if (!res.ok) setError(res.error ?? "Échec.");
        }}
      >
        {busy ? "…" : "Check-out"}
      </Button>
      {error ? (
        <span className="ml-2 text-xs font-medium text-red-600">{error}</span>
      ) : null}
    </span>
  );
}