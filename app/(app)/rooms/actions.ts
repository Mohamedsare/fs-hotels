"use server";

import { getActiveHotelId } from "@/lib/hotel/active-hotel";
import { reqStr, str, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import type { RoomStatus } from "@/types/db";
import { revalidatePath } from "next/cache";

export async function createRoom(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const number = reqStr(fd, "number");
  if (!number) return { ok: false, error: "Le numéro est requis." };
  try {
    const hotelId = await getActiveHotelId();
    const supabase = await createClient();
    const { error } = await supabase.from("rooms").insert({
      hotel_id: hotelId,
      number,
      floor: str(fd, "floor"),
      room_type_id: str(fd, "room_type_id"),
      note: str(fd, "note"),
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/rooms");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateRoom(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const number = reqStr(fd, "number");
  if (!number) return { ok: false, error: "Le numéro est requis." };
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("rooms")
      .update({
        number,
        floor: str(fd, "floor"),
        room_type_id: str(fd, "room_type_id"),
        note: str(fd, "note"),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/rooms");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteRoom(id: string): Promise<FormState> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/rooms");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function setRoomStatus(id: string, status: RoomStatus) {
  const supabase = await createClient();
  await supabase.from("rooms").update({ status }).eq("id", id);
  revalidatePath("/rooms");
}