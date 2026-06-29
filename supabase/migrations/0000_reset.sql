-- =============================================================================
-- RESET du schéma applicatif FasoStock Hôtels (à exécuter AVANT 0001 si la
-- première migration a échoué/partiellement appliquée -> policies manquantes).
--
-- SÛR : ne touche PAS au schéma `auth` -> vos comptes/sessions restent intacts.
-- À n'utiliser que tant qu'il n'y a pas de données métier à conserver.
--
-- Utilisation (SQL Editor Supabase) :
--   1) Coller + exécuter CE fichier.
--   2) Coller + exécuter 0001_init_hotels.sql.
-- =============================================================================

-- Tables (cascade -> supprime policies, triggers, contraintes, index liés).
drop table if exists
  tourism_tax_reports, tax_settings, maintenance_tickets, housekeeping_tasks,
  hotel_expenses, payments, invoice_items, invoices, service_consumptions,
  services, stay_guests, stays, reservations, clients, rooms, room_types,
  hotel_users, hotels
  cascade;

-- Types enum (cascade -> supprime aussi has_hotel_role qui dépend de hotel_role).
drop type if exists
  room_status, reservation_status, stay_status, payment_status, payment_method,
  hotel_role, client_type, hotel_class, invoice_type, service_category,
  housekeeping_status, maintenance_status
  cascade;

-- Fonctions restantes (sans dépendance de type custom).
drop function if exists is_hotel_member(uuid) cascade;
drop function if exists on_hotel_created() cascade;
drop function if exists set_updated_at() cascade;
