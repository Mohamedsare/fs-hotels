"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_HOTEL_COOKIE } from "@/lib/hotel/active-hotel";

/** Bascule l'hôtel actif (cookie) puis revient au tableau de bord. */
export async function setActiveHotel(hotelId: string) {
  const store = await cookies();
  store.set(ACTIVE_HOTEL_COOKIE, hotelId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/dashboard");
}
