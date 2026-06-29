"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ResourceForm } from "@/components/ui/resource-form";
import { DeleteButton, editTrigger } from "@/components/ui/row-actions";
import { Button, Field, Input, Select } from "@/components/ui/ui";
import {
  ASSIGNABLE_ROLES,
  MODULE_LABELS,
  MODULES,
} from "@/lib/permissions";
import type { HotelUser } from "@/types/db";
import { addStaff, removeStaff, updateStaff } from "./actions";

function StaffFields({ member }: { member?: HotelUser }) {
  const [role, setRole] = useState<string>(member?.role ?? "employee");
  return (
    <>
      <Field label="Rôle" required>
        <Select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </Field>

      {role === "employee" ? (
        <div>
          <div className="mb-1.5 text-sm font-medium">Accès autorisés</div>
          <div className="grid grid-cols-2 gap-1.5">
            {MODULES.map((mod) => (
              <label
                key={mod}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-fs-surface-container"
              >
                <input
                  type="checkbox"
                  name={`perm_${mod}`}
                  defaultChecked={member?.permissions?.includes(mod)}
                  className="h-4 w-4 accent-fs-accent"
                />
                {MODULE_LABELS[mod]}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-fs-on-surface-variant">
            Le gérant et l&apos;admin disposent de tous les accès.
          </p>
        </div>
      ) : (
        <p className="text-xs text-fs-on-surface-variant">
          {role === "owner"
            ? "Accès complet : paramètres, personnel, suppressions."
            : "Exploitation complète, sauf suppressions définitives, personnel et paramètres."}
        </p>
      )}
    </>
  );
}

export function NewStaffButton() {
  return (
    <Modal
      title="Ajouter un membre"
      trigger={(open) => (
        <Button onClick={open}>
          <UserPlus className="h-4 w-4" /> Ajouter un membre
        </Button>
      )}
    >
      {(close) => (
        <ResourceForm
          action={addStaff}
          close={close}
          submitLabel="Ajouter"
          successMessage="Membre ajouté."
        >
          <Field label="E-mail du membre" required>
            <Input
              name="email"
              type="email"
              required
              placeholder="membre@exemple.com"
            />
          </Field>
          <StaffFields />
          <p className="text-xs text-fs-on-surface-variant">
            La personne doit déjà avoir créé son compte FasoStock Hôtels.
          </p>
        </ResourceForm>
      )}
    </Modal>
  );
}

export function EditStaffButton({ member }: { member: HotelUser }) {
  return (
    <Modal title="Modifier le membre" trigger={editTrigger}>
      {(close) => (
        <ResourceForm
          action={updateStaff.bind(null, member.id)}
          close={close}
          successMessage="Membre mis à jour."
        >
          <StaffFields member={member} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={member.active}
              className="h-4 w-4 accent-fs-accent"
            />
            Compte actif
          </label>
        </ResourceForm>
      )}
    </Modal>
  );
}

export function RemoveStaffButton({
  member,
  email,
}: {
  member: HotelUser;
  email: string;
}) {
  return (
    <DeleteButton action={removeStaff.bind(null, member.id)} itemLabel={email} />
  );
}
