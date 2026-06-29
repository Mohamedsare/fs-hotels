"use server";

import { getActiveHotelId } from "@/lib/hotel/active-hotel";
import { num, reqStr, str, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod } from "@/types/db";
import { revalidatePath } from "next/cache";

export async function addExpense(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const label = reqStr(fd, "label");
  const amount = num(fd, "amount");
  if (!label) return { ok: false, error: "Libellé requis." };
  if (amount <= 0) return { ok: false, error: "Montant invalide." };
  try {
    const hotelId = await getActiveHotelId();
    const supabase = await createClient();
    const { error } = await supabase.from("hotel_expenses").insert({
      hotel_id: hotelId,
      label,
      amount,
      method: (str(fd, "method") ?? "cash") as PaymentMethod,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/cash");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}