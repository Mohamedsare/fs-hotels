import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/ui";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { HOTEL_CLASS, INVOICE_TYPE } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatCFA, formatDate, formatDateTime } from "@/lib/utils/format";
import type { Invoice, InvoiceItem } from "@/types/db";
import { PrintButton } from "./print-button";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hotel = await getActiveHotel();
  const supabase = await createClient();

  const [invRes, itemsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        "*, client:clients(id,name,phone), stay:stays(check_in_at,checked_out_at,expected_check_out,guests_count,room:rooms(number))",
      )
      .eq("id", id)
      .eq("hotel_id", hotel.id)
      .maybeSingle(),
    supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)
      .order("sort_order"),
  ]);

  if (!invRes.data) notFound();
  const inv = invRes.data as Invoice & {
    stay?: {
      check_in_at: string;
      checked_out_at: string | null;
      expected_check_out: string;
      guests_count: number;
      room?: { number?: string } | null;
    } | null;
  };
  const items = (itemsRes.data ?? []) as InvoiceItem[];
  const balance = Number(inv.total) - Number(inv.paid_total);
  const stay = inv.stay;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/invoices">
          <Button variant="ghost">← Retour</Button>
        </Link>
        <PrintButton />
      </div>

      <div
        id="fd-print-area"
        className="mx-auto max-w-2xl rounded-2xl border border-black/10 bg-white p-6 text-fs-text sm:p-8 print:border-0 print:p-0"
      >
        {/* En-tête hôtel */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <div className="text-xl font-extrabold">{hotel.name}</div>
            <div className="mt-1 text-xs text-fs-on-surface-variant">
              {HOTEL_CLASS[hotel.classification]}
              {hotel.address ? ` · ${hotel.address}` : ""}
              {hotel.city ? `, ${hotel.city}` : ""}
            </div>
            <div className="text-xs text-fs-on-surface-variant">
              {hotel.phone ? `Tél : ${hotel.phone}` : ""}
              {hotel.email ? ` · ${hotel.email}` : ""}
            </div>
            <div className="text-xs text-fs-on-surface-variant">
              {hotel.ifu ? `IFU : ${hotel.ifu}` : ""}
              {hotel.rccm ? ` · RCCM : ${hotel.rccm}` : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold uppercase">
              {INVOICE_TYPE[inv.type]}
            </div>
            <div className="text-sm font-semibold">{inv.number}</div>
            <div className="text-xs text-fs-on-surface-variant">
              {formatDate(inv.issued_at)}
            </div>
          </div>
        </div>

        {/* Client & séjour */}
        <div className="grid grid-cols-1 gap-4 py-4 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase text-fs-on-surface-variant">
              Client
            </div>
            <div className="font-medium">
              {inv.client?.name ?? "Client de passage"}
            </div>
            {inv.client?.phone ? (
              <div className="text-fs-on-surface-variant">
                {inv.client.phone}
              </div>
            ) : null}
          </div>
          {stay ? (
            <div className="sm:text-right">
              <div className="text-xs font-semibold uppercase text-fs-on-surface-variant">
                Séjour
              </div>
              {stay.room?.number ? (
                <div className="font-medium">Chambre {stay.room.number}</div>
              ) : null}
              <div className="text-fs-on-surface-variant">
                Du {formatDateTime(stay.check_in_at)}
              </div>
              <div className="text-fs-on-surface-variant">
                Au{" "}
                {formatDateTime(stay.checked_out_at ?? stay.expected_check_out)}
              </div>
            </div>
          ) : null}
        </div>

        {/* Lignes */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-black/10 text-left text-xs uppercase text-fs-on-surface-variant">
              <th className="py-2">Désignation</th>
              <th className="py-2 text-right">P.U.</th>
              <th className="py-2 text-right">Qté</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-black/5">
                <td className="py-2">{it.label}</td>
                <td className="py-2 text-right">{formatCFA(it.unit_price)}</td>
                <td className="py-2 text-right">{it.quantity}</td>
                <td className="py-2 text-right font-medium">
                  {formatCFA(it.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
          <Row label="Sous-total" value={formatCFA(inv.subtotal)} />
          {Number(inv.discount) > 0 ? (
            <Row label="Remise" value={`- ${formatCFA(inv.discount)}`} />
          ) : null}
          {Number(inv.tax_total) > 0 ? (
            <Row
              label="Taxe de développement touristique"
              value={formatCFA(inv.tax_total)}
            />
          ) : null}
          <div className="flex justify-between border-t border-black/10 pt-2 text-base font-extrabold">
            <span>Total</span>
            <span>{formatCFA(inv.total)}</span>
          </div>
          <Row label="Payé" value={formatCFA(inv.paid_total)} />
          <div className="flex justify-between font-bold">
            <span>Reste à payer</span>
            <span className={balance > 0 ? "text-red-600" : "text-green-700"}>
              {formatCFA(Math.max(0, balance))}
            </span>
          </div>
        </div>

        <div className="mt-8 flex justify-between text-xs text-fs-on-surface-variant">
          <div>Merci de votre confiance.</div>
          <div>Signature / Cachet</div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-fs-on-surface-variant">
      <span>{label}</span>
      <span className="text-fs-text">{value}</span>
    </div>
  );
}
