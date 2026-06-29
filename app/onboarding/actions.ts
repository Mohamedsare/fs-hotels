"use server";

import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/welcome";
import { num, reqStr, str, type FormState } from "@/lib/forms";

export async function createHotel(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const name = reqStr(fd, "name");
  if (!name) return { ok: false, error: "Le nom de l'hôtel est requis." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const { data: hotel, error } = await supabase
    .from("hotels")
    .insert({
      name,
      classification: reqStr(fd, "classification") || "unclassified",
      city: str(fd, "city"),
      phone: str(fd, "phone"),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  // Réglages fiscaux par défaut (taxe touristique configurable).
  await supabase.from("tax_settings").insert({
    hotel_id: (hotel as { id: string }).id,
    tourism_tax_per_night: num(fd, "tourism_tax_per_night"),
  });

  // Mail de bienvenue via Resend — non bloquant (l'onboarding réussit même si l'envoi échoue).
  if (user.email) {
    void sendWelcomeEmail({ to: user.email, hotelName: name }).catch(() => {});
  }

  return { ok: true };
}