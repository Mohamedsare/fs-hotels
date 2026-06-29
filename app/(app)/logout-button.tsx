"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({
  email,
  collapsed = false,
}: {
  email?: string | null;
  collapsed?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const onLogout = async () => {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.info("Vous êtes déconnecté.");
    router.replace("/login");
    router.refresh();
  };

  if (collapsed) {
    return (
      <div className="mt-1 border-t border-black/10 pt-3">
        <button
          onClick={onLogout}
          disabled={busy}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className="fs-touch-target flex w-full items-center justify-center rounded-lg py-2 text-red-600 hover:bg-fs-surface-container disabled:opacity-50"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    );
  }

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
