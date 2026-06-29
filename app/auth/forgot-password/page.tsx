"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/confirm?next=/auth/reset-password`,
      });
      if (error) {
        setError(error.message);
        return;
      }
      // On affiche toujours le succès (ne révèle pas si l'e‑mail existe).
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-fs-card p-6 shadow-xl">
        <h1 className="text-xl font-bold">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-fs-on-surface-variant">
          Saisissez votre adresse e‑mail : nous vous enverrons un lien de
          réinitialisation.
        </p>

        {sent ? (
          <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">
            Si un compte existe pour <strong>{email}</strong>, un e‑mail de
            réinitialisation vient d&apos;être envoyé. Pensez à vérifier vos spams.
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <label className="mt-5 block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-fs-accent"
              placeholder="vous@hotel.bf"
            />

            {error ? (
              <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="mt-5 w-full rounded-xl bg-fs-accent py-2.5 font-bold text-white disabled:opacity-50"
            >
              {busy ? "Envoi…" : "Envoyer le lien"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-fs-on-surface-variant">
          <Link href="/login" className="font-semibold text-fs-accent">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
