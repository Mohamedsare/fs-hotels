import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/ui";
import { DataTable, Dash, type Column } from "@/components/ui/table";
import { getActiveHotel } from "@/lib/hotel/active-hotel";
import { getActiveMembership } from "@/lib/hotel/membership";
import { can } from "@/lib/permissions";
import { PAYMENT_METHOD } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatCFA, formatDateTime } from "@/lib/utils/format";
import type { Payment, PaymentMethod } from "@/types/db";
import { NewExpenseButton } from "./cash-ui";

type PaymentRow = Payment & {
  stay?: { room?: { number?: string } | null } | null;
};

type Expense = {
  id: string;
  label: string;
  amount: number;
  method: PaymentMethod;
  spent_at: string;
};

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function CashPage() {
  const hotel = await getActiveHotel();
  const supabase = await createClient();
  const today = startOfTodayISO();

  const [payRes, expRes, payTodayRes, expTodayRes] = await Promise.all([
    supabase
      .from("payments")
      .select("*, stay:stays(room:rooms(number))")
      .eq("hotel_id", hotel.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("hotel_expenses")
      .select("*")
      .eq("hotel_id", hotel.id)
      .order("spent_at", { ascending: false })
      .limit(50),
    supabase
      .from("payments")
      .select("amount")
      .eq("hotel_id", hotel.id)
      .gte("created_at", today),
    supabase
      .from("hotel_expenses")
      .select("amount")
      .eq("hotel_id", hotel.id)
      .gte("spent_at", today),
  ]);

  const payments = (payRes.data ?? []) as PaymentRow[];
  const expenses = (expRes.data ?? []) as Expense[];

  const m = await getActiveMembership();
  const canWrite = can(m, "cash");

  const paymentCols: Column<PaymentRow>[] = [
    {
      key: "amount",
      header: "Montant",
      align: "right",
      cell: (p) => (
        <span className="font-bold text-green-700">{formatCFA(p.amount)}</span>
      ),
    },
    {
      key: "method",
      header: "Méthode",
      cell: (p) => <Badge tone="blue">{PAYMENT_METHOD[p.method]}</Badge>,
    },
    {
      key: "date",
      header: "Date",
      cell: (p) => (
        <span className="whitespace-nowrap text-fs-on-surface-variant">
          {formatDateTime(p.created_at)}
        </span>
      ),
    },
    {
      key: "room",
      header: "Chambre",
      cell: (p) => (p.stay?.room?.number ? `Ch. ${p.stay.room.number}` : <Dash />),
    },
    {
      key: "ref",
      header: "Référence",
      cell: (p) => p.reference ?? <Dash />,
    },
  ];

  const expenseCols: Column<Expense>[] = [
    {
      key: "label",
      header: "Libellé",
      cell: (e) => <span className="font-medium text-fs-text">{e.label}</span>,
    },
    {
      key: "method",
      header: "Méthode",
      cell: (e) => <Badge tone="neutral">{PAYMENT_METHOD[e.method]}</Badge>,
    },
    {
      key: "date",
      header: "Date",
      cell: (e) => (
        <span className="whitespace-nowrap text-fs-on-surface-variant">
          {formatDateTime(e.spent_at)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Montant",
      align: "right",
      cell: (e) => (
        <span className="font-bold text-red-600">-{formatCFA(e.amount)}</span>
      ),
    },
  ];
  const inToday = (payTodayRes.data ?? []).reduce(
    (s, p) => s + Number((p as { amount: number }).amount),
    0,
  );
  const outToday = (expTodayRes.data ?? []).reduce(
    (s, e) => s + Number((e as { amount: number }).amount),
    0,
  );

  return (
    <div>
      <PageHeader
        title="Caisse"
        subtitle="Encaissements et dépenses."
        action={canWrite ? <NewExpenseButton /> : undefined}
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Card>
          <div className="text-xs text-fs-on-surface-variant">
            Encaissé aujourd&apos;hui
          </div>
          <div className="mt-1 text-xl font-extrabold text-green-700">
            {formatCFA(inToday)}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-fs-on-surface-variant">
            Dépensé aujourd&apos;hui
          </div>
          <div className="mt-1 text-xl font-extrabold text-red-600">
            {formatCFA(outToday)}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-fs-on-surface-variant">Net</div>
          <div className="mt-1 text-xl font-extrabold">
            {formatCFA(inToday - outToday)}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 font-bold">Encaissements récents</h2>
          {payments.length === 0 ? (
            <EmptyState>Aucun encaissement.</EmptyState>
          ) : (
            <DataTable
              columns={paymentCols}
              rows={payments}
              rowKey={(p) => p.id}
            />
          )}
        </div>

        <div>
          <h2 className="mb-2 font-bold">Dépenses récentes</h2>
          {expenses.length === 0 ? (
            <EmptyState>Aucune dépense.</EmptyState>
          ) : (
            <DataTable columns={expenseCols} rows={expenses} rowKey={(e) => e.id} />
          )}
        </div>
      </div>
    </div>
  );
}