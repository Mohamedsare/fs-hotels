import { redirect } from "next/navigation";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { getActiveMembership } from "@/lib/hotel/membership";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type {
  Client,
  Reservation,
  Room,
  Service,
  ServiceConsumption,
  Stay,
} from "@/types/db";
import { ReceptionBoard } from "./reception-board";

/** Date du jour au format yyyy-mm-dd (heure locale serveur). */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default async function ReceptionPage() {
  const m = await getActiveMembership();
  // Cœur du métier réception : nécessite au minimum l'accès aux séjours.
  if (!can(m, "stays") && !can(m, "reservations")) redirect("/dashboard");

  const hotel = await getActiveHotel();
  const supabase = await createClient();
  const today = todayStr();

  const [roomsRes, staysRes, clientsRes, servicesRes, taxRes] = await Promise.all([
    supabase
      .from("rooms")
      .select("*, room_type:room_types(id,name,base_price)")
      .eq("hotel_id", hotel.id)
      .eq("active", true)
      .order("number"),
    supabase
      .from("stays")
      .select("*, room:rooms(id,number), client:clients(id,name,phone)")
      .eq("hotel_id", hotel.id)
      .eq("status", "in_progress")
      .order("check_in_at", { ascending: true }),
    supabase
      .from("clients")
      .select("id,name,phone")
      .eq("hotel_id", hotel.id)
      .order("name"),
    supabase
      .from("services")
      .select("*")
      .eq("hotel_id", hotel.id)
      .eq("active", true)
      .order("name"),
    supabase
      .from("tax_settings")
      .select("tourism_tax_per_night")
      .eq("hotel_id", hotel.id)
      .maybeSingle(),
  ]);

  const rooms = (roomsRes.data ?? []) as Room[];
  const stays = (staysRes.data ?? []) as Stay[];
  const clients = (clientsRes.data ?? []) as Pick<
    Client,
    "id" | "name" | "phone"
  >[];
  const services = (servicesRes.data ?? []) as Service[];
  const taxPerNight = Number(
    (taxRes.data as { tourism_tax_per_night?: number } | null)
      ?.tourism_tax_per_night ?? 0,
  );

  // Consommations des séjours en cours (pour le panneau de droite).
  const stayIds = stays.map((s) => s.id);
  let consumptions: ServiceConsumption[] = [];
  if (stayIds.length) {
    const { data } = await supabase
      .from("service_consumptions")
      .select("*")
      .in("stay_id", stayIds)
      .order("created_at", { ascending: true });
    consumptions = (data ?? []) as ServiceConsumption[];
  }

  // Arrivées du jour : réservations attendues aujourd'hui, pas encore arrivées.
  const { data: arrivalsData } = await supabase
    .from("reservations")
    .select("*, client:clients(id,name,phone), room_type:room_types(id,name)")
    .eq("hotel_id", hotel.id)
    .in("status", ["pending", "confirmed"])
    .eq("check_in_date", today)
    .order("check_in_date");
  const arrivals = (arrivalsData ?? []) as Reservation[];

  // Indicateurs (cartes du haut).
  const freeRooms = rooms.filter(
    (r) => r.status === "available" || r.status === "clean",
  ).length;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const dirtyRooms = rooms.filter(
    (r) => r.status === "dirty" || r.status === "cleaning",
  ).length;
  const departuresToday = stays.filter(
    (s) => (s.expected_check_out ?? "").slice(0, 10) === today,
  ).length;
  const unpaidStays = stays.filter(
    (s) => Number(s.grand_total) - Number(s.paid_total) > 0,
  ).length;

  const stats = {
    free: freeRooms,
    occupied: occupiedRooms,
    reservations: arrivals.length,
    departures: departuresToday,
    dirty: dirtyRooms,
    unpaid: unpaidStays,
  };

  return (
    <ReceptionBoard
      hotelName={hotel.name}
      today={today}
      stats={stats}
      rooms={rooms}
      stays={stays}
      consumptions={consumptions}
      clients={clients}
      services={services}
      arrivals={arrivals}
      taxPerNight={taxPerNight}
      canCash={can(m, "cash")}
      canInvoices={can(m, "invoices")}
      canReservations={can(m, "reservations")}
    />
  );
}
