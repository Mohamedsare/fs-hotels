import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/ui";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { ROOM_STATUS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatCFA } from "@/lib/utils/format";
import type { Room, RoomType } from "@/types/db";
import { NewRoomButton, RoomStatusSelect } from "./room-form";

export default async function RoomsPage() {
  const hotel = await getActiveHotel();
  const supabase = await createClient();
  const [roomsRes, typesRes] = await Promise.all([
    supabase
      .from("rooms")
      .select("*, room_type:room_types(id,name,base_price)")
      .eq("hotel_id", hotel.id)
      .order("number", { ascending: true }),
    supabase
      .from("room_types")
      .select("*")
      .eq("hotel_id", hotel.id)
      .eq("active", true)
      .order("name"),
  ]);
  const rooms = (roomsRes.data ?? []) as Room[];
  const roomTypes = (typesRes.data ?? []) as RoomType[];

  return (
    <div>
      <PageHeader
        title="Chambres"
        subtitle={`${rooms.length} chambre(s)`}
        action={<NewRoomButton roomTypes={roomTypes} />}
      />
      {rooms.length === 0 ? (
        <EmptyState>
          Aucune chambre. Créez d&apos;abord un type de chambre, puis ajoutez vos
          chambres.
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((r) => {
            const st = ROOM_STATUS[r.status];
            return (
              <Card key={r.id}>
                <div className="flex items-start justify-between">
                  <div className="text-lg font-bold">Ch. {r.number}</div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>
                <div className="mt-0.5 text-sm text-fs-on-surface-variant">
                  {r.room_type?.name ?? "Sans type"}
                  {r.floor ? ` · étage ${r.floor}` : ""}
                </div>
                {r.room_type?.base_price ? (
                  <div className="mt-1 text-sm font-semibold text-fs-accent">
                    {formatCFA(r.room_type.base_price)} / nuit
                  </div>
                ) : null}
                <div className="mt-3">
                  <RoomStatusSelect id={r.id} status={r.status} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}