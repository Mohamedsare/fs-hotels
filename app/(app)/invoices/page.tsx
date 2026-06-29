import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/ui";
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
        <div className="space-y-2">
          {invoices.map((inv) => {
            const balance = Number(inv.total) - Number(inv.paid_total);
            return (
              <Link key={inv.id} href={`/invoices/${inv.id}`} className="block">
                <Card className="flex flex-wrap items-center justify-between gap-3 transition-colors hover:bg-fs-surface-container">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{inv.number}</span>
                      <Badge tone="blue">{INVOICE_TYPE[inv.type]}</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-fs-on-surface-variant">
                      {formatDate(inv.issued_at)}
                      {inv.client?.name ? ` · ${inv.client.name}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold">{formatCFA(inv.total)}</div>
                    <div className="text-xs text-fs-on-surface-variant">
                      {balance > 0 ? (
                        <span className="font-semibold text-red-600">
                          Reste {formatCFA(balance)}
                        </span>
                      ) : (
                        <span className="font-semibold text-green-700">Soldée</span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
