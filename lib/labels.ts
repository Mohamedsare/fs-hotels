import type {
  HotelClass,
  InvoiceType,
  PaymentMethod,
  PaymentStatus,
  ReservationStatus,
  RoomStatus,
  StayStatus,
} from "@/types/db";

type Tone = "neutral" | "green" | "orange" | "red" | "blue" | "gray";

export const ROOM_STATUS: Record<RoomStatus, { label: string; tone: Tone }> = {
  available: { label: "Libre", tone: "green" },
  reserved: { label: "Réservée", tone: "blue" },
  occupied: { label: "Occupée", tone: "orange" },
  dirty: { label: "Sale", tone: "gray" },
  cleaning: { label: "En nettoyage", tone: "gray" },
  clean: { label: "Propre", tone: "green" },
  maintenance: { label: "Maintenance", tone: "red" },
  blocked: { label: "Bloquée", tone: "red" },
};

export const RESERVATION_STATUS: Record<
  ReservationStatus,
  { label: string; tone: Tone }
> = {
  pending: { label: "En attente", tone: "orange" },
  confirmed: { label: "Confirmée", tone: "blue" },
  cancelled: { label: "Annulée", tone: "gray" },
  no_show: { label: "No-show", tone: "red" },
  checked_in: { label: "Arrivé (séjour)", tone: "green" },
  completed: { label: "Terminée", tone: "neutral" },
};

export const STAY_STATUS: Record<StayStatus, { label: string; tone: Tone }> = {
  in_progress: { label: "En cours", tone: "green" },
  checked_out: { label: "Terminé", tone: "neutral" },
  cancelled: { label: "Annulé", tone: "gray" },
};

export const PAYMENT_STATUS: Record<
  PaymentStatus,
  { label: string; tone: Tone }
> = {
  unpaid: { label: "Impayé", tone: "red" },
  partial: { label: "Partiel", tone: "orange" },
  paid: { label: "Payé", tone: "green" },
  refunded: { label: "Remboursé", tone: "gray" },
  cancelled: { label: "Annulé", tone: "gray" },
};

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  cash: "Espèces",
  orange_money: "Orange Money",
  moov_money: "Moov Money",
  card: "Carte",
  transfer: "Virement",
  credit: "Crédit",
  mixed: "Mixte",
};

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] =
  [
    { value: "cash", label: "Espèces" },
    { value: "orange_money", label: "Orange Money" },
    { value: "moov_money", label: "Moov Money" },
    { value: "card", label: "Carte" },
    { value: "transfer", label: "Virement" },
    { value: "credit", label: "Crédit" },
  ];

export const INVOICE_TYPE: Record<InvoiceType, string> = {
  advance_receipt: "Reçu d'avance",
  receipt: "Reçu de paiement",
  proforma: "Facture proforma",
  invoice: "Facture",
  corporate_invoice: "Facture entreprise",
};

export const HOTEL_CLASS: Record<HotelClass, string> = {
  unclassified: "Non classé",
  one_star: "1 étoile",
  two_star: "2 étoiles",
  three_star_plus: "3 étoiles et plus",
};