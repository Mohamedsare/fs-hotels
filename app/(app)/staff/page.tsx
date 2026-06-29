import { redirect } from "next/navigation";
import { Badge, EmptyState, PageHeader } from "@/components/ui/ui";
import { DataTable, type Column } from "@/components/ui/table";
import { RowActions } from "@/components/ui/row-actions";
import { getActiveMembership } from "@/lib/hotel/membership";
import {
  isAdmin,
  MODULE_LABELS,
  ROLE_LABELS,
  type Module,
} from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { HotelUser } from "@/types/db";
import { EditStaffButton, NewStaffButton, RemoveStaffButton } from "./staff-ui";

type StaffRow = HotelUser & { email: string };

export default async function StaffPage() {
  const m = await getActiveMembership();
  if (!isAdmin(m)) redirect("/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("hotel_users")
    .select("*")
    .eq("hotel_id", m.hotel.id)
    .order("created_at", { ascending: true });
  const members = (data ?? []) as HotelUser[];

  // E-mails via le client service-role (schéma auth non exposé via PostgREST).
  const admin = createAdminClient();
  const emails = new Map<string, string>();
  await Promise.all(
    members.map(async (mem) => {
      const { data: u } = await admin.auth.admin.getUserById(mem.user_id);
      if (u?.user?.email) emails.set(mem.user_id, u.user.email);
    }),
  );
  const rows: StaffRow[] = members.map((mem) => ({
    ...mem,
    email: emails.get(mem.user_id) ?? "—",
  }));

  const roleTone = (r: string) =>
    r === "owner" ? "orange" : r === "manager" ? "blue" : "neutral";

  const columns: Column<StaffRow>[] = [
    {
      key: "email",
      header: "Membre",
      cell: (r) => <span className="font-semibold text-fs-text">{r.email}</span>,
    },
    {
      key: "role",
      header: "Rôle",
      cell: (r) => <Badge tone={roleTone(r.role)}>{ROLE_LABELS[r.role] ?? r.role}</Badge>,
    },
    {
      key: "perms",
      header: "Accès",
      cell: (r) =>
        r.role === "employee" ? (
          r.permissions.length ? (
            <span className="text-fs-on-surface-variant">
              {r.permissions
                .map((p) => MODULE_LABELS[p as Module] ?? p)
                .join(", ")}
            </span>
          ) : (
            <span className="text-fs-on-surface-variant">aucun</span>
          )
        ) : (
          <span className="text-fs-on-surface-variant">Tous</span>
        ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (r) =>
        r.active ? (
          <Badge tone="green">Actif</Badge>
        ) : (
          <Badge tone="gray">Inactif</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <RowActions>
          <EditStaffButton member={r} />
          <RemoveStaffButton member={r} email={r.email} />
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Personnel"
        subtitle={`${members.length} membre(s)`}
        action={<NewStaffButton />}
      />
      {members.length === 0 ? (
        <EmptyState>Aucun membre pour le moment.</EmptyState>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
      )}
    </div>
  );
}
