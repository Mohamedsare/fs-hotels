import { Card, PageHeader } from "@/components/ui/ui";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { createClient } from "@/lib/supabase/server";
import { formatCFA } from "@/lib/utils/format";
import type { RoomStatus } from "@/types/db";

function monthStartISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export default async function ReportsPage() {
  const hotel = await getActiveHotel();
  const supabase = await createClient();
  const monthStart = monthStartISO();

  const [roomsRes, payMonthRes, expMonthRes, staysMonthRes, taxMonthRes] =
    await Promise.all([
      supabase
        .from("rooms")
        .select("status")
        .eq("hotel_id", hotel.id)
        .eq("active", true),
      supabase
        .from("payments")
        .select("amount")
        .eq("hotel_id", hotel.id)
        .gte("created_at", monthStart),
      supabase
        .from("hotel_expenses")
        .select("amount")
        .eq("hotel_id", hotel.id)
        .gte("spent_at", monthStart),
      supabase
        .from("stays")
        .select("id", { count: "exact", head: true })
        .eq("hotel_id", hotel.id)
        .gte("check_in_at", monthStart),
      supabase
        .from("stays")
        .select("tax_total")
        .eq("hotel_id", hotel.id)
        .gte("check_in_at", monthStart),
    ]);

  const rooms = (roomsRes.data ?? []) as { status: RoomStatus }[];
  const total = rooms.length;
  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const revenue = (payMonthRes.data ?? []).reduce(
    (s, p) => s + Number((p as { amount: number }).amount),
    0,
  );
  const expenses = (expMonthRes.data ?? []).reduce(
    (s, e) => s + Number((e as { amount: number }).amount),
    0,
  );
  const taxCollected = (taxMonthRes.data ?? []).reduce(
    (s, t) => s + Number((t as { tax_total: number }).tax_total),
    0,
  );

  const stats: { label: string; value: string; tone?: string }[] = [
    { label: "Chiffre d'affaires (mois)", value: formatCFA(revenue) },
    { label: "Dépenses (mois)", value: formatCFA(expenses) },
    {
      label: "Bénéfice estimé",
      value: formatCFA(revenue - expenses),
    },
    { label: "Séjours ouverts (mois)", value: String(staysMonthRes.count ?? 0) },
    { label: "Taxe touristique collectée", value: formatCFA(taxCollected) },
    { label: "Taux d'occupation actuel", value: `${occupancy} %` },
  ];

  return (
    <div>
      <PageHeader
        title="Rapports"
        subtitle="Synthèse du mois en cours."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="text-xs font-medium text-fs-on-surface-variant">
              {s.label}
            </div>
            <div className="mt-1 text-xl font-extrabold">{s.value}</div>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-fs-on-surface-variant">
        Rapports détaillés (par chambre, par réceptionniste, export PDF/Excel,
        déclaration de taxe touristique) — phase suivante.
      </p>
    </div>
  );
}