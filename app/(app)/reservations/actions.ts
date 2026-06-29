"use server";

import { getActiveHotelId } from "@/lib/hotel/active-hotel";
import { num, reqStr, str, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import type { ReservationStatus } from "@/types/db";
import { revalidatePath } from "next/cache";

export async function createReservation(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const checkIn = reqStr(fd, "check_in_date");
  const checkOut = reqStr(fd, "check_out_date");
  if (!checkIn || !checkOut)
    return { ok: false, error: "Dates d'arrivée et de départ requises." };
  if (checkOut <= checkIn)
    return { ok: false, error: "La date de départ doit suivre l'arrivée." };
  try {
    const hotelId = await getActiveHotelId();
    const supabase = await createClient();
    const { error } = await supabase.from("reservations").insert({
      hotel_id: hotelId,
      client_id: str(fd, "client_id"),
      room_type_id: str(fd, "room_type_id"),
      check_in_date: checkIn,
      check_out_date: checkOut,
      guests_count: Math.max(1, num(fd, "guests_count")),
      agreed_rate: num(fd, "agreed_rate"),
      advance_paid: num(fd, "advance_paid"),
      source: str(fd, "source"),
      note: str(fd, "note"),
      status: "confirmed",
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/reservations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function setReservationStatus(
  id: string,
  status: ReservationStatus,
) {
  const supabase = await createClient();
  await supabase.from("reservations").update({ status }).eq("id", id);
  revalidatePath("/reservations");
}

/** Check-in : transforme une réservation en séjour, occupe la chambre. */
export async function checkInReservation(
  reservationId: string,
  roomId: string,
): Promise<FormState> {
  try {
    const hotelId = await getActiveHotelId();
    const supabase = await createClient();

    const { data: resv } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", reservationId)
      .single();
    if (!resv) return { ok: false, error: "Réservation introuvable." };

    const { data: room } = await supabase
      .from("rooms")
      .select("id, room_type:room_types(base_price)")
      .eq("id", roomId)
      .single();

    const fallbackRate =
      (room as { room_type?: { base_price?: number } } | null)?.room_type
        ?.base_price ?? 0;
    const r = resv as {
      agreed_rate: number;
      advance_paid: number;
      guests_count: number;
      check_out_date: string;
      client_id: string | null;
    };
    const nightlyRate = r.agreed_rate > 0 ? r.agreed_rate : fallbackRate;

    const { data: stay, error: stayErr } = await supabase
      .from("stays")
      .insert({
        hotel_id: hotelId,
        reservation_id: reservationId,
        room_id: roomId,
        client_id: r.client_id,
        nightly_rate: nightlyRate,
        guests_count: r.guests_count,
        expected_check_out: r.check_out_date,
        paid_total: r.advance_paid,
        payment_status: r.advance_paid > 0 ? "partial" : "unpaid",
      })
      .select("id")
      .single();
    if (stayErr) return { ok: false, error: stayErr.message };

    if (r.advance_paid > 0) {
      await supabase.from("payments").insert({
        hotel_id: hotelId,
        stay_id: (stay as { id: string }).id,
        method: "cash",
        amount: r.advance_paid,
        reference: "Avance réservation",
      });
    }

    await supabase
      .from("reservations")
      .update({ status: "checked_in" })
      .eq("id", reservationId);
    await supabase.from("rooms").update({ status: "occupied" }).eq("id", roomId);

    revalidatePath("/reservations");
    revalidatePath("/stays");
    revalidatePath("/rooms");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}