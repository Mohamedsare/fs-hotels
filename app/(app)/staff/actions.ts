"use server";

import { revalidatePath } from "next/cache";
import { getActiveHotelId } from "@/lib/hotel/active-hotel";
import { getActiveMembership } from "@/lib/hotel/membership";
import { isAdmin, MODULES } from "@/lib/permissions";
import { reqStr, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import type { HotelRole } from "@/types/db";

const ASSIGNABLE: HotelRole[] = ["owner", "manager", "employee"];

async function assertAdmin() {
  const m = await getActiveMembership();
  if (!isAdmin(m)) throw new Error("Action réservée à l'administrateur.");
  return m;
}

function readPermissions(fd: FormData): string[] {
  return MODULES.filter((mod) => fd.get(`perm_${mod}`) === "on");
}

function readRole(fd: FormData): HotelRole {
  const r = reqStr(fd, "role") as HotelRole;
  return ASSIGNABLE.includes(r) ? r : "employee";
}

/** Ajoute un membre existant (par e-mail) à l'hôtel actif. */
export async function addStaff(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const email = reqStr(fd, "email");
  if (!email) return { ok: false, error: "L'e-mail est requis." };
  try {
    await assertAdmin();
    const hotelId = await getActiveHotelId();
    const supabase = await createClient();

    const { data: userId, error: rpcErr } = await supabase.rpc(
      "find_user_id_by_email",
      { p_email: email },
    );
    if (rpcErr) return { ok: false, error: rpcErr.message };
    if (!userId) {
      return {
        ok: false,
        error:
          "Aucun compte avec cet e-mail. La personne doit d'abord créer son compte FasoStock Hôtels.",
      };
    }

    const role = readRole(fd);
    const permissions = role === "employee" ? readPermissions(fd) : [];

    const { error } = await supabase.from("hotel_users").upsert(
      {
        hotel_id: hotelId,
        user_id: userId as string,
        role,
        permissions,
        active: true,
      },
      { onConflict: "hotel_id,user_id" },
    );
    if (error) return { ok: false, error: error.message };
    revalidatePath("/staff");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Met à jour le rôle / permissions / statut d'un membre. */
export async function updateStaff(
  memberId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  try {
    await assertAdmin();
    const hotelId = await getActiveHotelId();
    const supabase = await createClient();

    const role = readRole(fd);
    const permissions = role === "employee" ? readPermissions(fd) : [];
    const active = fd.get("active") === "on";

    // Garde-fou : ne pas retirer le dernier admin actif.
    if (role !== "owner" || !active) {
      const { data: admins } = await supabase
        .from("hotel_users")
        .select("id")
        .eq("hotel_id", hotelId)
        .eq("role", "owner")
        .eq("active", true);
      const adminIds = (admins ?? []).map((a) => (a as { id: string }).id);
      if (adminIds.length <= 1 && adminIds.includes(memberId)) {
        return {
          ok: false,
          error: "Impossible : c'est le dernier administrateur actif.",
        };
      }
    }

    const { error } = await supabase
      .from("hotel_users")
      .update({ role, permissions, active })
      .eq("id", memberId)
      .eq("hotel_id", hotelId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/staff");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Active / désactive rapidement un membre (depuis l'annuaire). */
export async function setStaffActive(
  memberId: string,
  active: boolean,
): Promise<FormState> {
  try {
    await assertAdmin();
    const hotelId = await getActiveHotelId();
    const supabase = await createClient();

    // Garde-fou : ne pas désactiver le dernier admin actif.
    if (!active) {
      const { data: member } = await supabase
        .from("hotel_users")
        .select("role")
        .eq("id", memberId)
        .eq("hotel_id", hotelId)
        .maybeSingle();
      if ((member as { role?: string } | null)?.role === "owner") {
        const { data: admins } = await supabase
          .from("hotel_users")
          .select("id")
          .eq("hotel_id", hotelId)
          .eq("role", "owner")
          .eq("active", true);
        if ((admins ?? []).length <= 1) {
          return {
            ok: false,
            error: "Impossible de désactiver le dernier administrateur.",
          };
        }
      }
    }

    const { error } = await supabase
      .from("hotel_users")
      .update({ active })
      .eq("id", memberId)
      .eq("hotel_id", hotelId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/staff");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Retire un membre de l'hôtel. */
export async function removeStaff(memberId: string): Promise<FormState> {
  try {
    await assertAdmin();
    const hotelId = await getActiveHotelId();
    const supabase = await createClient();

    const { data: member } = await supabase
      .from("hotel_users")
      .select("role")
      .eq("id", memberId)
      .eq("hotel_id", hotelId)
      .maybeSingle();
    if ((member as { role?: string } | null)?.role === "owner") {
      const { data: admins } = await supabase
        .from("hotel_users")
        .select("id")
        .eq("hotel_id", hotelId)
        .eq("role", "owner")
        .eq("active", true);
      if ((admins ?? []).length <= 1) {
        return {
          ok: false,
          error: "Impossible de retirer le dernier administrateur.",
        };
      }
    }

    const { error } = await supabase
      .from("hotel_users")
      .delete()
      .eq("id", memberId)
      .eq("hotel_id", hotelId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/staff");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
