import { Badge, EmptyState, PageHeader } from "@/components/ui/ui";
import { DataTable, Dash, type Column } from "@/components/ui/table";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { getActiveMembership } from "@/lib/hotel/membership";
import { can } from "@/lib/permissions";
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

  const m = await getActiveMembership();
  const canWrite = can(m, "reservations");

  const columns: Column<Reservation>[] = [
    {
      key: "client",
      header: "Client",
      cell: (r) => (
        <span className="font-semibold text-fs-text">
          {r.client?.name ?? "Client de passage"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (r) => {
        const st = RESERVATION_STATUS[r.status];
        return <Badge tone={st.tone}>{st.label}</Badge>;
      },
    },
    {
      key: "dates",
      header: "Séjour",
      cell: (r) => (
        <span className="whitespace-nowrap">
          {formatDate(r.check_in_date)} → {formatDate(r.check_out_date)}
        </span>
      ),
    },
    {
      key: "guests",
      header: "Pers.",
      align: "right",
      cell: (r) => r.guests_count,
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => r.room_type?.name ?? <Dash />,
    },
    {
      key: "rate",
      header: "Tarif / nuit",
      align: "right",
      cell: (r) => formatCFA(r.agreed_rate),
    },
    {
      key: "advance",
      header: "Avance",
      align: "right",
      cell: (r) => (r.advance_paid ? formatCFA(r.advance_paid) : <Dash />),
    },
  ];

  if (canWrite) {
    columns.push({
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => {
        const canCheckIn = r.status === "confirmed" || r.status === "pending";
        if (!canCheckIn) return <Dash />;
        return (
          <div className="flex items-center justify-end gap-2">
            <CheckInButton
              reservationId={r.id}
              availableRooms={availableRooms}
            />
            <ReservationActions id={r.id} />
          </div>
        );
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Réservations"
        subtitle={`${reservations.length} réservation(s)`}
        action={
          canWrite ? (
            <NewReservationButton clients={clients} roomTypes={roomTypes} />
          ) : undefined
        }
      />
      {reservations.length === 0 ? (
        <EmptyState>Aucune réservation.</EmptyState>
      ) : (
        <DataTable columns={columns} rows={reservations} rowKey={(r) => r.id} />
      )}
    </div>
  );
}