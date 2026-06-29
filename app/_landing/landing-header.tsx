"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const LINKS = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#modules", label: "Modules" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#temoignages", label: "Avis" },
  { href: "#faq", label: "FAQ" },
];

const THEME_EVENT = "fs-theme-change";

// Lit l'état du thème via useSyncExternalStore : pas de mismatch d'hydratation
// (le serveur renvoie toujours « clair ») ni de setState dans un effet.
function subscribeTheme(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(THEME_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
const getThemeSnapshot = () =>
  document.documentElement.classList.contains("dark");
const getThemeServerSnapshot = () => false;

/** Bascule clair / sombre — applique la classe `dark` sur <html> + persiste. */
function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("fs-theme", next ? "dark" : "light");
    } catch {}
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/70 text-[#1f2937] backdrop-blur transition-colors hover:bg-fs-surface-container"
    >
      {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

export function LandingHeader({
  signedIn,
}: {
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Le tiroir est rendu via un portail sur <body> : on attend le montage client.
  useEffect(() => setMounted(true), []);

  // Bloque le scroll quand le tiroir mobile est ouvert.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const primaryHref = signedIn ? "/dashboard" : "/signup";
  const primaryLabel = signedIn ? "Mon espace" : "Essayer gratuitement";

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="FasoStock Hôtels">
          <Logo className="h-9 w-auto" />
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold tracking-tight text-[#1f2937]">
              FasoStock
            </span>
            <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-fs-accent">
              Hôtels
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-[#374151] transition-colors hover:bg-fs-surface-container hover:text-[#0f172a]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!signedIn && (
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-[#1f2937] transition-colors hover:bg-fs-surface-container sm:inline-flex"
            >
              Se connecter
            </Link>
          )}
          <Link
            href={primaryHref}
            className="hidden items-center gap-1.5 rounded-full bg-fs-accent px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-fs-accent/25 transition-transform hover:scale-[1.03] active:scale-100 sm:inline-flex"
          >
            {primaryLabel}
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 bg-white text-[#1f2937] shadow-sm transition-colors hover:bg-fs-surface-container lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tiroir mobile — rendu via un portail sur <body> : sinon le
          backdrop-blur du <header> devient le bloc englobant du `fixed`
          et confine le tiroir à la barre de navigation. */}
      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-60 lg:hidden">
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm"
            />
            <div className="absolute right-0 top-0 flex h-full w-80 max-w-[86%] flex-col bg-fs-card p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo className="h-8 w-auto" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-fs-surface-container"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-1">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-semibold text-[#1f2937] hover:bg-fs-surface-container"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2.5 pt-6">
              {!signedIn && (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-3 text-sm font-bold text-[#1f2937]"
                >
                  Se connecter
                </Link>
              )}
              <Link
                href={primaryHref}
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-fs-accent px-5 py-3 text-sm font-bold text-white shadow-lg shadow-fs-accent/25"
              >
                {primaryLabel}
              </Link>
            </div>
          </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
