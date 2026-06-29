"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({ email }: { email?: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onLogout = async () => {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="border-t border-black/10 pt-3">
      {email ? (
        <div className="truncate px-3 pb-2 text-xs text-fs-on-surface-variant">
          {email}
        </div>
      ) : null}
      <button
        onClick={onLogout}
        disabled={busy}
        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-fs-surface-container disabled:opacity-50"
      >
        {busy ? "Déconnexion…" : "Se déconnecter"}
      </button>
    </div>
  );
}
