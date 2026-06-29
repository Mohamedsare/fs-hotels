/** Montant FCFA (entier, séparateur d'espace insécable). */
export function formatCFA(n: number | null | undefined): string {
  const v = Math.round(Number(n) || 0);
  return `${v.toLocaleString("fr-FR").replace(/ /g, " ")} FCFA`;
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(d));
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

/** Nombre de nuits entre deux dates (au moins 1). */
export function nightsBetween(
  checkIn: string | Date,
  checkOut: string | Date,
): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const ms = b.getTime() - a.getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}