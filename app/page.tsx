import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BedDouble,
  Building2,
  CalendarCheck,
  Check,
  Cloud,
  DoorOpen,
  FileText,
  Lock,
  Quote,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  UserCog,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/server";
import { LandingHeader } from "./_landing/landing-header";

export const metadata: Metadata = {
  title: "FasoStock Hôtels — Le logiciel de gestion hôtelière des hôtels d'Afrique de l'Ouest",
  description:
    "Réservations, séjours, caisse en FCFA, factures et rapports. Une plateforme tout-en-un pensée pour les hôtels du Burkina Faso et d'Afrique de l'Ouest. Accessible partout, sur mobile comme sur PC.",
};

/** Page d'accueil publique (marketing). Route `/` — accessible sans authentification. */
export default async function LandingPage() {
  let signedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  } catch {
    // Supabase non configuré / hors-ligne : la landing reste affichable.
  }

  return (
    <div id="landing-page" className="overflow-x-clip bg-fs-surface text-[#1f2937] antialiased">
      {/* Anti-flash thème sombre : applique la préférence avant le premier paint. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('fs-theme');var m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&m)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
        }}
      />

      {/* Barre de progression de lecture (pilotée par le scroll, cf. globals.css) */}
      <div className="fs-scroll-progress" aria-hidden="true" />

      <main>
        <LandingHeader signedIn={signedIn} />

        {/* ============================ HERO ============================ */}
        <section id="accueil" className="relative overflow-hidden">
          {/* Décoratif plein cadre ciblé par la parallaxe CSS (#accueil img[aria-hidden]) — <img> volontaire. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden="true"
            src="/landing-hero.svg"
            alt=""
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover"
          />
          {/* Voile pour la lisibilité du texte */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white/40 via-white/10 to-fs-surface"
          />

          <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-28">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              {/* Colonne texte */}
              <div className="text-center lg:text-left">
                <p className="inline-flex items-center gap-2 rounded-full border border-[#ffe2d2] bg-[#fff1e7] px-3.5 py-1.5 text-xs font-bold text-[#5c2a0e]">
                  <Sparkles className="h-3.5 w-3.5 text-fs-accent" />
                  Conçu pour les hôtels du Burkina Faso
                </p>
                <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-[#0f172a] sm:text-5xl lg:text-6xl">
                  Gérez{" "}
                  <span className="relative whitespace-nowrap text-fs-accent">
                    vos Hôtels
                  </span>
                  , efficacement
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#4b5563] lg:mx-0">
                  Réservations, séjours, caisse en FCFA, factures et rapports —
                  réunis dans une seule application rapide, simple et accessible
                  partout, sur mobile comme sur PC.
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  <Link
                    href={signedIn ? "/dashboard" : "/signup"}
                    className="group inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-fs-accent px-6 py-3 text-sm font-bold text-white shadow-xl shadow-fs-accent/30 transition-transform hover:scale-[1.03] active:scale-100 sm:w-auto sm:text-base"
                  >
                    {signedIn ? "Ouvrir mon espace" : "Démarrer gratuitement"}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <a
                    href="#fonctionnalites"
                    className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-white/80 px-6 py-3 text-sm font-bold text-[#1f2937] backdrop-blur transition-colors hover:bg-white sm:w-auto sm:text-base"
                  >
                    Voir les fonctionnalités
                  </a>
                </div>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-[#4b5563] lg:justify-start">
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-fs-accent" /> Sans carte bancaire
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-fs-accent" /> Prêt en 5 minutes
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-fs-accent" /> 100 % en français
                  </span>
                </div>
              </div>

              {/* Colonne visuelle — maquette de l'application */}
              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div
                  aria-hidden="true"
                  className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-[#ffe8db] to-[#fff7f1] blur-2xl"
                />
                <HeroMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ===================== BANDEAU STATISTIQUES ===================== */}
        <section className="border-y border-black/5 bg-[#fff8f3]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-black/5 px-0 sm:grid-cols-4 sm:divide-y-0 lg:px-8">
            {[
              { k: "11", l: "modules intégrés" },
              { k: "4", l: "niveaux d'accès" },
              { k: "100%", l: "dans le cloud" },
              { k: "FCFA", l: "nativement géré" },
            ].map((s) => (
              <div key={s.l} className="px-6 py-7 text-center">
                <div className="text-3xl font-black tracking-tight text-fs-accent sm:text-4xl">
                  {s.k}
                </div>
                <div className="mt-1 text-sm font-semibold text-[#4b5563]">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ======================= PARTENAIRES (marquee) ======================= */}
        <div id="partenaires" className="bg-fs-surface py-10">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#6b7280]">
            La gestion complète, d’un seul coup d’œil
          </p>
          <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
            <div className="partners-marquee-track flex w-max gap-3">
              {[...PILLS, ...PILLS].map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-5 py-2.5 text-sm font-bold text-[#374151] shadow-sm"
                >
                  <p.icon className="h-4 w-4 text-fs-accent" />
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ====================== FONCTIONNALITÉS (grille) ====================== */}
        <section id="fonctionnalites" className="bg-fs-surface py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Tout-en-un"
              title="Une fonctionnalité pour chaque geste du quotidien"
              subtitle="De l'arrivée du client à la clôture de caisse, chaque tâche a sa place — sans tableur, sans papier, sans prise de tête."
            />
            <div
              data-fs-stagger
              className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {FEATURES.map((f) => (
                <article
                  key={f.title}
                  className="group rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/[0.06]"
                >
                  <div
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border"
                    style={{ backgroundColor: f.bg, borderColor: f.border }}
                  >
                    <f.icon className="h-6 w-6 text-fs-accent" strokeWidth={2} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#0f172a]">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4b5563]">{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ====================== MODULES PHARES (split) ====================== */}
        <section id="modules" className="bg-[#fff7f1] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Les modules phares"
              title="Pensé pour la réalité des hôtels d'ici"
              subtitle="Connexion instable, paiements en espèces, taxe de séjour, plusieurs établissements… On a construit les réponses dans le produit."
            />

            <SplitFeature
              icon={Cloud}
              tag="Accessible partout"
              title="Votre hôtel à portée de main, où que vous soyez"
              desc="Vos données vivent dans le cloud et se synchronisent en temps réel : la réception, la direction et vos différents postes voient toujours la même information, à jour à la seconde près."
              points={[
                "Accessible depuis n'importe quel appareil connecté",
                "Synchronisation en temps réel entre tous vos postes",
                "Installable comme une appli (PWA) sur mobile et PC",
              ]}
              align="left"
              bg="#f4f9ff"
              border="#d7e9ff"
            />

            <SplitFeature
              icon={Wallet}
              tag="Caisse & facturation"
              title="Encaissez en FCFA, facturez en un clic"
              desc="Avances sur réservation, paiements pendant le séjour, clôture de caisse journalière. Les factures se génèrent automatiquement au check-out, prêtes à imprimer."
              points={[
                "Montants en FCFA, formatage local automatique",
                "Factures et devis prêts à imprimer en PDF",
                "Taxe de séjour calculée et déclarée sans effort",
              ]}
              align="right"
              bg="#f4fbf6"
              border="#d9efdf"
            />

            <SplitFeature
              icon={ShieldCheck}
              tag="Équipe & sécurité"
              title="Chaque membre voit exactement ce qu'il doit voir"
              desc="Quatre niveaux d'accès — super-admin, propriétaire, gérant, employé — avec des permissions par module. Les données de chaque hôtel restent strictement isolées."
              points={[
                "4 rôles + permissions fines par module",
                "Isolation totale des données entre hôtels (RLS)",
                "Gestion de plusieurs établissements d'un même compte",
              ]}
              align="left"
              bg="#f8f4ff"
              border="#e8defa"
            />
          </div>
        </section>

        {/* ========================= POURQUOI (atouts) ========================= */}
        <section className="bg-fs-surface py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Pourquoi FasoStock"
              title="Rapide à prendre en main, impossible à lâcher"
            />
            <div data-fs-stagger className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {WHY.map((w) => (
                <div
                  key={w.title}
                  className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm"
                >
                  <w.icon className="h-7 w-7 text-fs-accent" />
                  <h3 className="mt-4 text-base font-bold text-[#0f172a]">{w.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#4b5563]">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================ TARIFS ============================ */}
        <section id="tarifs" className="bg-[#fff8f3] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Tarifs"
              title="Un prix simple, sans surprise"
              subtitle="Commencez gratuitement. Évoluez quand votre hôtel grandit. Annulez quand vous voulez."
            />
            <div data-fs-stagger className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
              {PLANS.map((p) => (
                <div
                  key={p.name}
                  className={
                    "relative flex flex-col rounded-3xl border bg-white p-7 shadow-sm " +
                    (p.featured
                      ? "border-fs-accent ring-2 ring-fs-accent/20 lg:-mt-3 lg:mb-3"
                      : "border-black/[0.08]")
                  }
                >
                  {p.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-fs-accent px-3 py-1 text-xs font-bold text-white shadow-lg shadow-fs-accent/30">
                      Le plus choisi
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-[#0f172a]">{p.name}</h3>
                  <p className="mt-1 text-sm text-[#4b5563]">{p.tagline}</p>
                  <div className="mt-5 flex items-end gap-1.5">
                    <span className="text-4xl font-black tracking-tight text-[#0f172a]">
                      {p.price}
                    </span>
                    <span className="pb-1 text-sm font-semibold text-[#6b7280]">
                      {p.period}
                    </span>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm text-[#374151]">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-fs-accent" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={signedIn ? "/dashboard" : "/signup"}
                    className={
                      "mt-7 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition-all " +
                      (p.featured
                        ? "bg-fs-accent text-white shadow-lg shadow-fs-accent/30 hover:scale-[1.02]"
                        : "border border-black/10 text-[#1f2937] hover:bg-fs-surface-container")
                    }
                  >
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-xs text-[#6b7280]">
              Tarifs indicatifs en FCFA — adaptés à votre nombre de chambres et d’établissements.
            </p>
          </div>
        </section>

        {/* ====================== TÉMOIGNAGES (marquee) ====================== */}
        <div id="temoignages" className="bg-fs-surface py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Ils nous font confiance"
              title="Des hôteliers qui ont rangé le cahier"
            />
          </div>
          <div className="relative mt-12 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <div className="testimonials-auto-track flex gap-5 px-4">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <figure
                  key={i}
                  className="flex w-[340px] shrink-0 flex-col rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm"
                >
                  <Quote className="h-6 w-6 text-fs-accent/40" />
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-[#374151]">
                    « {t.quote} »
                  </blockquote>
                  <div className="mt-5 flex items-center gap-1 text-fs-accent">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <figcaption className="mt-4 flex items-center gap-3 border-t border-black/5 pt-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1e7] text-sm font-black text-fs-accent">
                      {t.initials}
                    </span>
                    <span className="leading-tight">
                      <span className="block text-sm font-bold text-[#0f172a]">{t.name}</span>
                      <span className="block text-xs text-[#6b7280]">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>

        {/* ============================== FAQ ============================== */}
        <div id="faq" className="bg-[#fff7f1] py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Questions fréquentes"
              title="Tout ce que vous voulez savoir"
            />
            <div className="mt-12 space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-black/[0.08] bg-white p-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-[#0f172a]">
                    {item.q}
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-fs-surface-container text-fs-accent transition-transform group-open:rotate-45">
                      <span className="text-lg leading-none">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[#4b5563]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* ============================ CTA FINAL ============================ */}
        <section id="cta" className="bg-fs-surface px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-fs-accent to-[#f97316] px-6 py-16 text-center shadow-2xl shadow-fs-accent/30 sm:px-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/15 blur-2xl"
            />
            <h2 className="relative mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              Prêt à reprendre le contrôle de votre hôtel ?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-base text-white/90 sm:text-lg">
              Créez votre compte gratuitement et enregistrez votre premier hôtel
              en quelques minutes. Aucune installation, aucune carte bancaire.
            </p>
            <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={signedIn ? "/dashboard" : "/signup"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-fs-accent shadow-xl transition-transform hover:scale-[1.03] sm:w-auto"
              >
                {signedIn ? "Ouvrir mon espace" : "Créer mon compte"}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/40 px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </section>

        {/* ============================= FOOTER ============================= */}
        <footer className="border-t border-black/5 bg-fs-surface">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <Link href="/" className="flex items-center gap-2.5" aria-label="FasoStock Hôtels">
                <Logo className="h-9 w-auto" />
                <span className="leading-tight">
                  <span className="block text-sm font-extrabold tracking-tight text-[#1f2937]">
                    FasoStock
                  </span>
                  <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-fs-accent">
                    Hôtels
                  </span>
                </span>
              </Link>
              <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-[#4b5563]">
                <a href="#fonctionnalites" className="hover:text-fs-accent">Fonctionnalités</a>
                <a href="#tarifs" className="hover:text-fs-accent">Tarifs</a>
                <a href="#faq" className="hover:text-fs-accent">FAQ</a>
                <Link href="/login" className="hover:text-fs-accent">Connexion</Link>
              </nav>
            </div>
            <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-black/5 pt-6 text-xs text-[#6b7280] sm:flex-row">
              <p>© {new Date().getFullYear()} FasoStock Hôtels — Fait au Burkina Faso 🇧🇫</p>
              <p>Gestion hôtelière simple, rapide et accessible partout.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sous-composants présentatifs                                        */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-fs-accent">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-[#0f172a] sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed text-[#4b5563]">{subtitle}</p>
      )}
    </div>
  );
}

function SplitFeature({
  icon: Icon,
  tag,
  title,
  desc,
  points,
  align,
  bg,
  border,
}: {
  icon: typeof Cloud;
  tag: string;
  title: string;
  desc: string;
  points: string[];
  align: "left" | "right";
  bg: string;
  border: string;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div className={align === "right" ? "lg:order-2" : ""}>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#ffe2d2] bg-white px-3.5 py-1.5 text-xs font-bold text-fs-accent">
          <Icon className="h-3.5 w-3.5" />
          {tag}
        </span>
        <h3 className="mt-4 text-2xl font-black leading-tight tracking-tight text-[#0f172a] sm:text-3xl">
          {title}
        </h3>
        <p className="mt-4 text-base leading-relaxed text-[#4b5563]">{desc}</p>
        <ul className="mt-6 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[15px] font-semibold text-[#374151]">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-fs-accent/10">
                <Check className="h-3.5 w-3.5 text-fs-accent" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Illustration abstraite du module */}
      <div className={align === "right" ? "lg:order-1" : ""}>
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border p-8 shadow-sm"
          style={{ backgroundColor: bg, borderColor: border }}
        >
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/50 blur-2xl"
          />
          <div className="relative grid h-full place-items-center">
            <Icon className="h-24 w-24 text-fs-accent/80" strokeWidth={1.25} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Maquette stylisée du tableau de bord, en pur HTML/CSS. */
function HeroMockup() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-black/[0.08] bg-white shadow-2xl shadow-black/10">
      {/* Barre de fenêtre */}
      <div className="flex items-center gap-1.5 border-b border-black/5 bg-[#fafafa] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 truncate text-xs font-semibold text-[#6b7280]">
          hotels.fasostock.com / tableau-de-bord
        </span>
      </div>

      <div className="flex">
        {/* Mini barre latérale */}
        <div className="hidden w-32 shrink-0 flex-col gap-1.5 border-r border-black/5 bg-[#fff8f3] p-3 sm:flex">
          {[
            { i: BarChart3, a: true },
            { i: CalendarCheck },
            { i: BedDouble },
            { i: DoorOpen },
            { i: Wallet },
            { i: FileText },
          ].map((row, idx) => (
            <div
              key={idx}
              className={
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold " +
                (row.a ? "bg-fs-accent/10 text-fs-accent" : "text-[#6b7280]")
              }
            >
              <row.i className="h-3.5 w-3.5" />
              <span className="h-1.5 w-12 rounded-full bg-current opacity-40" />
            </div>
          ))}
        </div>

        {/* Contenu */}
        <div className="flex-1 space-y-3 p-4">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { v: "18", l: "Libres", c: "#e7f7ef" },
              { v: "26", l: "Occupées", c: "#fff1e7" },
              { v: "72%", l: "Taux", c: "#eaf2ff" },
            ].map((c) => (
              <div
                key={c.l}
                className="rounded-xl p-3"
                style={{ backgroundColor: c.c }}
              >
                <div className="text-lg font-black text-[#0f172a]">{c.v}</div>
                <div className="text-[10px] font-semibold text-[#6b7280]">{c.l}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-black/5 p-3">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#0f172a]">Recette du jour</span>
              <span className="text-[11px] font-black text-fs-accent">485 000 FCFA</span>
            </div>
            {/* Mini graphe en barres */}
            <div className="flex h-16 items-end gap-1.5">
              {[40, 65, 50, 80, 55, 92, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-fs-accent/30 to-fs-accent"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            {[
              { n: "Ch. 204 · K. Traoré", s: "Arrivée", c: "#e7f7ef" },
              { n: "Ch. 110 · A. Diallo", s: "Départ", c: "#fff1e7" },
            ].map((r) => (
              <div
                key={r.n}
                className="flex items-center justify-between rounded-lg border border-black/5 px-3 py-2"
              >
                <span className="text-[11px] font-semibold text-[#374151]">{r.n}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold text-[#0f172a]"
                  style={{ backgroundColor: r.c }}
                >
                  {r.s}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Données                                                             */
/* ------------------------------------------------------------------ */

const PILLS = [
  { icon: CalendarCheck, label: "Réservations" },
  { icon: BedDouble, label: "Séjours" },
  { icon: DoorOpen, label: "Chambres" },
  { icon: Wallet, label: "Caisse" },
  { icon: FileText, label: "Factures" },
  { icon: BarChart3, label: "Rapports" },
  { icon: Users, label: "Clients" },
  { icon: UserCog, label: "Personnel" },
];

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Réservations",
    desc: "Calendrier clair, statuts (en attente, confirmée, annulée) et avances encaissées dès la prise de réservation.",
    bg: "#fff1e7",
    border: "#ffe2d2",
  },
  {
    icon: BedDouble,
    title: "Séjours en cours",
    desc: "Check-in et check-out en un geste, prolongation, accompagnants et consommations de services.",
    bg: "#f4fbf6",
    border: "#d9efdf",
  },
  {
    icon: DoorOpen,
    title: "Chambres & types",
    desc: "État en temps réel — libre, occupée, à nettoyer — par type de chambre et tarif.",
    bg: "#f4f9ff",
    border: "#d7e9ff",
  },
  {
    icon: Wallet,
    title: "Caisse",
    desc: "Encaissements en FCFA, dépenses et clôture journalière. Vous savez toujours où vous en êtes.",
    bg: "#fffaf2",
    border: "#f3e3c9",
  },
  {
    icon: FileText,
    title: "Factures & devis",
    desc: "Générées au check-out, prêtes à imprimer ou à enregistrer en PDF, à votre en-tête.",
    bg: "#f8f4ff",
    border: "#e8defa",
  },
  {
    icon: Users,
    title: "Clients",
    desc: "Fiche client, pièce d'identité, historique des séjours et coordonnées toujours sous la main.",
    bg: "#f3fbfc",
    border: "#d7f2f6",
  },
  {
    icon: BarChart3,
    title: "Rapports",
    desc: "Chiffre d'affaires, taux d'occupation et arrivées/départs du jour, en un coup d'œil.",
    bg: "#fff6f5",
    border: "#ffe0dc",
  },
  {
    icon: Receipt,
    title: "Taxe de séjour",
    desc: "Paramétrage du barème, calcul automatique et rapports de taxe de séjour prêts à déclarer.",
    bg: "#fff4fb",
    border: "#f8d8ec",
  },
  {
    icon: Building2,
    title: "Multi-hôtels",
    desc: "Gérez plusieurs établissements depuis un seul compte et basculez de l'un à l'autre instantanément.",
    bg: "#f3f7ff",
    border: "#d8e3ff",
  },
];

const WHY = [
  {
    icon: Cloud,
    title: "Accessible partout",
    desc: "Gérez votre hôtel depuis la réception, le bureau ou chez vous.",
  },
  {
    icon: Smartphone,
    title: "Mobile & PC",
    desc: "Installable en application, parfait sur téléphone comme sur ordinateur.",
  },
  {
    icon: Zap,
    title: "Ultra rapide",
    desc: "Interface légère et réactive, pensée pour les connexions lentes.",
  },
  {
    icon: Lock,
    title: "Données protégées",
    desc: "Chaque hôtel est isolé. Personne ne voit ce qui ne le concerne pas.",
  },
];

const PLANS = [
  {
    name: "Découverte",
    tagline: "Pour démarrer et tester",
    price: "0",
    period: "FCFA / mois",
    featured: false,
    cta: "Commencer gratuitement",
    features: [
      "1 hôtel",
      "Réservations & séjours",
      "Caisse et factures",
      "Jusqu'à 2 utilisateurs",
      "Accessible mobile & PC",
    ],
  },
  {
    name: "Professionnel",
    tagline: "Pour les hôtels en activité",
    price: "15 000",
    period: "FCFA / mois",
    featured: true,
    cta: "Choisir Professionnel",
    features: [
      "1 hôtel, chambres illimitées",
      "Tous les modules inclus",
      "Rôles & permissions (4 niveaux)",
      "Rapports avancés",
      "Taxe de séjour automatisée",
      "Utilisateurs illimités",
    ],
  },
  {
    name: "Groupe",
    tagline: "Pour plusieurs établissements",
    price: "Sur devis",
    period: "",
    featured: false,
    cta: "Nous contacter",
    features: [
      "Multi-hôtels illimités",
      "Tableau de bord consolidé",
      "Accompagnement dédié",
      "Formation des équipes",
      "Priorité au support",
    ],
  },
];

const TESTIMONIALS = [
  {
    quote:
      "On a arrêté le cahier et le tableur. Tout est centralisé et je vois la recette du jour depuis chez moi.",
    name: "Awa Sawadogo",
    role: "Propriétaire · Ouagadougou",
    initials: "AS",
  },
  {
    quote:
      "Je consulte la recette et les arrivées du jour depuis mon téléphone, où que je sois. La réception et moi voyons la même chose en temps réel.",
    name: "Boukary Ouédraogo",
    role: "Gérant · Bobo-Dioulasso",
    initials: "BO",
  },
  {
    quote:
      "Les factures se génèrent toutes seules au départ du client. Un gain de temps énorme à la réception.",
    name: "Fatou Koné",
    role: "Réceptionniste · Banfora",
    initials: "FK",
  },
  {
    quote:
      "Je gère mes deux hôtels depuis le même compte. Les permissions par employé, c'est exactement ce qu'il me fallait.",
    name: "Idrissa Zerbo",
    role: "Directeur · Koudougou",
    initials: "IZ",
  },
];

const FAQ = [
  {
    q: "Depuis quels appareils puis-je utiliser l'application ?",
    a: "Depuis n'importe quel appareil avec un navigateur — téléphone, tablette ou ordinateur. Tout se synchronise en temps réel, vous retrouvez les mêmes données partout.",
  },
  {
    q: "Faut-il installer un logiciel ?",
    a: "Non. FasoStock Hôtels fonctionne dans le navigateur et peut s'installer comme une application (PWA) sur votre téléphone ou votre ordinateur, sans passer par un store.",
  },
  {
    q: "Les montants sont-ils en FCFA ?",
    a: "Oui, le FCFA est géré nativement : saisie, encaissements, factures, rapports et taxe de séjour utilisent le format local automatiquement.",
  },
  {
    q: "Puis-je gérer plusieurs hôtels ?",
    a: "Absolument. Un même compte peut gérer plusieurs établissements, avec un changement d'hôtel instantané et des données strictement isolées entre eux.",
  },
  {
    q: "Comment gérer les accès de mon équipe ?",
    a: "Quatre niveaux d'accès sont disponibles — propriétaire, gérant et employé, plus le super-admin de la plateforme — avec des permissions fines, module par module.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Chaque hôtel est isolé au niveau de la base de données (Row Level Security). Un utilisateur ne voit jamais les données d'un établissement auquel il n'appartient pas.",
  },
];
