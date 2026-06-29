"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/ui";
import { setActiveHotel } from "../hotel-actions";

/** Bascule l'hôtel actif vers l'établissement choisi (super-admin). */
export function ManageHotelButton({ hotelId }: { hotelId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      className="h-8 px-3 text-xs"
      disabled={pending}
      onClick={() => startTransition(() => void setActiveHotel(hotelId))}
    >
      {pending ? "…" : "Gérer"}
    </Button>
  );
}
