import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/rooms", label: "Chambres" },
  { href: "/reservations", label: "Réservations" },
  { href: "/stays", label: "Séjours" },
  { href: "/clients", label: "Clients" },
  { href: "/cash", label: "Caisse" },
  { href: "/reports", label: "Rapports" },
];

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

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-56 shrink-0 border-r border-black/10 bg-fs-card p-4 sm:block">
        <div className="text-lg font-bold">FasoStock Hôtels</div>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-fs-surface-container"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}