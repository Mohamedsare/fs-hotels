import { Badge, EmptyState, PageHeader } from "@/components/ui/ui";
import { DataTable, type Column } from "@/components/ui/table";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { getActiveMembership } from "@/lib/hotel/membership";
import { can } from "@/lib/permissions";
import { PAYMENT_STATUS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatCFA, formatDate, nightsBetween } from "@/lib/utils/format";
import type { Client, Room, Service, Stay } from "@/types/db";
import {
  AddConsumptionButton,
  AddPaymentButton,
  CheckOutButton,
  NewWalkInStayButton,
} from "./stay-ui";

export default async function StaysPage() {
  const hotel = await getActiveHotel();
  const supabase = await createClient();
  const [staysRes, roomsRes, clientsRes, servicesRes] = await Promise.all([
    supabase
      .from("stays")
      .select("*, room:rooms(id,number), client:clients(id,name,phone)")
      .eq("hotel_id", hotel.id)
      .eq("status", "in_progress")
      .order("check_in_at", { ascending: true }),
    supabase
      .from("rooms")
      .select("*, room_type:room_types(id,name,base_price)")
      .eq("hotel_id", hotel.id)
      .in("status", ["available", "clean"])
      .order("number"),
    supabase.from("clients").select("*").eq("hotel_id", hotel.id).order("name"),
    supabase
      .from("services")
      .select("*")
      .eq("hotel_id", hotel.id)
      .eq("active", true)
      .order("name"),
  ]);
  const stays = (staysRes.data ?? []) as Stay[];
  const availableRooms = (roomsRes.data ?? []) as Room[];
  const clients = (clientsRes.data ?? []) as Client[];
  const services = (servicesRes.data ?? []) as Service[];

  const m = await getActiveMembership();
  const canWrite = can(m, "stays");

  const columns: Column<Stay>[] = [
    {
      key: "room",
      header: "Chambre",
      cell: (s) => (
        <span className="font-semibold text-fs-text">
          Ch. {s.room?.number ?? "—"}
        </span>
      ),
    },
    {
      key: "client",
      header: "Client",
      cell: (s) => s.client?.name ?? "Client de passage",
    },
    {
      key: "payment",
      header: "Paiement",
      cell: (s) => {
        const ps = PAYMENT_STATUS[s.payment_status];
        return <Badge tone={ps.tone}>{ps.label}</Badge>;
      },
    },
    {
      key: "period",
      header: "Séjour",
      cell: (s) => {
        const nights = nightsBetween(s.check_in_at, s.expected_check_out);
        return (
          <span className="whitespace-nowrap text-fs-on-surface-variant">
            {formatDate(s.check_in_at)} → {formatDate(s.expected_check_out)}
            <span className="text-fs-text"> · {nights} n.</span>
          </span>
        );
      },
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (s) => (
        <span className="font-bold text-fs-text">{formatCFA(s.grand_total)}</span>
      ),
    },
    {
      key: "paid",
      header: "Payé",
      align: "right",
      cell: (s) => formatCFA(s.paid_total),
    },
    {
      key: "balance",
      header: "Reste",
      align: "right",
      cell: (s) => {
        const balance = Number(s.grand_total) - Number(s.paid_total);
        return (
          <span
            className={
              balance > 0 ? "font-bold text-red-600" : "font-bold text-green-700"
            }
          >
            {formatCFA(Math.max(0, balance))}
          </span>
        );
      },
    },
  ];

  if (canWrite) {
    columns.push({
      key: "actions",
      header: "",
      align: "right",
      cell: (s) => (
        <div className="flex items-center justify-end gap-2">
          <AddConsumptionButton stayId={s.id} services={services} />
          <AddPaymentButton stayId={s.id} />
          <CheckOutButton stayId={s.id} />
        </div>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title="Séjours en cours"
        subtitle={`${stays.length} client(s) logé(s)`}
        action={
          canWrite ? (
            <NewWalkInStayButton
              availableRooms={availableRooms}
              clients={clients}
            />
          ) : undefined
        }
      />
      {stays.length === 0 ? (
        <EmptyState>
          Aucun séjour en cours. Faites un check-in depuis les réservations ou un
          check-in direct.
        </EmptyState>
      ) : (
        <DataTable columns={columns} rows={stays} rowKey={(s) => s.id} />
      )}
    </div>
  );
}