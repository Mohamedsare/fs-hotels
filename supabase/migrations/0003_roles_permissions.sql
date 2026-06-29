-- =============================================================================
-- 0003 — Rôles & permissions (4 niveaux)
--   super-admin plateforme · admin/propriétaire (owner) · gérant (manager) · employé
--
-- IDEMPOTENT & NON DESTRUCTIF (aucune donnée métier touchée).
-- À exécuter une fois dans le SQL Editor Supabase.
--
-- Note tx-safety : on compare les rôles via `role::text = '...'` (jamais comme
-- littéral enum) pour rester sûr même si `add value 'employee'` et son usage
-- tombent dans la même transaction.
-- =============================================================================

-- 1) Nouvelle valeur d'enum + colonne permissions ----------------------------
alter type hotel_role add value if not exists 'employee';
alter table hotel_users
  add column if not exists permissions text[] not null default '{}';

-- 2) Super-admins plateforme -------------------------------------------------
create table if not exists platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table platform_admins enable row level security;

-- 3) Helpers RLS (SECURITY DEFINER => contournent RLS) -----------------------
create or replace function is_platform_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

-- Membre d'un hôtel OU super-admin (lecture).
create or replace function is_hotel_member(p_hotel_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select is_platform_admin() or exists (
    select 1 from hotel_users hu
    where hu.hotel_id = p_hotel_id and hu.user_id = auth.uid() and hu.active
  );
$$;

-- Admin de l'hôtel (owner) OU super-admin.
create or replace function is_hotel_admin(p_hotel_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select is_platform_admin() or exists (
    select 1 from hotel_users hu
    where hu.hotel_id = p_hotel_id and hu.user_id = auth.uid() and hu.active
      and hu.role::text = 'owner'
  );
$$;

-- Capacité d'écriture sur un module donné :
--   super-admin / owner / manager => tout ; employé => module dans ses permissions.
create or replace function app_can(p_hotel_id uuid, p_module text)
returns boolean language sql security definer stable set search_path = public as $$
  select is_platform_admin() or exists (
    select 1 from hotel_users hu
    where hu.hotel_id = p_hotel_id and hu.user_id = auth.uid() and hu.active
      and (
        hu.role::text in ('owner','manager')
        or (hu.role::text = 'employee' and p_module = any(hu.permissions))
      )
  );
$$;

-- has_hotel_role : étendu pour inclure le super-admin.
create or replace function has_hotel_role(p_hotel_id uuid, variadic p_roles hotel_role[])
returns boolean language sql security definer stable set search_path = public as $$
  select is_platform_admin() or exists (
    select 1 from hotel_users hu
    where hu.hotel_id = p_hotel_id and hu.user_id = auth.uid() and hu.active
      and hu.role = any(p_roles)
  );
$$;

-- 3b) NETTOYAGE — supprime TOUTES les policies existantes des tables visées.
-- Indispensable : les anciennes policies « *_member_write » (FOR ALL) de 0001
-- restaient permissives et, combinées en OR, autorisaient encore suppressions
-- et écritures sensibles. On repart d'une feuille blanche puis on recrée tout.
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'hotels','hotel_users','room_types','rooms','clients','reservations',
        'stays','stay_guests','services','service_consumptions','invoices',
        'invoice_items','payments','hotel_expenses','housekeeping_tasks',
        'maintenance_tickets','tax_settings','tourism_tax_reports','platform_admins'
      ])
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 4) Policies platform_admins (réservé aux super-admins) ---------------------
drop policy if exists platform_admins_read on platform_admins;
drop policy if exists platform_admins_all  on platform_admins;
create policy platform_admins_read on platform_admins for select using (is_platform_admin());
create policy platform_admins_all  on platform_admins for all
  using (is_platform_admin()) with check (is_platform_admin());

-- 5) Tables opérationnelles : lecture membre / écriture par module / delete admin
do $$
declare r record;
begin
  for r in (
    select * from (values
      ('reservations','reservations'),
      ('rooms','rooms'),
      ('room_types','room_types'),
      ('clients','clients'),
      ('services','stays'),
      ('stays','stays'),
      ('stay_guests','stays'),
      ('service_consumptions','stays'),
      ('hotel_expenses','cash'),
      ('housekeeping_tasks','housekeeping'),
      ('maintenance_tickets','maintenance'),
      ('tourism_tax_reports','reports')
    ) as t(tbl, module)
  ) loop
    execute format('alter table %I enable row level security;', r.tbl);
    -- anciennes policies génériques (0001 §14)
    execute format('drop policy if exists %1$s_member_read on %1$s;', r.tbl);
    execute format('drop policy if exists %1$s_member_write on %1$s;', r.tbl);
    -- nouvelles (idempotence)
    execute format('drop policy if exists %1$s_read on %1$s;', r.tbl);
    execute format('drop policy if exists %1$s_ins on %1$s;',  r.tbl);
    execute format('drop policy if exists %1$s_upd on %1$s;',  r.tbl);
    execute format('drop policy if exists %1$s_del on %1$s;',  r.tbl);
    execute format(
      'create policy %1$s_read on %1$s for select using (is_hotel_member(hotel_id));', r.tbl);
    execute format(
      'create policy %1$s_ins on %1$s for insert with check (app_can(hotel_id, %L));', r.tbl, r.module);
    execute format(
      'create policy %1$s_upd on %1$s for update using (app_can(hotel_id, %L)) with check (app_can(hotel_id, %L));',
      r.tbl, r.module, r.module);
    execute format(
      'create policy %1$s_del on %1$s for delete using (is_hotel_admin(hotel_id));', r.tbl);
  end loop;
end $$;

-- 6) Cas particuliers (écriture multi-modules) -------------------------------
-- payments : encaissement possible depuis Caisse, Réservations (avance) ou Séjours.
alter table payments enable row level security;
drop policy if exists payments_member_read on payments;
drop policy if exists payments_member_write on payments;
drop policy if exists payments_read on payments;
drop policy if exists payments_ins on payments;
drop policy if exists payments_upd on payments;
drop policy if exists payments_del on payments;
create policy payments_read on payments for select using (is_hotel_member(hotel_id));
create policy payments_ins on payments for insert with check (
  app_can(hotel_id,'cash') or app_can(hotel_id,'reservations') or app_can(hotel_id,'stays'));
create policy payments_upd on payments for update using (app_can(hotel_id,'cash'))
  with check (app_can(hotel_id,'cash'));
create policy payments_del on payments for delete using (is_hotel_admin(hotel_id));

-- invoices / invoice_items : générées au check-out (module séjours) ; visibles "factures".
do $$
declare t text;
begin
  foreach t in array array['invoices','invoice_items'] loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists %1$s_member_read on %1$s;', t);
    execute format('drop policy if exists %1$s_member_write on %1$s;', t);
    execute format('drop policy if exists %1$s_read on %1$s;', t);
    execute format('drop policy if exists %1$s_ins on %1$s;', t);
    execute format('drop policy if exists %1$s_upd on %1$s;', t);
    execute format('drop policy if exists %1$s_del on %1$s;', t);
    execute format('create policy %1$s_read on %1$s for select using (is_hotel_member(hotel_id));', t);
    execute format(
      'create policy %1$s_ins on %1$s for insert with check (app_can(hotel_id,''stays'') or app_can(hotel_id,''invoices''));', t);
    execute format(
      'create policy %1$s_upd on %1$s for update using (app_can(hotel_id,''stays'') or app_can(hotel_id,''invoices'')) with check (app_can(hotel_id,''stays'') or app_can(hotel_id,''invoices''));', t);
    execute format('create policy %1$s_del on %1$s for delete using (is_hotel_admin(hotel_id));', t);
  end loop;
end $$;

-- hotel_users (gestion du personnel) : lecture membre, écriture admin.
alter table hotel_users enable row level security;
drop policy if exists hotel_users_member_read on hotel_users;
drop policy if exists hotel_users_member_write on hotel_users;
drop policy if exists hotel_users_read on hotel_users;
drop policy if exists hotel_users_admin_write on hotel_users;
create policy hotel_users_read on hotel_users for select using (is_hotel_member(hotel_id));
create policy hotel_users_admin_write on hotel_users for all
  using (is_hotel_admin(hotel_id)) with check (is_hotel_admin(hotel_id));

-- tax_settings (paramètres fiscaux) : lecture membre, écriture admin.
alter table tax_settings enable row level security;
drop policy if exists tax_settings_member_read on tax_settings;
drop policy if exists tax_settings_member_write on tax_settings;
drop policy if exists tax_settings_read on tax_settings;
drop policy if exists tax_settings_admin_write on tax_settings;
create policy tax_settings_read on tax_settings for select using (is_hotel_member(hotel_id));
create policy tax_settings_admin_write on tax_settings for all
  using (is_hotel_admin(hotel_id)) with check (is_hotel_admin(hotel_id));

-- hotels : lecture membre/super-admin ; création authentifiée ; update admin ; delete owner/super.
drop policy if exists hotels_member_read on hotels;
drop policy if exists hotels_insert on hotels;
drop policy if exists hotels_admin_update on hotels;
drop policy if exists hotels_owner_delete on hotels;
create policy hotels_member_read on hotels for select
  using (is_hotel_member(id) or created_by = auth.uid());
create policy hotels_insert on hotels for insert with check (created_by = auth.uid());
create policy hotels_admin_update on hotels for update using (is_hotel_admin(id));
create policy hotels_owner_delete on hotels for delete
  using (is_platform_admin() or has_hotel_role(id, 'owner'));

-- 7) Résolution e-mail -> user_id (pour ajouter un membre du personnel) -------
-- SECURITY DEFINER + garde interne : seul un admin d'hôtel (ou super-admin)
-- obtient un résultat, ce qui limite l'énumération d'e-mails.
create or replace function find_user_id_by_email(p_email text)
returns uuid language sql security definer stable set search_path = public as $$
  select u.id
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
    and (
      is_platform_admin()
      or exists (
        select 1 from hotel_users hu
        where hu.user_id = auth.uid() and hu.active and hu.role::text = 'owner'
      )
    )
  limit 1;
$$;

-- 8) T'inscrire comme super-admin plateforme ---------------------------------
insert into platform_admins (user_id)
select id from auth.users where email = 'mhdcode7@gmail.com'
on conflict do nothing;
