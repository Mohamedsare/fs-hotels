-- =============================================================================
-- FIX RLS — table `hotels`
-- Symptôme : à la création d'un hôtel l'app renvoie « Action non autorisée »
--   (Postgres 42501 : new row violates row-level security policy for table "hotels").
-- Cause : la 1re migration s'est appliquée partiellement -> RLS est ACTIVÉE sur
--   `hotels` mais la politique d'INSERT n'a jamais été créée -> tout insert est
--   refusé par défaut (deny-by-default). Diagnostic confirmé : auth.uid() et le
--   trigger owner fonctionnent ; seul l'INSERT sur `hotels` est bloqué.
--
-- Ce patch est IDEMPOTENT et NON DESTRUCTIF (aucune donnée touchée).
-- À exécuter une fois dans le SQL Editor Supabase du projet Hôtels.
-- =============================================================================

alter table hotels enable row level security;

-- On (re)pose proprement les 4 politiques de `hotels`.
drop policy if exists hotels_member_read  on hotels;
drop policy if exists hotels_insert        on hotels;
drop policy if exists hotels_admin_update  on hotels;
drop policy if exists hotels_owner_delete  on hotels;

-- Lecture : membre de l'hôtel OU créateur. Le « OR created_by = auth.uid() »
-- garantit que le créateur peut relire l'hôtel juste après l'INSERT ... RETURNING
-- (la ligne hotel_users d'appartenance est posée par un trigger AFTER INSERT).
create policy hotels_member_read on hotels for select
  using (is_hotel_member(id) or created_by = auth.uid());

-- Création : tout utilisateur authentifié, pour lui-même (devient owner via trigger).
create policy hotels_insert on hotels for insert
  with check (created_by = auth.uid());

create policy hotels_admin_update on hotels for update
  using (has_hotel_role(id, 'owner','manager'));

create policy hotels_owner_delete on hotels for delete
  using (has_hotel_role(id, 'owner'));
