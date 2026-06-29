"use client";

import { Modal } from "@/components/ui/modal";
import { ResourceForm } from "@/components/ui/resource-form";
import { Button, Field, Input, Select } from "@/components/ui/ui";
import { createClientRecord } from "./actions";

export function NewClientButton() {
  return (
    <Modal
      title="Nouveau client"
      trigger={(open) => <Button onClick={open}>+ Nouveau client</Button>}
    >
      {(close) => (
        <ResourceForm action={createClientRecord} close={close}>
          <Field label="Nom complet" required>
            <Input name="name" required placeholder="Dialo Hamadou" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select name="type" defaultValue="individual">
                <option value="individual">Particulier</option>
                <option value="company">Entreprise</option>
                <option value="vip">VIP</option>
                <option value="regular">Régulier</option>
                <option value="agency">Agence</option>
              </Select>
            </Field>
            <Field label="Téléphone">
              <Input name="phone" placeholder="+226 ..." />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type de pièce">
              <Input name="id_doc_type" placeholder="CNIB, passeport…" />
            </Field>
            <Field label="N° de pièce">
              <Input name="id_doc_number" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nationalité">
              <Input name="nationality" placeholder="Burkinabè" />
            </Field>
            <Field label="Entreprise">
              <Input name="company_name" />
            </Field>
          </div>
          <Field label="Email">
            <Input name="email" type="email" />
          </Field>
          <Field label="Adresse">
            <Input name="address" />
          </Field>
        </ResourceForm>
      )}
    </Modal>
  );
}