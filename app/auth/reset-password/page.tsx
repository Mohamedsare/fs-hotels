"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";
import { useToast } from "@/components/ui/toast";
import { frError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [ready, setReady] = useState<boolean | null>(null); // null = vérification en cours
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // La route /auth/confirm a ouvert une session de récupération : on la vérifie.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setReady(!!data.user));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(frError(error.message));
        return;
      }
      toast.success("Mot de passe mis à jour. Redirection…");
      setDone(true);
      setTimeout(() => {
        router.replace("/dashboard");
        router.refresh();
      }, 1200);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-fs-card p-6 shadow-xl">
        <div className="mb-4 flex justify-center">
          <Logo className="h-14 w-auto" />
        </div>
        <h1 className="text-center text-xl font-bold">Nouveau mot de passe</h1>

        {ready === false ? (
          <>
            <p className="mt-3 text-sm text-red-600">
              Lien invalide ou expiré. Veuillez relancer une demande de
              réinitialisation.
            </p>
            <p className="mt-4 text-center text-sm">
              <Link
                href="/auth/forgot-password"
                className="font-semibold text-fs-accent"
              >
                Demander un nouveau lien
              </Link>
            </p>
          </>
        ) : done ? (
          <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">
            Mot de passe mis à jour ✅ Redirection…
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-fs-on-surface-variant">
              Choisissez un nouveau mot de passe pour votre compte.
            </p>
            <form onSubmit={onSubmit}>
              <label className="mt-5 block text-sm font-medium">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-fs-accent"
                placeholder="Au moins 6 caractères"
              />

              <label className="mt-4 block text-sm font-medium">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-fs-accent"
                placeholder="••••••••"
              />

              <button
                type="submit"
                disabled={busy || ready === null}
                className="mt-5 w-full rounded-xl bg-fs-accent py-2.5 font-bold text-white disabled:opacity-50"
              >
                {ready === null
                  ? "Vérification…"
                  : busy
                    ? "Enregistrement…"
                    : "Mettre à jour"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
