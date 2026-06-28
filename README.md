# FasoStock Hôtels

Produit **indépendant** de gestion hôtelière (mini-PMS) — distinct de FasoStock
(stock/POS). Même stack technique, mais **repo, déploiement et base de données
séparés** : aucun couplage runtime, données 100 % cloisonnées.

- **Stack** : Next.js 16 (App Router, `proxy.ts`), React 19, Tailwind v4, Supabase (Auth + Postgres + RLS).
- **Domaine** : chambre · client · réservation · séjour · caisse · facture · stock.

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseigner l'URL + clés du projet Supabase Hôtels
npm run dev
```

## Base de données

Le schéma initial est dans [`supabase/migrations/0001_init_hotels.sql`](supabase/migrations/0001_init_hotels.sql).
À exécuter sur un **nouveau projet Supabase** (SQL Editor ou `supabase db push`).
Isolation par `hotel_id` via RLS (`is_hotel_member` / `has_hotel_role`).

> Taxe touristique et TVA : **configurables** dans `tax_settings` (jamais en dur).

## MVP (hotels.md §9)

Dashboard · Chambres · Types de chambres · Réservations · Check-in ·
Séjours en cours · Check-out + facture · Paiements · Clients · Rapports simples.

Phase 2 : ménage, maintenance, restaurant/bar, stock hôtelier, taxes, WhatsApp.

## Structure

```
app/
  (app)/            espace authentifié (garde d'auth dans layout.tsx)
    dashboard/
  login/
lib/supabase/       client / server / proxy (repris de FasoStock)
lib/utils/cn.ts
supabase/migrations/
```