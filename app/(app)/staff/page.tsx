import { redirect } from "next/navigation";
import { ShieldCheck, User, UserCog, Users } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/ui/ui";
import { getActiveMembership } from "@/lib/hotel/membership";
import { isAdmin, ROLE_CAPABILITIES } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { HotelUser } from "@/types/db";
import {
  NewStaffButton,
  RoleGuide,
  StaffDirectory,
  type StaffRow,
} from "./staff-ui";

export default async function StaffPage() {
  const m = await getActiveMembership();
  if (!isAdmin(m)) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // Indicateurs synthétiques.
  const stats = {
    total: members.length,
    active: members.filter((x) => x.active).length,
    owners: members.filter((x) => x.role === "owner").length,
    managers: members.filter((x) => x.role === "manager").length,
    employees: members.filter(
      (x) => x.role !== "owner" && x.role !== "manager",
    ).length,
  };

  const cards = [
    { label: "Membres", value: stats.total, sub: `${stats.active} actif(s)`, icon: Users },
    { label: "Admins", value: stats.owners, sub: "Propriétaires", icon: ShieldCheck },
    { label: "Gérants", value: stats.managers, sub: "Exploitation", icon: UserCog },
    { label: "Employés", value: stats.employees, sub: "Accès limités", icon: User },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personnel"
        subtitle="Membres de l'équipe, rôles et accès par module"
        action={<NewStaffButton />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fs-accent/10 text-fs-accent">
              <c.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="text-2xl font-bold leading-none">{c.value}</div>
              <div className="mt-1 truncate text-xs text-fs-on-surface-variant">
                {c.label} · {c.sub}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {members.length === 0 ? (
        <EmptyState>Aucun membre pour le moment.</EmptyState>
      ) : (
        <StaffDirectory rows={rows} meId={user?.id ?? null} />
      )}

      <RoleGuide capabilities={ROLE_CAPABILITIES} />
    </div>
  );
}
