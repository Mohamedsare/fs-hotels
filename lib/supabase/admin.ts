import "server-only";

import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseUrl } from "@/lib/supabase/normalize-url";

/**
 * Client service-role (privilèges admin, contourne la RLS). À n'utiliser QUE
 * côté serveur, après avoir vérifié les droits de l'appelant. Sert notamment à
 * résoudre les e-mails des membres (schéma `auth` non exposé via PostgREST).
 */
export function createAdminClient() {
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!urlRaw || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants.",
    );
  }
  return createClient(normalizeSupabaseUrl(urlRaw), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
