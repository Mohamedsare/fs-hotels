import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/ui";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { HOTEL_CLASS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import {
  formatCFA,
  formatDate,
  formatDateTime,
  nightsBetween,
} from "@/lib/utils/format";
import type { ServiceConsumption, Stay } from "@/types/db";
import { PrintButton } from "../../../invoices/[id]/print-button";

/**
 * Reçu / note de séjour imprimable, accessible depuis la réception à tout
 * moment (document provisoire tant que le séjour n'est pas clôturé). La facture
 * définitive est générée au check-out (route /invoices/[id]).
 */
export default async function StayReceiptPage({
  params,
}: {
  params: Promise<{ stayId: string }>;
}) {
  const { stayId } = await params;
  const hotel = await getActiveHotel();
  const supabase = await createClient();

  const [stayRes, consRes] = await Promise.all([
    supabase
      .from("stays")
      .select(
        "*, room:rooms(number), client:clients(id,name,phone)",
      )
      .eq("id", stayId)
      .eq("hotel_id", hotel.id)
      .maybeSingle(),
    supabase
      .from("service_consumptions")
      .select("*")
      .eq("stay_id", stayId)
      .order("created_at", { ascending: true }),
  ]);

  if (!stayRes.data) notFound();
  const stay = stayRes.data as Stay & {
    room?: { number?: string } | null;
    client?: { id: string; name: string; phone: string | null } | null;
  };
  const cons = (consRes.data ?? []) as ServiceConsumption[];

  const end = stay.checked_out_at ?? stay.expected_check_out;
  const nights = nightsBetween(stay.check_in_at, end);
  const balance = Number(stay.grand_total) - Number(stay.paid_total);
  const provisional = stay.status === "in_progress";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/reception">
          <Button variant="ghost">← Réception</Button>
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
              {provisional ? "Note de séjour" : "Reçu"}
            </div>
            {provisional ? (
              <div className="text-xs font-semibold text-orange-600">
                Document provisoire
              </div>
            ) : null}
            <div className="text-xs text-fs-on-surface-variant">
              {formatDate(new Date())}
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
              {stay.client?.name ?? "Client de passage"}
            </div>
            {stay.client?.phone ? (
              <div className="text-fs-on-surface-variant">{stay.client.phone}</div>
            ) : null}
          </div>
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
              Au {formatDateTime(end)}
            </div>
          </div>
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
            <tr className="border-b border-black/5">
              <td className="py-2">Nuitées</td>
              <td className="py-2 text-right">{formatCFA(stay.nightly_rate)}</td>
              <td className="py-2 text-right">{nights}</td>
              <td className="py-2 text-right font-medium">
                {formatCFA(stay.room_total)}
              </td>
            </tr>
            {cons.map((c) => (
              <tr key={c.id} className="border-b border-black/5">
                <td className="py-2">{c.label}</td>
                <td className="py-2 text-right">{formatCFA(c.unit_price)}</td>
                <td className="py-2 text-right">{c.quantity}</td>
                <td className="py-2 text-right font-medium">
                  {formatCFA(c.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
          <Row
            label="Sous-total"
            value={formatCFA(
              Number(stay.room_total) + Number(stay.services_total),
            )}
          />
          {Number(stay.discount_total) > 0 ? (
            <Row label="Remise" value={`- ${formatCFA(stay.discount_total)}`} />
          ) : null}
          {Number(stay.tax_total) > 0 ? (
            <Row
              label="Taxe de développement touristique"
              value={formatCFA(stay.tax_total)}
            />
          ) : null}
          <div className="flex justify-between border-t border-black/10 pt-2 text-base font-extrabold">
            <span>Total</span>
            <span>{formatCFA(stay.grand_total)}</span>
          </div>
          <Row label="Payé" value={formatCFA(stay.paid_total)} />
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
