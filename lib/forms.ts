/** État retourné par les Server Actions de formulaire. */
export type FormState = { ok: boolean; error?: string };

export const FORM_IDLE: FormState = { ok: false };

/** Lit un nombre depuis FormData (vide -> 0). */
export function num(fd: FormData, key: string): number {
  const raw = String(fd.get(key) ?? "").replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Lit une chaîne nettoyée (vide -> null). */
export function str(fd: FormData, key: string): string | null {
  const v = String(fd.get(key) ?? "").trim();
  return v || null;
}

/** Lit une chaîne requise. */
export function reqStr(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}