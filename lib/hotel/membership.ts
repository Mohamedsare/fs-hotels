import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import type { Membership } from "@/lib/permissions";
import type { HotelRole } from "@/types/db";

/**
 * Appartenance + droits de l'utilisateur courant sur l'hôtel actif :
 * rôle, permissions (employé) et statut super-admin plateforme.
 */
export const getActiveMembership = cache(async (): Promise<Membership> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Super-admin plateforme ? (la RLS de platform_admins ne renvoie une ligne
  // qu'aux super-admins -> présence = vrai.)
  const { data: pa } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const isPlatformAdmin = !!pa;

  const hotel = await getActiveHotel();

  const { data: hu } = await supabase
    .from("hotel_users")
    .select("role, permissions")
    .eq("hotel_id", hotel.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const role = (hu?.role ?? (isPlatformAdmin ? "owner" : "employee")) as HotelRole;
  const permissions = ((hu?.permissions as string[] | null) ?? []) as string[];

  return { hotel, role, permissions, isPlatformAdmin };
});

/** Détermine si l'utilisateur courant est super-admin (léger, sans hôtel actif). */
export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}
