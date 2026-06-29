import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/ui";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/types/db";
import { NewClientButton } from "./client-form";

const TYPE_LABEL: Record<Client["type"], string> = {
  individual: "Particulier",
  company: "Entreprise",
  vip: "VIP",
  regular: "Régulier",
  agency: "Agence",
};

export default async function ClientsPage() {
  const hotel = await getActiveHotel();
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("hotel_id", hotel.id)
    .order("created_at", { ascending: false });
  const clients = (data ?? []) as Client[];

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} client(s)`}
        action={<NewClientButton />}
      />
      {clients.length === 0 ? (
        <EmptyState>Aucun client enregistré pour le moment.</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold">{c.name}</div>
                <Badge tone={c.type === "vip" ? "orange" : "neutral"}>
                  {TYPE_LABEL[c.type]}
                </Badge>
              </div>
              <div className="mt-1 text-sm text-fs-on-surface-variant">
                {c.phone ?? "—"}
                {c.company_name ? ` · ${c.company_name}` : ""}
              </div>
              {c.id_doc_number ? (
                <div className="mt-0.5 text-xs text-fs-on-surface-variant">
                  {c.id_doc_type ?? "Pièce"} : {c.id_doc_number}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}