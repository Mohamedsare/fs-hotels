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

/** Description courte de chaque module (UI d'attribution des accès). */
export const MODULE_DESCRIPTIONS: Record<Module, string> = {
  reservations: "Créer et suivre les réservations et les avances.",
  stays: "Check-in, check-out, prolongations et consommations.",
  rooms: "État des chambres (libre, occupée, à nettoyer…).",
  clients: "Fiches clients, pièces d'identité et historique.",
  cash: "Encaissements, dépenses et clôture de caisse.",
  invoices: "Factures, reçus et devis.",
  housekeeping: "Tâches de ménage et suivi du nettoyage.",
  maintenance: "Tickets de maintenance et incidents techniques.",
  reports: "Chiffre d'affaires, occupation et taxe de séjour.",
};

/** Regroupement des modules par pôle métier (UI d'attribution). */
export const MODULE_GROUPS: { label: string; modules: Module[] }[] = [
  { label: "Accueil & clients", modules: ["reservations", "stays", "clients"] },
  {
    label: "Chambres & entretien",
    modules: ["rooms", "housekeeping", "maintenance"],
  },
  { label: "Finances & pilotage", modules: ["cash", "invoices", "reports"] },
];

/**
 * Modèles d'accès par métier — remplissage rapide des permissions d'un employé.
 * Purement côté UI : seul le tableau `permissions` final est persisté.
 */
export const PERMISSION_PRESETS: {
  id: string;
  label: string;
  description: string;
  modules: Module[];
}[] = [
  {
    id: "reception",
    label: "Réception",
    description: "Réservations, séjours, clients, factures.",
    modules: ["reservations", "stays", "clients", "invoices"],
  },
  {
    id: "housekeeping",
    label: "Ménage & entretien",
    description: "Chambres, ménage et maintenance.",
    modules: ["rooms", "housekeeping", "maintenance"],
  },
  {
    id: "restaurant_bar",
    label: "Restaurant / Bar",
    description: "Consommations des séjours et caisse.",
    modules: ["stays", "cash"],
  },
  {
    id: "accountant",
    label: "Comptabilité",
    description: "Caisse, factures et rapports.",
    modules: ["cash", "invoices", "reports"],
  },
  {
    id: "full",
    label: "Accès complet",
    description: "Tous les modules d'exploitation.",
    modules: [...MODULES],
  },
];

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

type Tone = "neutral" | "green" | "orange" | "red" | "blue" | "gray";

/** Métadonnées d'affichage par rôle assignable (badge + résumé des droits). */
export const ROLE_META: Record<
  "owner" | "manager" | "employee",
  { label: string; tone: Tone; short: string }
> = {
  owner: {
    label: ROLE_LABELS.owner,
    tone: "orange",
    short:
      "Accès complet : exploitation, personnel, paramètres et suppressions définitives.",
  },
  manager: {
    label: ROLE_LABELS.manager,
    tone: "blue",
    short:
      "Exploitation complète, sauf personnel, paramètres et suppressions définitives.",
  },
  employee: {
    label: ROLE_LABELS.employee,
    tone: "neutral",
    short: "Accès limité aux seuls modules explicitement autorisés.",
  },
};

/** Tonalité du badge d'un rôle (gère aussi les rôles hérités -> neutre). */
export function roleTone(role: string): Tone {
  return ROLE_META[role as keyof typeof ROLE_META]?.tone ?? "neutral";
}

/** Libellé d'un rôle (gère les rôles hérités). */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

/**
 * Matrice « qui peut faire quoi » — affichée dans le guide des rôles.
 * `"partial"` = dépend des accès accordés (cas de l'employé).
 */
export const ROLE_CAPABILITIES: {
  label: string;
  owner: boolean | "partial";
  manager: boolean | "partial";
  employee: boolean | "partial";
}[] = [
  {
    label: "Exploitation quotidienne (réservations, séjours, caisse…)",
    owner: true,
    manager: true,
    employee: "partial",
  },
  {
    label: "Catalogue (types de chambres)",
    owner: true,
    manager: true,
    employee: false,
  },
  {
    label: "Rapports & pilotage",
    owner: true,
    manager: true,
    employee: "partial",
  },
  {
    label: "Gérer le personnel & les rôles",
    owner: true,
    manager: false,
    employee: false,
  },
  {
    label: "Paramètres de l'hôtel",
    owner: true,
    manager: false,
    employee: false,
  },
  {
    label: "Suppressions définitives",
    owner: true,
    manager: false,
    employee: false,
  },
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
