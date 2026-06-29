import { redirect } from "next/navigation";
import { Badge, EmptyState, PageHeader } from "@/components/ui/ui";
import { DataTable, type Column } from "@/components/ui/table";
import { isPlatformAdmin } from "@/lib/hotel/membership";
import { HOTEL_CLASS } from "@/lib/labels";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";
import type { HotelClass } from "@/types/db";
import { ManageHotelButton } from "./platform-ui";

type HotelRow = {
  id: string;
  name: string;
  city: string | null;
  classification: HotelClass;
  created_at: string;
  created_by: string | null;
  email: string;
  rooms: number;
  members: number;
};

function tally(rows: { hotel_id: string }[] | null): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows ?? []) map.set(r.hotel_id, (map.get(r.hotel_id) ?? 0) + 1);
  return map;
}

export default async function PlatformPage() {
  if (!(await isPlatformAdmin())) redirect("/dashboard");

  const supabase = await createClient();
  const [hotelsRes, roomsRes, membersRes] = await Promise.all([
    supabase
      .from("hotels")
      .select("id, name, city, classification, created_at, created_by")
      .order("created_at", { ascending: false }),
    supabase.from("rooms").select("hotel_id"),
    supabase.from("hotel_users").select("hotel_id"),
  ]);

  const hotels = (hotelsRes.data ?? []) as Omit<
    HotelRow,
    "email" | "rooms" | "members"
  >[];
  const roomCount = tally(roomsRes.data as { hotel_id: string }[] | null);
  const memberCount = tally(membersRes.data as { hotel_id: string }[] | null);

  const admin = createAdminClient();
  const emails = new Map<string, string>();
  await Promise.all(
    hotels.map(async (h) => {
      if (!h.created_by) return;
      const { data: u } = await admin.auth.admin.getUserById(h.created_by);
      if (u?.user?.email) emails.set(h.id, u.user.email);
    }),
  );

  const rows: HotelRow[] = hotels.map((h) => ({
    ...h,
    email: emails.get(h.id) ?? "—",
    rooms: roomCount.get(h.id) ?? 0,
    members: memberCount.get(h.id) ?? 0,
  }));

  const columns: Column<HotelRow>[] = [
    {
      key: "name",
      header: "Hôtel",
      cell: (h) => (
        <div className="min-w-0">
          <div className="font-semibold text-fs-text">{h.name}</div>
          {h.city ? (
            <div className="text-xs text-fs-on-surface-variant">{h.city}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: "class",
      header: "Classement",
      cell: (h) => <Badge tone="neutral">{HOTEL_CLASS[h.classification]}</Badge>,
    },
    {
      key: "owner",
      header: "Propriétaire",
      cell: (h) => (
        <span className="text-fs-on-surface-variant">{h.email}</span>
      ),
    },
    {
      key: "rooms",
      header: "Chambres",
      align: "right",
      cell: (h) => h.rooms,
    },
    {
      key: "members",
      header: "Membres",
      align: "right",
      cell: (h) => h.members,
    },
    {
      key: "created",
      header: "Créé",
      cell: (h) => (
        <span className="whitespace-nowrap text-fs-on-surface-variant">
          {formatDate(h.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (h) => (
        <div className="flex justify-end">
          <ManageHotelButton hotelId={h.id} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Plateforme"
        subtitle={`${hotels.length} hôtel(s) sur FasoStock Hôtels`}
      />
      {hotels.length === 0 ? (
        <EmptyState>Aucun hôtel enregistré.</EmptyState>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(h) => h.id} />
      )}
    </div>
  );
}
