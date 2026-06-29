import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/ui";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { createClient } from "@/lib/supabase/server";
import { formatCFA } from "@/lib/utils/format";
import type { RoomType } from "@/types/db";
import { NewRoomTypeButton } from "./room-type-form";

export default async function RoomTypesPage() {
  const hotel = await getActiveHotel();
  const supabase = await createClient();
  const { data } = await supabase
    .from("room_types")
    .select("*")
    .eq("hotel_id", hotel.id)
    .order("created_at", { ascending: true });
  const types = (data ?? []) as RoomType[];

  return (
    <div>
      <PageHeader
        title="Types de chambres"
        subtitle="Catégories et tarifs de base."
        action={<NewRoomTypeButton />}
      />
      {types.length === 0 ? (
        <EmptyState>
          Aucun type. Créez-en un (ex. Standard, VIP) pour pouvoir ajouter des
          chambres.
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((t) => (
            <Card key={t.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold">{t.name}</div>
                {t.active ? (
                  <Badge tone="green">Actif</Badge>
                ) : (
                  <Badge tone="gray">Inactif</Badge>
                )}
              </div>
              {t.description ? (
                <p className="mt-1 text-sm text-fs-on-surface-variant">
                  {t.description}
                </p>
              ) : null}
              <div className="mt-3 text-lg font-extrabold text-fs-accent">
                {formatCFA(t.base_price)}
                <span className="text-xs font-medium text-fs-on-surface-variant">
                  {" "}
                  / nuit
                </span>
              </div>
              <div className="mt-1 text-xs text-fs-on-surface-variant">
                {t.max_occupancy} pers. max
                {t.deposit ? ` · caution ${formatCFA(t.deposit)}` : ""}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}