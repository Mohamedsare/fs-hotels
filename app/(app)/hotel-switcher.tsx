"use client";

import { useTransition } from "react";
import { Building2 } from "lucide-react";
import { setActiveHotel } from "./hotel-actions";

/** Sélecteur d'hôtel actif (visible si l'utilisateur gère plusieurs hôtels). */
export function HotelSwitcher({
  hotels,
  activeId,
  collapsed = false,
}: {
  hotels: { id: string; name: string }[];
  activeId: string;
  collapsed?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (hotels.length < 2) return null;

  if (collapsed) {
    return (
      <div className="flex justify-center pb-2" title="Hôtel actif">
        <Building2 className="h-5 w-5 text-fs-on-surface-variant" />
      </div>
    );
  }

  return (
    <label className="mb-3 block">
      <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-fs-on-surface-variant">
        <Building2 className="h-3.5 w-3.5" /> Hôtel actif
      </span>
      <select
        value={activeId}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => {
            void setActiveHotel(e.target.value);
          })
        }
        className="w-full rounded-lg border border-black/10 bg-fs-surface-low px-2 py-1.5 text-sm outline-none focus:border-fs-accent disabled:opacity-50"
      >
        {hotels.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>
    </label>
  );
}
