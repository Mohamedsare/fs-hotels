// Types applicatifs alignés sur supabase/migrations/0001_init_hotels.sql.
// (Hand-written ; on pourra générer via `supabase gen types` plus tard.)

export type RoomStatus =
  | "available"
  | "reserved"
  | "occupied"
  | "dirty"
  | "cleaning"
  | "clean"
  | "maintenance"
  | "blocked";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "no_show"
  | "checked_in"
  | "completed";

export type StayStatus = "in_progress" | "checked_out" | "cancelled";

export type PaymentStatus =
  | "unpaid"
  | "partial"
  | "paid"
  | "refunded"
  | "cancelled";

export type PaymentMethod =
  | "cash"
  | "orange_money"
  | "moov_money"
  | "card"
  | "transfer"
  | "credit"
  | "mixed";

export type HotelRole =
  | "owner"
  | "manager"
  | "receptionist"
  | "housekeeping"
  | "restaurant_bar"
  | "accountant";

export type ClientType =
  | "individual"
  | "company"
  | "vip"
  | "regular"
  | "agency";

export type HotelClass =
  | "unclassified"
  | "one_star"
  | "two_star"
  | "three_star_plus";

export type InvoiceType =
  | "advance_receipt"
  | "receipt"
  | "proforma"
  | "invoice"
  | "corporate_invoice";

export type ServiceCategory =
  | "breakfast"
  | "restaurant"
  | "bar"
  | "laundry"
  | "transport"
  | "hall_rental"
  | "pool"
  | "wifi"
  | "deposit"
  | "penalty"
  | "damage"
  | "other";

export interface Hotel {
  id: string;
  name: string;
  classification: HotelClass;
  ifu: string | null;
  rccm: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  logo_url: string | null;
  currency: string;
  created_at: string;
}

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  description: string | null;
  max_occupancy: number;
  base_price: number;
  weekend_price: number | null;
  corporate_price: number | null;
  deposit: number;
  amenities: Record<string, boolean>;
  active: boolean;
  created_at: string;
}

export interface Room {
  id: string;
  hotel_id: string;
  room_type_id: string | null;
  number: string;
  floor: string | null;
  status: RoomStatus;
  active: boolean;
  note: string | null;
  created_at: string;
  room_type?: Pick<RoomType, "id" | "name" | "base_price"> | null;
}

export interface Client {
  id: string;
  hotel_id: string;
  type: ClientType;
  name: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  id_doc_type: string | null;
  id_doc_number: string | null;
  address: string | null;
  company_name: string | null;
  note: string | null;
  created_at: string;
}

export interface Reservation {
  id: string;
  hotel_id: string;
  client_id: string | null;
  room_type_id: string | null;
  room_id: string | null;
  status: ReservationStatus;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  agreed_rate: number;
  advance_paid: number;
  source: string | null;
  note: string | null;
  created_at: string;
  client?: Pick<Client, "id" | "name" | "phone"> | null;
  room_type?: Pick<RoomType, "id" | "name"> | null;
}

export interface Stay {
  id: string;
  hotel_id: string;
  reservation_id: string | null;
  room_id: string;
  client_id: string | null;
  status: StayStatus;
  payment_status: PaymentStatus;
  nightly_rate: number;
  guests_count: number;
  check_in_at: string;
  expected_check_out: string;
  checked_out_at: string | null;
  room_total: number;
  services_total: number;
  tax_total: number;
  discount_total: number;
  grand_total: number;
  paid_total: number;
  note: string | null;
  created_at: string;
  room?: Pick<Room, "id" | "number"> | null;
  client?: Pick<Client, "id" | "name" | "phone"> | null;
}

export interface Service {
  id: string;
  hotel_id: string;
  category: ServiceCategory;
  name: string;
  price: number;
  active: boolean;
  created_at: string;
}

export interface ServiceConsumption {
  id: string;
  hotel_id: string;
  stay_id: string;
  service_id: string | null;
  label: string;
  unit_price: number;
  quantity: number;
  total: number;
  created_at: string;
}

export interface Payment {
  id: string;
  hotel_id: string;
  stay_id: string | null;
  reservation_id: string | null;
  invoice_id: string | null;
  method: PaymentMethod;
  amount: number;
  reference: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  hotel_id: string;
  stay_id: string | null;
  client_id: string | null;
  type: InvoiceType;
  number: string;
  subtotal: number;
  discount: number;
  tax_total: number;
  total: number;
  paid_total: number;
  issued_at: string;
  client?: Pick<Client, "id" | "name" | "phone"> | null;
}

export interface InvoiceItem {
  id: string;
  hotel_id: string;
  invoice_id: string;
  label: string;
  unit_price: number;
  quantity: number;
  total: number;
  sort_order: number;
}