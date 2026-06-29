import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/hotel/membership";
import { can, isAdmin } from "@/lib/permissions";
import { SidebarNav } from "./sidebar-nav";

// Garde d'authentification : tout l'espace (app) exige une session.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const m = await getActiveMembership();
  const admin = isAdmin(m);
  const canCatalog = admin || m.role === "manager";

  // Entrées de navigation autorisées selon le rôle / les permissions.
  const allowed = [
    "/dashboard",
    can(m, "reservations") && "/reservations",
    can(m, "stays") && "/stays",
    can(m, "rooms") && "/rooms",
    canCatalog && "/room-types",
    can(m, "clients") && "/clients",
    can(m, "cash") && "/cash",
    can(m, "invoices") && "/invoices",
    can(m, "reports") && "/reports",
    admin && "/staff",
    m.isPlatformAdmin && "/platform",
  ].filter((x): x is string => typeof x === "string");

  // Hôtels accessibles (pour le sélecteur). RLS limite déjà au périmètre.
  const { data: hotelRows } = await supabase
    .from("hotels")
    .select("id, name")
    .order("created_at", { ascending: true });
  const hotels = (hotelRows ?? []) as { id: string; name: string }[];

  return (
    <div className="flex min-h-dvh flex-col sm:flex-row">
      <SidebarNav
        email={user.email}
        allowed={allowed}
        hotels={hotels}
        activeHotelId={m.hotel.id}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
