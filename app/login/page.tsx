"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { useToast } from "@/components/ui/toast";
import { frError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(frError(error.message));
        return;
      }
      toast.success("Connexion réussie. Bienvenue !");
      router.replace("/dashboard");
      router.refresh();
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
        <h1 className="text-center text-xl font-bold">FasoStock Hôtels</h1>
        <p className="mt-1 text-center text-sm text-fs-on-surface-variant">
          Connectez-vous pour gérer votre hôtel.
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

        <div className="mt-4 flex items-center justify-between">
          <label className="block text-sm font-medium">Mot de passe</label>
          <Link
            href="/auth/forgot-password"
            className="text-xs font-semibold text-fs-accent"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-fs-accent"
          placeholder="••••••••"
        />

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-xl bg-fs-accent py-2.5 font-bold text-white disabled:opacity-50"
        >
          {busy ? "Connexion…" : "Se connecter"}
        </button>

        <p className="mt-4 text-center text-sm text-fs-on-surface-variant">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-semibold text-fs-accent">
            Créer un compte
          </Link>
        </p>
      </form>
    </main>
  );
}