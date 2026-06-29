"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { useToast } from "@/components/ui/toast";
import { frError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(frError(error.message));
        return;
      }
      // Session immédiate (confirmation email désactivée) -> onboarding.
      if (data.session) {
        toast.success("Compte créé. Configurons votre établissement !");
        router.replace("/onboarding");
        router.refresh();
        return;
      }
      // Confirmation par email requise : pas de session tout de suite.
      toast.info(
        "Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez‑vous.",
        9000,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-black/10 bg-fs-card p-6 shadow-xl"
      >
        <div className="mb-4 flex justify-center">
          <Logo className="h-16 w-auto" />
        </div>
        <h1 className="text-center text-xl font-bold">Créer un compte</h1>
        <p className="mt-1 text-center text-sm text-fs-on-surface-variant">
          Inscrivez votre établissement sur FasoStock Hôtels.
        </p>

        <label className="mt-5 block text-sm font-medium">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-fs-accent"
          placeholder="vous@hotel.bf"
        />

        <label className="mt-4 block text-sm font-medium">Mot de passe</label>
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
          disabled={busy}
          className="mt-5 w-full rounded-xl bg-fs-accent py-2.5 font-bold text-white disabled:opacity-50"
        >
          {busy ? "Création…" : "Créer mon compte"}
        </button>

        <p className="mt-4 text-center text-sm text-fs-on-surface-variant">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-fs-accent">
            Se connecter
          </Link>
        </p>
      </form>
    </main>
  );
}
