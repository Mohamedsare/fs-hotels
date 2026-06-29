import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-fs-card p-6 text-center shadow-xl">
        <div className="text-4xl">⚠️</div>
        <h1 className="mt-3 text-xl font-bold">Lien invalide ou expiré</h1>
        <p className="mt-2 text-sm text-fs-on-surface-variant">
          Ce lien n&apos;est plus valable. Les liens de confirmation et de
          réinitialisation expirent rapidement pour votre sécurité.
        </p>
        <div className="mt-5 space-y-2">
          <Link
            href="/auth/forgot-password"
            className="block w-full rounded-xl bg-fs-accent py-2.5 font-bold text-white"
          >
            Renvoyer un lien de réinitialisation
          </Link>
          <Link
            href="/login"
            className="block w-full rounded-xl border border-black/10 py-2.5 font-semibold hover:bg-fs-surface-container"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </main>
  );
}
