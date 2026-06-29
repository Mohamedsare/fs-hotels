import type { Hotel, HotelRole } from "@/types/db";

/**
 * Modules d'autorisation (clés employé). Source unique côté app — doit rester
 * alignée avec la fonction SQL `app_can()` (migration 0003).
 */
export const MODULES = [
  "reservations",
  "stays",
  "rooms",
  "clients",
  "cash",
  "invoices",
  "housekeeping",
  "maintenance",
  "reports",
] as const;

export type Module = (typeof MODULES)[number];

export const MODULE_LABELS: Record<Module, string> = {
  reservations: "Réservations",
  stays: "Séjours",
  rooms: "Chambres",
  clients: "Clients",
  cash: "Caisse",
  invoices: "Factures",
  housekeeping: "Ménage",
  maintenance: "Maintenance",
  reports: "Rapports",
};

export const ROLE_LABELS: Record<string, string> = {
  owner: "Admin / Propriétaire",
  manager: "Gérant",
  employee: "Employé",
  // valeurs héritées — traitées comme « employé »
  receptionist: "Réception",
  housekeeping: "Ménage",
  restaurant_bar: "Restaurant / Bar",
  accountant: "Comptable",
};

/** Rôles proposés dans l'UI de gestion du personnel. */
export const ASSIGNABLE_ROLES: { value: HotelRole; label: string }[] = [
  { value: "owner", label: ROLE_LABELS.owner },
  { value: "manager", label: ROLE_LABELS.manager },
  { value: "employee", label: ROLE_LABELS.employee },
];

export type Membership = {
  hotel: Hotel;
  role: HotelRole;
  permissions: string[];
  isPlatformAdmin: boolean;
};

/** Miroir TS d'`app_can()` : droit d'écrire dans un module. */
export function can(m: Membership, module: Module): boolean {
  if (m.isPlatformAdmin) return true;
  if (m.role === "owner" || m.role === "manager") return true;
  if (m.role === "employee") return m.permissions.includes(module);
  // rôles hérités (receptionist…) : seulement les modules explicitement listés
  return m.permissions.includes(module);
}

/** Admin de l'hôtel : owner ou super-admin. */
export function isAdmin(m: Membership): boolean {
  return m.isPlatformAdmin || m.role === "owner";
}

/** Suppressions définitives, paramètres et personnel : réservés à l'admin. */
export function canDelete(m: Membership): boolean {
  return isAdmin(m);
}
export function canManageStaff(m: Membership): boolean {
  return isAdmin(m);
}
export function canEditSettings(m: Membership): boolean {
  return isAdmin(m);
}
