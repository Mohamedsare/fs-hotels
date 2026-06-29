import { Badge, EmptyState, PageHeader } from "@/components/ui/ui";
import { DataTable, Dash, type Column } from "@/components/ui/table";
import { DeleteButton, RowActions } from "@/components/ui/row-actions";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { getActiveMembership } from "@/lib/hotel/membership";
import { can, canDelete } from "@/lib/permissions";
import { ROOM_STATUS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatCFA } from "@/lib/utils/format";
import type { Room, RoomType } from "@/types/db";
import { deleteRoom } from "./actions";
import { EditRoomButton, NewRoomButton, RoomStatusSelect } from "./room-form";

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

  const m = await getActiveMembership();
  const canWrite = can(m, "rooms");
  const canDel = canDelete(m);

  const columns: Column<Room>[] = [
    {
      key: "number",
      header: "Chambre",
      cell: (r) => <span className="font-semibold text-fs-text">Ch. {r.number}</span>,
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => r.room_type?.name ?? <Dash />,
    },
    {
      key: "floor",
      header: "Étage",
      cell: (r) => r.floor ?? <Dash />,
    },
    {
      key: "price",
      header: "Prix / nuit",
      align: "right",
      cell: (r) =>
        r.room_type?.base_price ? (
          <span className="font-semibold text-fs-accent">
            {formatCFA(r.room_type.base_price)}
          </span>
        ) : (
          <Dash />
        ),
    },
    {
      key: "current",
      header: "État",
      cell: (r) => {
        const st = ROOM_STATUS[r.status];
        return <Badge tone={st.tone}>{st.label}</Badge>;
      },
    },
  ];

  if (canWrite) {
    columns.push({
      key: "action",
      header: "Changer",
      align: "right",
      cell: (r) => (
        <div className="flex justify-end">
          <RoomStatusSelect id={r.id} status={r.status} />
        </div>
      ),
    });
  }

  if (canWrite || canDel) {
    columns.push({
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <RowActions>
          {canWrite ? <EditRoomButton room={r} roomTypes={roomTypes} /> : null}
          {canDel ? (
            <DeleteButton
              action={deleteRoom.bind(null, r.id)}
              itemLabel={`Ch. ${r.number}`}
            />
          ) : null}
        </RowActions>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title="Chambres"
        subtitle={`${rooms.length} chambre(s)`}
        action={canWrite ? <NewRoomButton roomTypes={roomTypes} /> : undefined}
      />
      {rooms.length === 0 ? (
        <EmptyState>
          Aucune chambre. Créez d&apos;abord un type de chambre, puis ajoutez vos
          chambres.
        </EmptyState>
      ) : (
        <DataTable columns={columns} rows={rooms} rowKey={(r) => r.id} />
      )}
    </div>
  );
}