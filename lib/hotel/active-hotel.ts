import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Hotel } from "@/types/db";

export const ACTIVE_HOTEL_COOKIE = "active_hotel";

/**
 * Hôtel actif : cookie `active_hotel` s'il pointe sur un hôtel accessible,
 * sinon le premier hôtel visible (RLS). Permet au super-admin / aux comptes
 * multi-hôtels de basculer d'établissement.
 */
async function pickHotel(): Promise<Hotel | null> {
  const supabase = await createClient();
  const store = await cookies();
  const wanted = store.get(ACTIVE_HOTEL_COOKIE)?.value;
  if (wanted) {
    const { data } = await supabase
      .from("hotels")
      .select("*")
      .eq("id", wanted)
      .maybeSingle();
    if (data) return data as Hotel;
  }
  const { data } = await supabase
    .from("hotels")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as Hotel) ?? null;
}

export const getActiveHotel = cache(async (): Promise<Hotel> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const hotel = await pickHotel();
  if (!hotel) redirect("/onboarding");
  return hotel;
});

/** Id de l'hôtel actif — pour les Server Actions (lève si absent). */
export async function getActiveHotelId(): Promise<string> {
  const hotel = await pickHotel();
  if (!hotel) throw new Error("Aucun hôtel configuré");
  return hotel.id;
}
