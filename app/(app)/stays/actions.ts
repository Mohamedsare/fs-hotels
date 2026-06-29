"use server";

import { getActiveHotelId } from "@/lib/hotel/active-hotel";
import { num, reqStr, str, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { nightsBetween } from "@/lib/utils/format";
import type { PaymentMethod } from "@/types/db";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Recalcule et persiste les totaux d'un séjour (source de vérité unique). */
async function recomputeStay(supabase: SupabaseClient, stayId: string) {
  const { data: stay } = await supabase
    .from("stays")
    .select(
      "id, hotel_id, nightly_rate, guests_count, check_in_at, expected_check_out, checked_out_at, discount_total",
    )
    .eq("id", stayId)
    .single();
  if (!stay) return;
  const s = stay as {
    hotel_id: string;
    nightly_rate: number;
    guests_count: number;
    check_in_at: string;
    expected_check_out: string;
    checked_out_at: string | null;
    discount_total: number;
  };

  const end = s.checked_out_at ?? s.expected_check_out;
  const nights = nightsBetween(s.check_in_at, end);
  const roomTotal = nights * Number(s.nightly_rate);

  const { data: cons } = await supabase
    .from("service_consumptions")
    .select("total")
    .eq("stay_id", stayId);
  const servicesTotal = (cons ?? []).reduce(
    (sum, c) => sum + Number((c as { total: number }).total),
    0,
  );

  const { data: tax } = await supabase
    .from("tax_settings")
    .select("tourism_tax_per_night")
    .eq("hotel_id", s.hotel_id)
    .maybeSingle();
  const taxPerNight = Number(
    (tax as { tourism_tax_per_night?: number } | null)?.tourism_tax_per_night ??
      0,
  );
  const taxTotal = nights * Math.max(1, s.guests_count) * taxPerNight;

  const { data: pays } = await supabase
    .from("payments")
    .select("amount")
    .eq("stay_id", stayId);
  const paidTotal = (pays ?? []).reduce(
    (sum, p) => sum + Number((p as { amount: number }).amount),
    0,
  );

  const grand =
    roomTotal + servicesTotal + taxTotal - Number(s.discount_total || 0);
  const paymentStatus =
    paidTotal >= grand && grand > 0
      ? "paid"
      : paidTotal > 0
        ? "partial"
        : "unpaid";

  await supabase
    .from("stays")
    .update({
      room_total: roomTotal,
      services_total: servicesTotal,
      tax_total: taxTotal,
      grand_total: grand,
      paid_total: paidTotal,
      payment_status: paymentStatus,
    })
    .eq("id", stayId);
}

/** Check-in direct (client de passage, sans réservation). */
export async function createWalkInStay(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const roomId = reqStr(fd, "room_id");
  const checkout = reqStr(fd, "expected_check_out");
  if (!roomId) return { ok: false, error: "Sélectionnez une chambre." };
  if (!checkout) return { ok: false, error: "Date de départ prévue requise." };
  try {
    const hotelId = await getActiveHotelId();
    const supabase = await createClient();
    const advance = num(fd, "advance_paid");
    const { data: stay, error } = await supabase
      .from("stays")
      .insert({
        hotel_id: hotelId,
        room_id: roomId,
        client_id: str(fd, "client_id"),
        nightly_rate: num(fd, "nightly_rate"),
        guests_count: Math.max(1, num(fd, "guests_count")),
        expected_check_out: checkout,
        paid_total: advance > 0 ? advance : 0,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    const stayId = (stay as { id: string }).id;

    // Avance encaissée au check-in (facultative).
    if (advance > 0) {
      await supabase.from("payments").insert({
        hotel_id: hotelId,
        stay_id: stayId,
        method: (str(fd, "method") ?? "cash") as PaymentMethod,
        amount: advance,
        reference: str(fd, "reference") ?? "Avance check-in",
      });
    }

    await supabase.from("rooms").update({ status: "occupied" }).eq("id", roomId);
    await recomputeStay(supabase, stayId);
    revalidatePath("/stays");
    revalidatePath("/rooms");
    revalidatePath("/cash");
    revalidatePath("/reception");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function addConsumption(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const stayId = reqStr(fd, "stay_id");
  const label = reqStr(fd, "label");
  const unitPrice = num(fd, "unit_price");
  const qty = Math.max(1, num(fd, "quantity"));
  if (!label) return { ok: false, error: "Désignation requise." };
  try {
    const hotelId = await getActiveHotelId();
    const supabase = await createClient();
    const { error } = await supabase.from("service_consumptions").insert({
      hotel_id: hotelId,
      stay_id: stayId,
      service_id: str(fd, "service_id"),
      label,
      unit_price: unitPrice,
      quantity: qty,
      total: unitPrice * qty,
    });
    if (error) return { ok: false, error: error.message };
    await recomputeStay(supabase, stayId);
    revalidatePath("/stays");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function addPayment(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const stayId = reqStr(fd, "stay_id");
  const amount = num(fd, "amount");
  if (amount <= 0) return { ok: false, error: "Montant invalide." };
  try {
    const hotelId = await getActiveHotelId();
    const supabase = await createClient();
    const { error } = await supabase.from("payments").insert({
      hotel_id: hotelId,
      stay_id: stayId,
      method: (str(fd, "method") ?? "cash") as PaymentMethod,
      amount,
      reference: str(fd, "reference"),
    });
    if (error) return { ok: false, error: error.message };
    await recomputeStay(supabase, stayId);
    revalidatePath("/stays");
    revalidatePath("/cash");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Prolonge un séjour : repousse la date de départ prévue et recalcule. */
export async function extendStay(
  stayId: string,
  newCheckout: string,
): Promise<FormState> {
  if (!stayId) return { ok: false, error: "Séjour introuvable." };
  if (!newCheckout) return { ok: false, error: "Nouvelle date de départ requise." };
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("stays")
      .update({ expected_check_out: newCheckout })
      .eq("id", stayId);
    if (error) return { ok: false, error: error.message };
    await recomputeStay(supabase, stayId);
    revalidatePath("/stays");
    revalidatePath("/reception");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Check-out : fige les totaux, génère la facture, libère (salit) la chambre. */
export async function checkOutStay(stayId: string): Promise<FormState> {
  try {
    const hotelId = await getActiveHotelId();
    const supabase = await createClient();

    await supabase
      .from("stays")
      .update({ checked_out_at: new Date().toISOString(), status: "checked_out" })
      .eq("id", stayId);
    await recomputeStay(supabase, stayId);

    const { data: stay } = await supabase
      .from("stays")
      .select("*, room:rooms(id,number)")
      .eq("id", stayId)
      .single();
    if (!stay) return { ok: false, error: "Séjour introuvable." };
    const s = stay as {
      room_id: string;
      client_id: string | null;
      nightly_rate: number;
      check_in_at: string;
      checked_out_at: string;
      room_total: number;
      services_total: number;
      tax_total: number;
      discount_total: number;
      grand_total: number;
      paid_total: number;
    };
    const nights = nightsBetween(s.check_in_at, s.checked_out_at);

    const number = `F${Date.now().toString().slice(-8)}`;
    const { data: invoice } = await supabase
      .from("invoices")
      .insert({
        hotel_id: hotelId,
        stay_id: stayId,
        client_id: s.client_id,
        type: "invoice",
        number,
        subtotal: s.room_total + s.services_total,
        discount: s.discount_total,
        tax_total: s.tax_total,
        total: s.grand_total,
        paid_total: s.paid_total,
      })
      .select("id")
      .single();

    const invoiceId = (invoice as { id: string } | null)?.id;
    if (invoiceId) {
      const items: {
        hotel_id: string;
        invoice_id: string;
        label: string;
        unit_price: number;
        quantity: number;
        total: number;
        sort_order: number;
      }[] = [
        {
          hotel_id: hotelId,
          invoice_id: invoiceId,
          label: `Nuitées (${nights})`,
          unit_price: s.nightly_rate,
          quantity: nights,
          total: s.room_total,
          sort_order: 0,
        },
      ];
      if (s.services_total > 0)
        items.push({
          hotel_id: hotelId,
          invoice_id: invoiceId,
          label: "Consommations & services",
          unit_price: s.services_total,
          quantity: 1,
          total: s.services_total,
          sort_order: 1,
        });
      if (s.tax_total > 0)
        items.push({
          hotel_id: hotelId,
          invoice_id: invoiceId,
          label: "Taxe de développement touristique",
          unit_price: s.tax_total,
          quantity: 1,
          total: s.tax_total,
          sort_order: 2,
        });
      await supabase.from("invoice_items").insert(items);
    }

    await supabase
      .from("rooms")
      .update({ status: "dirty" })
      .eq("id", s.room_id);

    revalidatePath("/stays");
    revalidatePath("/rooms");
    revalidatePath("/cash");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}