-- =============================================================================
-- FasoStock Hotels — Schéma de base de données (MVP + fondations)
-- Cible : projet Supabase DÉDIÉ (produit indépendant, données 100% cloisonnées).
-- Auth : auth.users du projet Hotels (clients = hôteliers, distincts de FasoStock).
--
-- Modèle métier (d'après hotels.md) organisé autour de :
--   chambre · client · réservation · séjour · caisse · facture · stock
--
-- Multi-tenant : chaque LIGNE est rattachée à un hotel_id. L'isolation est faite
-- par RLS via l'appartenance (hotel_users). Un compte peut gérer plusieurs hôtels.
--
-- Convention : montants en FCFA -> numeric(14,2) (pas de centimes en pratique).
-- Tarifs/taxes : JAMAIS en dur. Stockés en table + SNAPSHOT historique sur les
-- lignes de facture pour ne pas réécrire le passé quand un tarif change.
-- =============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- =============================================================================
-- 1. ENUMS (états essentiels — hotels.md §4 & §5)
-- =============================================================================
create type room_status        as enum ('available','reserved','occupied','dirty','cleaning','clean','maintenance','blocked');
create type reservation_status as enum ('pending','confirmed','cancelled','no_show','checked_in','completed');
create type stay_status        as enum ('in_progress','checked_out','cancelled');
create type payment_status     as enum ('unpaid','partial','paid','refunded','cancelled');
create type payment_method     as enum ('cash','orange_money','moov_money','card','transfer','credit','mixed');
create type hotel_role         as enum ('owner','manager','receptionist','housekeeping','restaurant_bar','accountant');
create type client_type        as enum ('individual','company','vip','regular','agency');
create type hotel_class        as enum ('unclassified','one_star','two_star','three_star_plus');
create type invoice_type       as enum ('advance_receipt','receipt','proforma','invoice','corporate_invoice');
create type service_category   as enum ('breakfast','restaurant','bar','laundry','transport','hall_rental','pool','wifi','deposit','penalty','damage','other');
create type housekeeping_status as enum ('pending','in_progress','done','inspected','blocked');
create type maintenance_status as enum ('reported','in_progress','resolved','unresolved','blocked');

-- =============================================================================
-- 2. Helpers généraux
-- (Les helpers RLS is_hotel_member / has_hotel_role sont définis en §3, APRÈS
--  la table hotel_users : une fonction `language sql` valide son corps à la
--  création, donc la table référencée doit déjà exister.)
-- =============================================================================
-- updated_at automatique
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- =============================================================================
-- 3. TENANT : hôtels & utilisateurs
-- =============================================================================
create table hotels (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  classification hotel_class not null default 'unclassified',
  ifu           text,                 -- identifiant fiscal
  rccm          text,
  phone         text,
  email         text,
  address       text,
  city          text,
  logo_url      text,
  currency      text not null default 'XOF',
  created_by    uuid not null references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table hotel_users (
  id         uuid primary key default gen_random_uuid(),
  hotel_id   uuid not null references hotels(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       hotel_role not null default 'receptionist',
  active      boolean not null default true,
  created_at timestamptz not null default now(),
  unique (hotel_id, user_id)
);

-- Helpers RLS (SECURITY DEFINER => contournent RLS, évitent la récursion).
-- Définis ICI car ils référencent hotel_users (cf. note §2).
create or replace function is_hotel_member(p_hotel_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from hotel_users hu
    where hu.hotel_id = p_hotel_id and hu.user_id = auth.uid() and hu.active
  );
$$;

create or replace function has_hotel_role(p_hotel_id uuid, variadic p_roles hotel_role[])
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from hotel_users hu
    where hu.hotel_id = p_hotel_id and hu.user_id = auth.uid() and hu.active
      and hu.role = any(p_roles)
  );
$$;

-- Le créateur d'un hôtel devient automatiquement 'owner'
create or replace function on_hotel_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into hotel_users (hotel_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (hotel_id, user_id) do nothing;
  return new;
end; $$;
create trigger trg_hotel_created after insert on hotels
  for each row execute function on_hotel_created();

-- =============================================================================
-- 4. Catalogue : types de chambres & chambres (hotels.md §B, §C)
-- =============================================================================
create table room_types (
  id              uuid primary key default gen_random_uuid(),
  hotel_id        uuid not null references hotels(id) on delete cascade,
  name            text not null,                 -- Standard, VIP, Suite…
  description     text,
  max_occupancy   int  not null default 2,
  base_price      numeric(14,2) not null default 0,   -- prix normal / nuit
  weekend_price   numeric(14,2),
  corporate_price numeric(14,2),
  deposit         numeric(14,2) not null default 0,   -- caution
  amenities       jsonb not null default '{}',         -- {ac:true, tv:true, wifi:true, breakfast:false…}
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table rooms (
  id            uuid primary key default gen_random_uuid(),
  hotel_id      uuid not null references hotels(id) on delete cascade,
  room_type_id  uuid references room_types(id) on delete set null,
  number        text not null,                   -- "204"
  floor         text,
  status        room_status not null default 'available',
  active        boolean not null default true,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (hotel_id, number)
);

-- =============================================================================
-- 5. Clients (CRM — hotels.md §P)
-- =============================================================================
create table clients (
  id           uuid primary key default gen_random_uuid(),
  hotel_id     uuid not null references hotels(id) on delete cascade,
  type         client_type not null default 'individual',
  name         text not null,
  phone        text,
  email        text,
  nationality  text,
  id_doc_type  text,                              -- CNIB, passeport…
  id_doc_number text,
  address      text,
  company_name text,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- =============================================================================
-- 6. Réservations (hotels.md §D, §E)
-- =============================================================================
create table reservations (
  id              uuid primary key default gen_random_uuid(),
  hotel_id        uuid not null references hotels(id) on delete cascade,
  client_id       uuid references clients(id) on delete set null,
  room_type_id    uuid references room_types(id) on delete set null,  -- type demandé
  room_id         uuid references rooms(id) on delete set null,       -- chambre pré-attribuée (option.)
  status          reservation_status not null default 'pending',
  check_in_date   date not null,
  check_out_date  date not null,
  guests_count    int  not null default 1,
  agreed_rate     numeric(14,2) not null default 0,   -- prix négocié / nuit
  advance_paid    numeric(14,2) not null default 0,
  source          text,                                -- réception, téléphone, WhatsApp, agence…
  note            text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (check_out_date > check_in_date)
);

-- =============================================================================
-- 7. Séjours (hotels.md §F, §G, §H) — cœur du cycle
-- =============================================================================
create table stays (
  id               uuid primary key default gen_random_uuid(),
  hotel_id         uuid not null references hotels(id) on delete cascade,
  reservation_id   uuid references reservations(id) on delete set null,
  room_id          uuid not null references rooms(id),
  client_id        uuid references clients(id) on delete set null,
  status           stay_status not null default 'in_progress',
  payment_status   payment_status not null default 'unpaid',
  nightly_rate     numeric(14,2) not null,          -- SNAPSHOT du tarif au check-in
  guests_count     int not null default 1,
  check_in_at      timestamptz not null default now(),
  expected_check_out date not null,
  checked_out_at   timestamptz,
  -- Totaux (maintenus par l'app ou un trigger ultérieur ; gardés pour lecture rapide)
  room_total       numeric(14,2) not null default 0, -- nuits * tarif
  services_total   numeric(14,2) not null default 0,
  tax_total        numeric(14,2) not null default 0, -- taxe touristique
  discount_total   numeric(14,2) not null default 0,
  grand_total      numeric(14,2) not null default 0,
  paid_total       numeric(14,2) not null default 0,
  note             text,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Occupants additionnels d'un séjour (hotels.md : stay_guests)
create table stay_guests (
  id        uuid primary key default gen_random_uuid(),
  hotel_id  uuid not null references hotels(id) on delete cascade,
  stay_id   uuid not null references stays(id) on delete cascade,
  name      text not null,
  id_doc_number text,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- 8. Services & consommations (hotels.md §H, §O)
-- =============================================================================
create table services (
  id          uuid primary key default gen_random_uuid(),
  hotel_id    uuid not null references hotels(id) on delete cascade,
  category    service_category not null default 'other',
  name        text not null,                     -- "Eau minérale", "Plat riz sauce"…
  price       numeric(14,2) not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- "Ajoutez ça sur ma chambre" -> rattaché au séjour
create table service_consumptions (
  id          uuid primary key default gen_random_uuid(),
  hotel_id    uuid not null references hotels(id) on delete cascade,
  stay_id     uuid not null references stays(id) on delete cascade,
  service_id  uuid references services(id) on delete set null,
  label       text not null,                     -- SNAPSHOT du nom
  unit_price  numeric(14,2) not null,            -- SNAPSHOT du prix
  quantity    numeric(12,2) not null default 1,
  total       numeric(14,2) not null,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- 9. Caisse, factures & paiements (hotels.md §I, §J)
-- =============================================================================
create table invoices (
  id            uuid primary key default gen_random_uuid(),
  hotel_id      uuid not null references hotels(id) on delete cascade,
  stay_id       uuid references stays(id) on delete set null,
  client_id     uuid references clients(id) on delete set null,
  type          invoice_type not null default 'invoice',
  number        text not null,                   -- numéro lisible
  subtotal      numeric(14,2) not null default 0,
  discount      numeric(14,2) not null default 0,
  tax_total     numeric(14,2) not null default 0,
  total         numeric(14,2) not null default 0,
  paid_total    numeric(14,2) not null default 0,
  issued_at     timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  unique (hotel_id, number)
);

create table invoice_items (
  id          uuid primary key default gen_random_uuid(),
  hotel_id    uuid not null references hotels(id) on delete cascade,
  invoice_id  uuid not null references invoices(id) on delete cascade,
  label       text not null,                     -- "Nuitées (2)", "Taxe touristique"…
  unit_price  numeric(14,2) not null default 0,
  quantity    numeric(12,2) not null default 1,
  total       numeric(14,2) not null default 0,
  sort_order  int not null default 0
);

create table payments (
  id            uuid primary key default gen_random_uuid(),
  hotel_id      uuid not null references hotels(id) on delete cascade,
  stay_id       uuid references stays(id) on delete set null,
  reservation_id uuid references reservations(id) on delete set null, -- avance
  invoice_id    uuid references invoices(id) on delete set null,
  method        payment_method not null default 'cash',
  amount        numeric(14,2) not null,           -- négatif = remboursement
  reference     text,                             -- ID transaction Orange/Moov… (cf. crédit FasoStock)
  agent_id      uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

-- Dépenses internes de l'hôtel (hotels.md §I "Achat savon", §Achats & dépenses)
create table hotel_expenses (
  id          uuid primary key default gen_random_uuid(),
  hotel_id    uuid not null references hotels(id) on delete cascade,
  label       text not null,
  amount      numeric(14,2) not null,
  method      payment_method not null default 'cash',
  spent_at    timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- 10. Ménage & maintenance (hotels.md §L, §M)
-- =============================================================================
create table housekeeping_tasks (
  id          uuid primary key default gen_random_uuid(),
  hotel_id    uuid not null references hotels(id) on delete cascade,
  room_id     uuid not null references rooms(id) on delete cascade,
  status      housekeeping_status not null default 'pending',
  assigned_to uuid references auth.users(id),
  note        text,
  photo_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table maintenance_tickets (
  id          uuid primary key default gen_random_uuid(),
  hotel_id    uuid not null references hotels(id) on delete cascade,
  room_id     uuid references rooms(id) on delete set null,
  title       text not null,                     -- "Climatisation en panne"
  status      maintenance_status not null default 'reported',
  assigned_to uuid references auth.users(id),
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =============================================================================
-- 11. Fiscalité (hotels.md §K) — taux CONFIGURABLES, jamais en dur
-- Taxe de développement touristique : par personne et par nuitée selon classement.
-- =============================================================================
create table tax_settings (
  hotel_id              uuid primary key references hotels(id) on delete cascade,
  tourism_tax_per_night numeric(14,2) not null default 0,  -- FCFA / personne / nuit
  vat_rate              numeric(5,2)  not null default 0,   -- TVA % si applicable
  updated_at            timestamptz not null default now()
);

-- Déclarations périodiques (hotels.md : tourism_tax_reports)
create table tourism_tax_reports (
  id           uuid primary key default gen_random_uuid(),
  hotel_id     uuid not null references hotels(id) on delete cascade,
  period_start date not null,
  period_end   date not null,
  guests_count int not null default 0,
  nights_count int not null default 0,
  tax_total    numeric(14,2) not null default 0,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

-- =============================================================================
-- 12. INDEXES (requêtes fréquentes : dashboard, planning, recherche)
-- =============================================================================
create index on rooms (hotel_id, status);
create index on reservations (hotel_id, status, check_in_date);
create index on reservations (hotel_id, room_id, check_in_date, check_out_date);
create index on stays (hotel_id, status);
create index on stays (hotel_id, room_id);
create index on service_consumptions (stay_id);
create index on payments (hotel_id, created_at);
create index on invoices (hotel_id, issued_at);
create index on clients (hotel_id, phone);
create index on housekeeping_tasks (hotel_id, status);
create index on maintenance_tickets (hotel_id, status);

-- =============================================================================
-- 13. updated_at triggers
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'hotels','room_types','rooms','clients','reservations','stays','services',
    'invoices','housekeeping_tasks','maintenance_tickets','tax_settings'
  ] loop
    execute format(
      'create trigger trg_%1$s_updated before update on %1$s for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- =============================================================================
-- 14. RLS — isolation par hôtel (le cœur du cloisonnement)
-- =============================================================================
-- Tables avec colonne hotel_id directe -> politique générique "membre de l'hôtel".
do $$
declare t text;
begin
  foreach t in array array[
    'hotel_users','room_types','rooms','clients','reservations','stays','stay_guests',
    'services','service_consumptions','invoices','invoice_items','payments',
    'hotel_expenses','housekeeping_tasks','maintenance_tickets','tax_settings','tourism_tax_reports'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy %1$s_member_read on %1$s for select using (is_hotel_member(hotel_id));', t);
    execute format(
      'create policy %1$s_member_write on %1$s for all using (is_hotel_member(hotel_id)) with check (is_hotel_member(hotel_id));', t);
  end loop;
end $$;

-- hotels : lecture si membre ; création par tout utilisateur authentifié (devient owner via trigger) ;
-- modification/suppression réservées owner/manager.
alter table hotels enable row level security;
drop policy if exists hotels_member_read on hotels;
drop policy if exists hotels_insert on hotels;
drop policy if exists hotels_admin_update on hotels;
drop policy if exists hotels_owner_delete on hotels;
-- Lecture : membre OU créateur (le « or created_by » permet de relire l'hôtel
-- juste après l'INSERT ... RETURNING, avant que le trigger d'appartenance soit "vu").
create policy hotels_member_read on hotels for select using (is_hotel_member(id) or created_by = auth.uid());
create policy hotels_insert on hotels for insert with check (created_by = auth.uid());
create policy hotels_admin_update on hotels for update using (has_hotel_role(id, 'owner','manager'));
create policy hotels_owner_delete on hotels for delete using (has_hotel_role(id, 'owner'));

-- =============================================================================
-- NOTE MVP (hotels.md §9) : le périmètre prioritaire couvre
--   hotels, hotel_users, room_types, rooms, clients, reservations, stays,
--   service(_consumptions), invoices/items, payments, tax_settings + dashboard.
-- Ménage/maintenance/dépenses/déclarations sont déjà posés ici pour ne pas
-- migrer deux fois, mais peuvent être branchés dans l'UI en phase 2.
-- Différé (phase 2+) : stock hôtelier, restaurant/bar détaillé (tables/commandes),
--   grilles tarifaires multi-saisons, WhatsApp/online booking.
-- =============================================================================
