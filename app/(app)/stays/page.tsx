import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/ui";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
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

  return (
    <div>
      <PageHeader
        title="Séjours en cours"
        subtitle={`${stays.length} client(s) logé(s)`}
        action={
          <NewWalkInStayButton availableRooms={availableRooms} clients={clients} />
        }
      />
      {stays.length === 0 ? (
        <EmptyState>
          Aucun séjour en cours. Faites un check-in depuis les réservations ou un
          check-in direct.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {stays.map((s) => {
            const ps = PAYMENT_STATUS[s.payment_status];
            const nights = nightsBetween(s.check_in_at, s.expected_check_out);
            const balance = Number(s.grand_total) - Number(s.paid_total);
            return (
              <Card key={s.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">
                        Ch. {s.room?.number ?? "—"}
                      </span>
                      <span className="font-medium">
                        {s.client?.name ?? "Client de passage"}
                      </span>
                      <Badge tone={ps.tone}>{ps.label}</Badge>
                    </div>
                    <div className="mt-0.5 text-sm text-fs-on-surface-variant">
                      Entré le {formatDate(s.check_in_at)} · départ prévu{" "}
                      {formatDate(s.expected_check_out)} · {nights} nuit(s) ·{" "}
                      {formatCFA(s.nightly_rate)}/nuit
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-fs-on-surface-variant">
                      Total estimé
                    </div>
                    <div className="text-lg font-extrabold">
                      {formatCFA(s.grand_total)}
                    </div>
                    <div className="text-xs text-fs-on-surface-variant">
                      Payé {formatCFA(s.paid_total)} · Reste{" "}
                      <span
                        className={
                          balance > 0
                            ? "font-bold text-red-600"
                            : "font-bold text-green-700"
                        }
                      >
                        {formatCFA(Math.max(0, balance))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-fs-on-surface-variant sm:grid-cols-4">
                  <div>
                    Chambre
                    <div className="font-semibold text-fs-text">
                      {formatCFA(s.room_total)}
                    </div>
                  </div>
                  <div>
                    Consommations
                    <div className="font-semibold text-fs-text">
                      {formatCFA(s.services_total)}
                    </div>
                  </div>
                  <div>
                    Taxe touristique
                    <div className="font-semibold text-fs-text">
                      {formatCFA(s.tax_total)}
                    </div>
                  </div>
                  <div>
                    Personnes
                    <div className="font-semibold text-fs-text">
                      {s.guests_count}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <AddConsumptionButton stayId={s.id} services={services} />
                  <AddPaymentButton stayId={s.id} />
                  <CheckOutButton stayId={s.id} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}