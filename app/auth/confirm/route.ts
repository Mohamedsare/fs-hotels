import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Vérification des liens e‑mail (flux serveur @supabase/ssr).
 *
 * Les templates Supabase pointent vers :
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=...&next=...
 *
 * On échange le token_hash contre une session (cookies), puis on redirige vers `next` :
 *   - type=email      (inscription)        -> /dashboard
 *   - type=recovery   (mot de passe oublié)-> /auth/reset-password
 *   - type=magiclink / email_change / invite selon le template.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeNext(searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/auth/auth-error", origin));
}

/** N'autorise qu'une redirection interne (évite les open redirects). */
function sanitizeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}
