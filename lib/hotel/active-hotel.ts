import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Hotel } from "@/types/db";

/**
 * Hôtel actif de l'utilisateur courant.
 * MVP : on prend le premier hôtel dont il est membre (multi-hôtels viendra plus tard
 * avec un sélecteur + cookie). Aucun hôtel -> page d'onboarding.
 */
export async function getActiveHotel(): Promise<Hotel> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("hotels")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) redirect("/onboarding");
  return data as Hotel;
}

/** Id de l'hôtel actif — pour les Server Actions (lève si absent). */
export async function getActiveHotelId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data, error } = await supabase
    .from("hotels")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Aucun hôtel configuré");
  return (data as { id: string }).id;
}