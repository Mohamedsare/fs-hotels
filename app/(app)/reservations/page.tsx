import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/ui";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { RESERVATION_STATUS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatCFA, formatDate } from "@/lib/utils/format";
import type { Client, Reservation, Room, RoomType } from "@/types/db";
import {
  CheckInButton,
  NewReservationButton,
  ReservationActions,
} from "./reservation-ui";

export default async function ReservationsPage() {
  const hotel = await getActiveHotel();
  const supabase = await createClient();
  const [resvRes, clientsRes, typesRes, roomsRes] = await Promise.all([
    supabase
      .from("reservations")
      .select("*, client:clients(id,name,phone), room_type:room_types(id,name)")
      .eq("hotel_id", hotel.id)
      .order("check_in_date", { ascending: true }),
    supabase.from("clients").select("*").eq("hotel_id", hotel.id).order("name"),
    supabase
      .from("room_types")
      .select("*")
      .eq("hotel_id", hotel.id)
      .eq("active", true)
      .order("name"),
    supabase
      .from("rooms")
      .select("*, room_type:room_types(id,name,base_price)")
      .eq("hotel_id", hotel.id)
      .in("status", ["available", "clean"])
      .order("number"),
  ]);
  const reservations = (resvRes.data ?? []) as Reservation[];
  const clients = (clientsRes.data ?? []) as Client[];
  const roomTypes = (typesRes.data ?? []) as RoomType[];
  const availableRooms = (roomsRes.data ?? []) as Room[];

  return (
    <div>
      <PageHeader
        title="Réservations"
        subtitle={`${reservations.length} réservation(s)`}
        action={
          <NewReservationButton clients={clients} roomTypes={roomTypes} />
        }
      />
      {reservations.length === 0 ? (
        <EmptyState>Aucune réservation.</EmptyState>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => {
            const st = RESERVATION_STATUS[r.status];
            const canCheckIn =
              r.status === "confirmed" || r.status === "pending";
            return (
              <Card key={r.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {r.client?.name ?? "Client de passage"}
                      </span>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </div>
                    <div className="mt-0.5 text-sm text-fs-on-surface-variant">
                      {formatDate(r.check_in_date)} →{" "}
                      {formatDate(r.check_out_date)} · {r.guests_count} pers.
                      {r.room_type?.name ? ` · ${r.room_type.name}` : ""}
                    </div>
                    <div className="mt-0.5 text-xs text-fs-on-surface-variant">
                      Tarif {formatCFA(r.agreed_rate)} / nuit
                      {r.advance_paid
                        ? ` · avance ${formatCFA(r.advance_paid)}`
                        : ""}
                      {r.source ? ` · ${r.source}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canCheckIn ? (
                      <>
                        <CheckInButton
                          reservationId={r.id}
                          availableRooms={availableRooms}
                        />
                        <ReservationActions id={r.id} />
                      </>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}