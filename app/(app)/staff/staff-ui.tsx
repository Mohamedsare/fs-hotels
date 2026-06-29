"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Check,
  Search,
  ShieldCheck,
  User,
  UserCog,
  UserPlus,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ResourceForm } from "@/components/ui/resource-form";
import { DataTable, type Column } from "@/components/ui/table";
import { DeleteButton, RowActions, editTrigger } from "@/components/ui/row-actions";
import { useToast } from "@/components/ui/toast";
import { frError } from "@/lib/errors";
import { Badge, Button, EmptyState, Field, Input, Select } from "@/components/ui/ui";
import {
  ASSIGNABLE_ROLES,
  MODULE_DESCRIPTIONS,
  MODULE_GROUPS,
  MODULE_LABELS,
  PERMISSION_PRESETS,
  ROLE_META,
  roleLabel,
  roleTone,
  type Module,
} from "@/lib/permissions";
import { formatDate } from "@/lib/utils/format";
import type { HotelUser } from "@/types/db";
import { addStaff, removeStaff, setStaffActive, updateStaff } from "./actions";

export type StaffRow = HotelUser & { email: string };

/* ------------------------------------------------------------------ */
/* Formulaire — rôle + accès (presets, groupes, tout cocher/décocher)  */
/* ------------------------------------------------------------------ */

function StaffFields({ member }: { member?: HotelUser }) {
  const [role, setRole] = useState<string>(member?.role ?? "employee");
  const [perms, setPerms] = useState<Set<Module>>(
    new Set((member?.permissions ?? []) as Module[]),
  );

  const toggle = (mod: Module) =>
    setPerms((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });

  const applyPreset = (modules: Module[]) => setPerms(new Set(modules));
  const clearAll = () => setPerms(new Set());

  return (
    <>
      <Field label="Rôle" required>
        <Select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </Field>

      <p className="rounded-lg bg-fs-surface-container px-3 py-2 text-xs text-fs-on-surface-variant">
        {ROLE_META[role as keyof typeof ROLE_META]?.short}
      </p>

      {role === "employee" ? (
        <div className="space-y-3">
          {/* Modèles d'accès par métier */}
          <div>
            <div className="mb-1.5 text-sm font-medium">Modèles rapides</div>
            <div className="flex flex-wrap gap-1.5">
              {PERMISSION_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={p.description}
                  onClick={() => applyPreset(p.modules)}
                  className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-fs-text transition-colors hover:border-fs-accent hover:bg-fs-accent/10 hover:text-fs-accent"
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-fs-on-surface-variant transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Tout décocher
              </button>
            </div>
          </div>

          {/* Accès par pôle métier */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Accès autorisés</span>
              <span className="text-xs text-fs-on-surface-variant">
                {perms.size} / {MODULE_GROUPS.reduce((n, g) => n + g.modules.length, 0)}
              </span>
            </div>
            {MODULE_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-fs-on-surface-variant">
                  {group.label}
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {group.modules.map((mod) => {
                    const checked = perms.has(mod);
                    return (
                      <label
                        key={mod}
                        className={
                          "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm transition-colors " +
                          (checked
                            ? "border-fs-accent bg-fs-accent/5"
                            : "border-black/10 hover:bg-fs-surface-container")
                        }
                      >
                        <input
                          type="checkbox"
                          name={`perm_${mod}`}
                          checked={checked}
                          onChange={() => toggle(mod)}
                          className="mt-0.5 h-4 w-4 accent-fs-accent"
                        />
                        <span className="min-w-0">
                          <span className="block font-medium">{MODULE_LABELS[mod]}</span>
                          <span className="block text-xs text-fs-on-surface-variant">
                            {MODULE_DESCRIPTIONS[mod]}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Boutons d'action (ajout / édition / suppression / statut)           */
/* ------------------------------------------------------------------ */

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

/** Interrupteur Actif / Inactif (bascule immédiate). */
function StatusToggle({ member }: { member: StaffRow }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState(member.active);

  const toggle = () =>
    startTransition(async () => {
      const next = !active;
      const res = await setStaffActive(member.id, next);
      if (res.ok) {
        setActive(next);
        toast.success(next ? "Membre activé." : "Membre désactivé.");
      } else {
        toast.error(frError(res.error));
      }
    });

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={active ? "Désactiver le membre" : "Activer le membre"}
      disabled={pending}
      onClick={toggle}
      className={
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 " +
        (active ? "bg-green-500" : "bg-neutral-300")
      }
    >
      <span
        className={
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform " +
          (active ? "translate-x-5.5" : "translate-x-0.5")
        }
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Annuaire — recherche + filtres + tableau                            */
/* ------------------------------------------------------------------ */

type RoleFilter = "all" | "owner" | "manager" | "employee";
type StatusFilter = "all" | "active" | "inactive";

export function StaffDirectory({
  rows,
  meId,
}: {
  rows: StaffRow[];
  meId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.email.toLowerCase().includes(q)) return false;
      if (role !== "all" && r.role !== role) return false;
      if (status === "active" && !r.active) return false;
      if (status === "inactive" && r.active) return false;
      return true;
    });
  }, [rows, query, role, status]);

  const columns: Column<StaffRow>[] = [
    {
      key: "email",
      header: "Membre",
      cell: (r) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-semibold text-fs-text">
            <span className="truncate">{r.email}</span>
            {r.user_id === meId ? <Badge tone="blue">Vous</Badge> : null}
          </div>
          <div className="text-xs text-fs-on-surface-variant">
            Depuis le {formatDate(r.created_at)}
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rôle",
      cell: (r) => <Badge tone={roleTone(r.role)}>{roleLabel(r.role)}</Badge>,
    },
    {
      key: "perms",
      header: "Accès",
      cell: (r) =>
        r.role === "owner" || r.role === "manager" ? (
          <span className="text-fs-on-surface-variant">Tous les modules</span>
        ) : r.permissions.length ? (
          <div className="flex flex-wrap gap-1">
            {r.permissions.slice(0, 4).map((p) => (
              <Badge key={p} tone="neutral">
                {MODULE_LABELS[p as Module] ?? p}
              </Badge>
            ))}
            {r.permissions.length > 4 ? (
              <Badge tone="gray">+{r.permissions.length - 4}</Badge>
            ) : null}
          </div>
        ) : (
          <span className="text-fs-on-surface-variant">Aucun accès</span>
        ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <StatusToggle member={r} />
          <span className="text-xs text-fs-on-surface-variant">
            {r.active ? "Actif" : "Inactif"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <RowActions>
          <EditStaffButton member={r} />
          <RemoveStaffButton member={r} email={r.email} />
        </RowActions>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Barre d'outils : recherche + filtres */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fs-on-surface-variant" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un e-mail…"
            className="pl-9"
            aria-label="Rechercher un membre"
          />
        </div>
        <Select
          value={role}
          onChange={(e) => setRole(e.target.value as RoleFilter)}
          aria-label="Filtrer par rôle"
          className="sm:w-48"
        >
          <option value="all">Tous les rôles</option>
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label="Filtrer par statut"
          className="sm:w-40"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>Aucun membre ne correspond à votre recherche.</EmptyState>
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(r) => r.id} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Guide des rôles — matrice « qui peut faire quoi »                    */
/* ------------------------------------------------------------------ */

const ROLE_ICON: Record<string, typeof ShieldCheck> = {
  owner: ShieldCheck,
  manager: UserCog,
  employee: User,
};

export function RoleGuide({
  capabilities,
}: {
  capabilities: {
    label: string;
    owner: boolean | "partial";
    manager: boolean | "partial";
    employee: boolean | "partial";
  }[];
}) {
  const roles = ["owner", "manager", "employee"] as const;

  const mark = (v: boolean | "partial") =>
    v === true ? (
      <Check className="mx-auto h-4 w-4 text-green-600" />
    ) : v === "partial" ? (
      <span className="text-xs font-semibold text-orange-600">selon accès</span>
    ) : (
      <X className="mx-auto h-4 w-4 text-fs-on-surface-variant/50" />
    );

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-fs-card">
      <div className="border-b border-black/10 px-4 py-3">
        <h2 className="text-sm font-bold">Guide des rôles</h2>
        <p className="mt-0.5 text-xs text-fs-on-surface-variant">
          Le super-admin de la plateforme dispose de tous les droits sur chaque hôtel.
        </p>
      </div>
      <div className="fs-scroll-x">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-fs-surface-low text-fs-on-surface-variant">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                Capacité
              </th>
              {roles.map((r) => {
                const Icon = ROLE_ICON[r];
                return (
                  <th
                    key={r}
                    className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="h-4 w-4" />
                      {ROLE_META[r].label}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {capabilities.map((cap) => (
              <tr key={cap.label} className="border-t border-black/6 first:border-t-0">
                <td className="px-4 py-3 align-middle text-fs-text">{cap.label}</td>
                {roles.map((r) => (
                  <td key={r} className="px-4 py-3 text-center align-middle">
                    {mark(cap[r])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
