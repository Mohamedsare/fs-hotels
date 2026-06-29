import { Badge, EmptyState, PageHeader } from "@/components/ui/ui";
import { DataTable, Dash, type Column } from "@/components/ui/table";
import { DeleteButton, RowActions } from "@/components/ui/row-actions";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { getActiveMembership } from "@/lib/hotel/membership";
import { can, canDelete } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/types/db";
import { deleteClientRecord } from "./actions";
import { EditClientButton, NewClientButton } from "./client-form";

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

  const m = await getActiveMembership();
  const canWrite = can(m, "clients");
  const canDel = canDelete(m);

  const columns: Column<Client>[] = [
    {
      key: "name",
      header: "Nom",
      cell: (c) => <span className="font-semibold text-fs-text">{c.name}</span>,
    },
    {
      key: "type",
      header: "Type",
      cell: (c) => (
        <Badge tone={c.type === "vip" ? "orange" : "neutral"}>
          {TYPE_LABEL[c.type]}
        </Badge>
      ),
    },
    {
      key: "phone",
      header: "Téléphone",
      cell: (c) => c.phone ?? <Dash />,
    },
    {
      key: "company",
      header: "Société",
      cell: (c) => c.company_name ?? <Dash />,
    },
    {
      key: "doc",
      header: "Pièce",
      cell: (c) =>
        c.id_doc_number ? (
          <span className="text-fs-on-surface-variant">
            {c.id_doc_type ?? "Pièce"} · {c.id_doc_number}
          </span>
        ) : (
          <Dash />
        ),
    },
  ];

  if (canWrite || canDel) {
    columns.push({
      key: "actions",
      header: "",
      align: "right",
      cell: (c) => (
        <RowActions>
          {canWrite ? <EditClientButton client={c} /> : null}
          {canDel ? (
            <DeleteButton
              action={deleteClientRecord.bind(null, c.id)}
              itemLabel={c.name}
            />
          ) : null}
        </RowActions>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} client(s)`}
        action={canWrite ? <NewClientButton /> : undefined}
      />
      {clients.length === 0 ? (
        <EmptyState>Aucun client enregistré pour le moment.</EmptyState>
      ) : (
        <DataTable columns={columns} rows={clients} rowKey={(c) => c.id} />
      )}
    </div>
  );
}