"use server";

import { getActiveHotelId } from "@/lib/hotel/active-hotel";
import { num, reqStr, str, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createRoomType(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const name = reqStr(fd, "name");
  if (!name) return { ok: false, error: "Le nom est requis." };
  try {
    const hotelId = await getActiveHotelId();
    const supabase = await createClient();
    const { error } = await supabase.from("room_types").insert({
      hotel_id: hotelId,
      name,
      description: str(fd, "description"),
      max_occupancy: Math.max(1, num(fd, "max_occupancy")),
      base_price: num(fd, "base_price"),
      weekend_price: num(fd, "weekend_price") || null,
      corporate_price: num(fd, "corporate_price") || null,
      deposit: num(fd, "deposit"),
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/room-types");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateRoomType(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const name = reqStr(fd, "name");
  if (!name) return { ok: false, error: "Le nom est requis." };
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("room_types")
      .update({
        name,
        description: str(fd, "description"),
        max_occupancy: Math.max(1, num(fd, "max_occupancy")),
        base_price: num(fd, "base_price"),
        weekend_price: num(fd, "weekend_price") || null,
        corporate_price: num(fd, "corporate_price") || null,
        deposit: num(fd, "deposit"),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/room-types");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteRoomType(id: string): Promise<FormState> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("room_types").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/room-types");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function toggleRoomType(id: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("room_types").update({ active }).eq("id", id);
  revalidatePath("/room-types");
}