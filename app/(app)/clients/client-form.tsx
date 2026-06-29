"use client";

import { Modal } from "@/components/ui/modal";
import { ResourceForm } from "@/components/ui/resource-form";
import { editTrigger } from "@/components/ui/row-actions";
import { Button, Field, Input, Select } from "@/components/ui/ui";
import type { Client } from "@/types/db";
import { createClientRecord, updateClientRecord } from "./actions";

function ClientFields({ c }: { c?: Client }) {
  return (
    <>
      <Field label="Nom complet" required>
        <Input
          name="name"
          required
          placeholder="Dialo Hamadou"
          defaultValue={c?.name ?? ""}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <Select name="type" defaultValue={c?.type ?? "individual"}>
            <option value="individual">Particulier</option>
            <option value="company">Entreprise</option>
            <option value="vip">VIP</option>
            <option value="regular">Régulier</option>
            <option value="agency">Agence</option>
          </Select>
        </Field>
        <Field label="Téléphone">
          <Input name="phone" placeholder="+226 ..." defaultValue={c?.phone ?? ""} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type de pièce">
          <Input
            name="id_doc_type"
            placeholder="CNIB, passeport…"
            defaultValue={c?.id_doc_type ?? ""}
          />
        </Field>
        <Field label="N° de pièce">
          <Input name="id_doc_number" defaultValue={c?.id_doc_number ?? ""} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nationalité">
          <Input
            name="nationality"
            placeholder="Burkinabè"
            defaultValue={c?.nationality ?? ""}
          />
        </Field>
        <Field label="Entreprise">
          <Input name="company_name" defaultValue={c?.company_name ?? ""} />
        </Field>
      </div>
      <Field label="Email">
        <Input name="email" type="email" defaultValue={c?.email ?? ""} />
      </Field>
      <Field label="Adresse">
        <Input name="address" defaultValue={c?.address ?? ""} />
      </Field>
    </>
  );
}

export function NewClientButton() {
  return (
    <Modal
      title="Nouveau client"
      trigger={(open) => <Button onClick={open}>+ Nouveau client</Button>}
    >
      {(close) => (
        <ResourceForm action={createClientRecord} close={close}>
          <ClientFields />
        </ResourceForm>
      )}
    </Modal>
  );
}

export function EditClientButton({ client }: { client: Client }) {
  return (
    <Modal title="Modifier le client" trigger={editTrigger}>
      {(close) => (
        <ResourceForm
          action={updateClientRecord.bind(null, client.id)}
          close={close}
          successMessage="Client mis à jour."
        >
          <ClientFields c={client} />
        </ResourceForm>
      )}
    </Modal>
  );
}
