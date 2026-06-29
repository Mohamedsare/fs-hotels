// Traduction en français des messages d'erreur (Supabase Auth / Postgres) qui
// arrivent en anglais. Les messages déjà en français (validations maison) passent
// tels quels. À utiliser systématiquement avant d'afficher une erreur en toast.

const PATTERNS: [RegExp, string][] = [
  // --- Auth ---
  [/user already registered|already been registered/i, "Cet e‑mail est déjà utilisé. Connectez‑vous plutôt."],
  [/invalid login credentials/i, "E‑mail ou mot de passe incorrect."],
  [/email not confirmed/i, "E‑mail non confirmé. Vérifiez votre boîte mail."],
  [/email address.*invalid|unable to validate email|invalid email/i, "Adresse e‑mail invalide."],
  [/password should be at least/i, "Le mot de passe doit contenir au moins 6 caractères."],
  [/new password should be different/i, "Le nouveau mot de passe doit être différent de l'ancien."],
  [/weak password/i, "Mot de passe trop faible. Choisissez‑en un plus robuste."],
  [/signups? not allowed|signup is disabled/i, "Les inscriptions sont actuellement désactivées."],
  [/token has expired or is invalid|otp.*expired|invalid.*token/i, "Lien invalide ou expiré. Refaites une demande."],
  [/email rate limit exceeded/i, "Trop d'e‑mails envoyés. Réessayez dans quelques minutes."],
  [/for security purposes.*after (\d+) seconds?/i, "Veuillez patienter quelques secondes avant de réessayer."],
  [/rate limit/i, "Trop de tentatives. Réessayez dans un moment."],
  [/user not found/i, "Aucun compte associé à cette adresse."],
  [/session.*(missing|expired)|refresh token/i, "Session expirée. Reconnectez‑vous."],
  [/captcha/i, "Vérification de sécurité échouée. Réessayez."],

  // --- Postgres / RLS ---
  [/duplicate key|unique constraint/i, "Cette entrée existe déjà."],
  [/violates foreign key/i, "Référence liée introuvable ou déjà supprimée."],
  [/violates row-level security|rls/i, "Action non autorisée."],
  [/permission denied/i, "Action non autorisée."],

  // --- Réseau ---
  [/failed to fetch|network|load failed/i, "Connexion impossible. Vérifiez votre réseau."],
];

/** Renvoie un message d'erreur lisible en français. */
export function frError(message?: string | null): string {
  if (!message) return "Une erreur est survenue. Réessayez.";
  const m = message.trim();
  for (const [re, fr] of PATTERNS) if (re.test(m)) return fr;
  return m; // déjà en français (validations maison) ou message inconnu
}
