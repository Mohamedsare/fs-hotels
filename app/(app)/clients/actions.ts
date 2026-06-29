"use server";

import { getActiveHotelId } from "@/lib/hotel/active-hotel";
import { reqStr, str, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import type { ClientType } from "@/types/db";
import { revalidatePath } from "next/cache";

export async function createClientRecord(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const name = reqStr(fd, "name");
  if (!name) return { ok: false, error: "Le nom est requis." };
  try {
    const hotelId = await getActiveHotelId();
    const supabase = await createClient();
    const { error } = await supabase.from("clients").insert({
      hotel_id: hotelId,
      name,
      type: (str(fd, "type") ?? "individual") as ClientType,
      phone: str(fd, "phone"),
      email: str(fd, "email"),
      nationality: str(fd, "nationality"),
      id_doc_type: str(fd, "id_doc_type"),
      id_doc_number: str(fd, "id_doc_number"),
      company_name: str(fd, "company_name"),
      address: str(fd, "address"),
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/clients");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}