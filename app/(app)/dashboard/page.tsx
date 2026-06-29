import { Card, PageHeader } from "@/components/ui/ui";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { createClient } from "@/lib/supabase/server";
import { formatCFA } from "@/lib/utils/format";
import type { RoomStatus } from "@/types/db";

function todayParts() {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  d.setHours(0, 0, 0, 0);
  return { date, startISO: d.toISOString() };
}

export default async function DashboardPage() {
  const hotel = await getActiveHotel();
  const supabase = await createClient();
  const { date, startISO } = todayParts();

  const [roomsRes, payRes, arrivalsRes, departuresRes] = await Promise.all([
    supabase
      .from("rooms")
      .select("status")
      .eq("hotel_id", hotel.id)
      .eq("active", true),
    supabase
      .from("payments")
      .select("amount")
      .eq("hotel_id", hotel.id)
      .gte("created_at", startISO),
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("hotel_id", hotel.id)
      .in("status", ["pending", "confirmed"])
      .eq("check_in_date", date),
    supabase
      .from("stays")
      .select("id", { count: "exact", head: true })
      .eq("hotel_id", hotel.id)
      .eq("status", "in_progress")
      .eq("expected_check_out", date),
  ]);

  const rooms = (roomsRes.data ?? []) as { status: RoomStatus }[];
  const total = rooms.length;
  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const free = rooms.filter(
    (r) => r.status === "available" || r.status === "clean",
  ).length;
  const caToday = (payRes.data ?? []).reduce(
    (s, p) => s + Number((p as { amount: number }).amount),
    0,
  );
  const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const cards: { label: string; value: string; hint?: string }[] = [
    { label: "Chambres libres", value: String(free) },
    { label: "Chambres occupées", value: String(occupied) },
    { label: "Arrivées du jour", value: String(arrivalsRes.count ?? 0) },
    { label: "Départs du jour", value: String(departuresRes.count ?? 0) },
    { label: "Encaissé aujourd'hui", value: formatCFA(caToday) },
    { label: "Taux d'occupation", value: `${occupancy}`, hint: "%" },
  ];

  return (
    <div>
      <PageHeader title={hotel.name} subtitle="Vue d'ensemble de l'hôtel." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <div className="text-xs font-medium text-fs-on-surface-variant">
              {c.label}
            </div>
            <div className="mt-1 text-2xl font-extrabold">
              {c.value}
              {c.hint ? (
                <span className="ml-1 text-sm font-semibold text-fs-on-surface-variant">
                  {c.hint}
                </span>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}