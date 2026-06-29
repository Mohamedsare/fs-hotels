import { Badge, EmptyState, PageHeader } from "@/components/ui/ui";
import { DataTable, Dash, type Column } from "@/components/ui/table";
import { DeleteButton, RowActions } from "@/components/ui/row-actions";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { getActiveMembership } from "@/lib/hotel/membership";
import { canDelete, isAdmin } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatCFA } from "@/lib/utils/format";
import type { RoomType } from "@/types/db";
import { deleteRoomType } from "./actions";
import { EditRoomTypeButton, NewRoomTypeButton } from "./room-type-form";

export default async function RoomTypesPage() {
  const hotel = await getActiveHotel();
  const supabase = await createClient();
  const { data } = await supabase
    .from("room_types")
    .select("*")
    .eq("hotel_id", hotel.id)
    .order("created_at", { ascending: true });
  const types = (data ?? []) as RoomType[];

  const m = await getActiveMembership();
  const canWrite = isAdmin(m) || m.role === "manager";
  const canDel = canDelete(m);

  const columns: Column<RoomType>[] = [
    {
      key: "name",
      header: "Type",
      cell: (t) => (
        <div className="min-w-0">
          <div className="font-semibold text-fs-text">{t.name}</div>
          {t.description ? (
            <div className="truncate text-xs text-fs-on-surface-variant">
              {t.description}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (t) =>
        t.active ? (
          <Badge tone="green">Actif</Badge>
        ) : (
          <Badge tone="gray">Inactif</Badge>
        ),
    },
    {
      key: "occupancy",
      header: "Capacité",
      align: "right",
      cell: (t) => `${t.max_occupancy} pers.`,
    },
    {
      key: "deposit",
      header: "Caution",
      align: "right",
      cell: (t) => (t.deposit ? formatCFA(t.deposit) : <Dash />),
    },
    {
      key: "price",
      header: "Prix / nuit",
      align: "right",
      cell: (t) => (
        <span className="font-bold text-fs-accent">{formatCFA(t.base_price)}</span>
      ),
    },
  ];

  if (canWrite || canDel) {
    columns.push({
      key: "actions",
      header: "",
      align: "right",
      cell: (t) => (
        <RowActions>
          {canWrite ? <EditRoomTypeButton roomType={t} /> : null}
          {canDel ? (
            <DeleteButton
              action={deleteRoomType.bind(null, t.id)}
              itemLabel={t.name}
            />
          ) : null}
        </RowActions>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title="Types de chambres"
        subtitle="Catégories et tarifs de base."
        action={canWrite ? <NewRoomTypeButton /> : undefined}
      />
      {types.length === 0 ? (
        <EmptyState>
          Aucun type. Créez-en un (ex. Standard, VIP) pour pouvoir ajouter des
          chambres.
        </EmptyState>
      ) : (
        <DataTable columns={columns} rows={types} rowKey={(t) => t.id} />
      )}
    </div>
  );
}