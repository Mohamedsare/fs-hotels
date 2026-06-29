import { Badge, EmptyState, PageHeader } from "@/components/ui/ui";
import { DataTable, Dash, type Column } from "@/components/ui/table";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { INVOICE_TYPE } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatCFA, formatDate } from "@/lib/utils/format";
import type { Invoice } from "@/types/db";

export default async function InvoicesPage() {
  const hotel = await getActiveHotel();
  const supabase = await createClient();

  const { data } = await supabase
    .from("invoices")
    .select("*, client:clients(id,name,phone)")
    .eq("hotel_id", hotel.id)
    .order("issued_at", { ascending: false })
    .limit(100);
  const invoices = (data ?? []) as Invoice[];

  const columns: Column<Invoice>[] = [
    {
      key: "number",
      header: "N°",
      cell: (inv) => (
        <span className="font-semibold text-fs-text">{inv.number}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (inv) => <Badge tone="blue">{INVOICE_TYPE[inv.type]}</Badge>,
    },
    {
      key: "date",
      header: "Date",
      cell: (inv) => (
        <span className="text-fs-on-surface-variant">
          {formatDate(inv.issued_at)}
        </span>
      ),
    },
    {
      key: "client",
      header: "Client",
      cell: (inv) => inv.client?.name ?? <Dash />,
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (inv) => (
        <span className="font-bold text-fs-text">{formatCFA(inv.total)}</span>
      ),
    },
    {
      key: "balance",
      header: "Solde",
      align: "right",
      cell: (inv) => {
        const balance = Number(inv.total) - Number(inv.paid_total);
        return balance > 0 ? (
          <span className="font-semibold text-red-600">
            Reste {formatCFA(balance)}
          </span>
        ) : (
          <span className="font-semibold text-green-700">Soldée</span>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Factures & reçus"
        subtitle={`${invoices.length} document(s) émis`}
      />
      {invoices.length === 0 ? (
        <EmptyState>
          Aucune facture. Une facture est générée automatiquement à chaque
          check-out d&apos;un séjour.
        </EmptyState>
      ) : (
        <DataTable
          columns={columns}
          rows={invoices}
          rowKey={(inv) => inv.id}
          rowHref={(inv) => `/invoices/${inv.id}`}
        />
      )}
    </div>
  );
}
