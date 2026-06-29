"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
  BarChart3,
  BedDouble,
  CalendarCheck,
  ConciergeBell,
  DoorOpen,
  FileText,
  Layers,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils/cn";
import { HotelSwitcher } from "./hotel-switcher";
import { LogoutButton } from "./logout-button";

const STORAGE_KEY = "fs-sidebar-collapsed";

// Préférence "réduit/déplié" persistée en localStorage, lue via
// useSyncExternalStore : pas de mismatch d'hydratation (le serveur renvoie
// toujours l'état déplié) et pas de setState dans un effet.
function subscribeCollapsed(cb: () => void) {
  window.addEventListener(STORAGE_KEY, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(STORAGE_KEY, cb);
    window.removeEventListener("storage", cb);
  };
}
const getCollapsed = () => localStorage.getItem(STORAGE_KEY) === "1";
const getCollapsedServer = () => false;

function setCollapsedPref(next: boolean) {
  localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  window.dispatchEvent(new Event(STORAGE_KEY));
}

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/reception", label: "Réception", icon: ConciergeBell },
  { href: "/reservations", label: "Réservations", icon: CalendarCheck },
  { href: "/stays", label: "Séjours en cours", icon: BedDouble },
  { href: "/rooms", label: "Chambres", icon: DoorOpen },
  { href: "/room-types", label: "Types de chambres", icon: Layers },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/cash", label: "Caisse", icon: Wallet },
  { href: "/invoices", label: "Factures", icon: FileText },
  { href: "/reports", label: "Rapports", icon: BarChart3 },
  { href: "/staff", label: "Personnel", icon: UserCog },
  { href: "/platform", label: "Plateforme", icon: ShieldCheck },
];

function Brand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Link href="/dashboard" aria-label="FasoStock Hôtels">
        <Logo className="h-8 w-auto" />
      </Link>
    );
  }
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <Logo className="h-9 w-auto" />
      <span className="leading-tight">
        <span className="block text-sm font-extrabold tracking-tight text-fs-text">
          FasoStock
        </span>
        <span className="block text-xs font-semibold text-fs-accent">Hôtels</span>
      </span>
    </Link>
  );
}

function NavLinks({
  allowed,
  collapsed = false,
  onNavigate,
}: {
  allowed: string[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV.filter((n) => allowed.includes(n.href));
  return (
    <nav className="flex flex-1 flex-col gap-0.5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center rounded-xl text-sm font-medium transition-colors",
              collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
              active
                ? "bg-fs-accent/10 text-fs-accent"
                : "text-fs-text/80 hover:bg-fs-surface-container hover:text-fs-text",
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                active ? "text-fs-accent" : "text-fs-on-surface-variant",
              )}
              strokeWidth={2}
            />
            {collapsed ? null : label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarNav({
  email,
  allowed,
  hotels,
  activeHotelId,
}: {
  email?: string | null;
  allowed: string[];
  hotels: { id: string; name: string }[];
  activeHotelId: string;
}) {
  const [open, setOpen] = useState(false);
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsed,
    getCollapsedServer,
  );

  const toggleCollapsed = () => setCollapsedPref(!collapsed);

  return (
    <>
      {/* Barre latérale — desktop */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-black/10 bg-fs-card px-3 py-4 transition-[width] duration-200 ease-out sm:flex",
          collapsed ? "w-[68px]" : "w-60",
        )}
      >
        <div
          className={cn(
            "pb-5",
            collapsed
              ? "flex flex-col items-center gap-3"
              : "flex items-center justify-between px-2",
          )}
        >
          <Brand compact={collapsed} />
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
            title={collapsed ? "Déplier le menu" : "Réduire le menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-fs-on-surface-variant hover:bg-fs-surface-container hover:text-fs-text"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>
        {!collapsed ? (
          <HotelSwitcher hotels={hotels} activeId={activeHotelId} />
        ) : (
          <HotelSwitcher hotels={hotels} activeId={activeHotelId} collapsed />
        )}
        <NavLinks allowed={allowed} collapsed={collapsed} />
        <LogoutButton email={email} collapsed={collapsed} />
      </aside>

      {/* En-tête — mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/10 bg-fs-card/95 px-4 py-3 backdrop-blur sm:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="fs-touch-target -mr-2 inline-flex items-center justify-center rounded-lg px-2 text-fs-text hover:bg-fs-surface-container"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Tiroir de navigation — mobile */}
      {open ? (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col bg-fs-card px-3 py-4 shadow-2xl">
            <div className="flex items-center justify-between px-2 pb-5">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="fs-touch-target inline-flex items-center justify-center rounded-lg px-2 text-fs-text hover:bg-fs-surface-container"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <HotelSwitcher hotels={hotels} activeId={activeHotelId} />
            <NavLinks allowed={allowed} onNavigate={() => setOpen(false)} />
            <LogoutButton email={email} />
          </div>
        </div>
      ) : null}
    </>
  );
}
