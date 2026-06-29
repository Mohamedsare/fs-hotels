"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  BedDouble,
  Brush,
  CalendarCheck,
  CalendarPlus,
  Check,
  CreditCard,
  KeyRound,
  LayoutGrid,
  List,
  LogIn,
  LogOut,
  Plus,
  Printer,
  Search,
  UserPlus,
  Wifi,
  Wrench,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ResourceForm } from "@/components/ui/resource-form";
import { useToast } from "@/components/ui/toast";
import { Badge, Button, Field, Input, Select } from "@/components/ui/ui";
import { frError } from "@/lib/errors";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/labels";
import { FORM_IDLE, type FormState } from "@/lib/forms";
import { formatCFA, nightsBetween } from "@/lib/utils/format";
import type {
  Client,
  Reservation,
  Room,
  RoomStatus,
  Service,
  ServiceConsumption,
  Stay,
} from "@/types/db";
import { createClientRecord } from "../clients/actions";
import { checkInReservation, createReservation } from "../reservations/actions";
import { setRoomStatus } from "../rooms/actions";
import {
  addConsumption,
  addPayment,
  checkOutStay,
  createWalkInStay,
  extendStay,
} from "../stays/actions";

type ClientLite = Pick<Client, "id" | "name" | "phone">;

type Props = {
  hotelName: string;
  today: string;
  stats: {
    free: number;
    occupied: number;
    reservations: number;
    departures: number;
    dirty: number;
    unpaid: number;
  };
  rooms: Room[];
  stays: Stay[];
  consumptions: ServiceConsumption[];
  clients: ClientLite[];
  services: Service[];
  arrivals: Reservation[];
  taxPerNight: number;
  canCash: boolean;
  canInvoices: boolean;
  canReservations: boolean;
};

/* ------------------------------------------------------------------ */
/* Visuels d'état de chambre                                           */
/* ------------------------------------------------------------------ */

type Tone = "green" | "orange" | "blue" | "red" | "gray";
const ROOM_VIS: Record<
  RoomStatus,
  { label: string; tone: Tone; wrap: string; dot: string }
> = {
  available: { label: "Libre", tone: "green", wrap: "border-green-200 bg-green-50/60", dot: "bg-green-500" },
  clean: { label: "Propre", tone: "green", wrap: "border-green-200 bg-green-50/60", dot: "bg-green-500" },
  occupied: { label: "Occupée", tone: "orange", wrap: "border-orange-200 bg-orange-50/70", dot: "bg-orange-500" },
  reserved: { label: "Réservée", tone: "blue", wrap: "border-blue-200 bg-blue-50/60", dot: "bg-blue-500" },
  dirty: { label: "À nettoyer", tone: "orange", wrap: "border-amber-200 bg-amber-50/70", dot: "bg-amber-500" },
  cleaning: { label: "En nettoyage", tone: "orange", wrap: "border-amber-200 bg-amber-50/70", dot: "bg-amber-500" },
  maintenance: { label: "Maintenance", tone: "red", wrap: "border-red-200 bg-red-50/60", dot: "bg-red-500" },
  blocked: { label: "Bloquée", tone: "red", wrap: "border-red-200 bg-red-50/60", dot: "bg-red-500" },
};

const isFree = (s: RoomStatus) => s === "available" || s === "clean";

/* ------------------------------------------------------------------ */
/* Carte conteneur                                                     */
/* ------------------------------------------------------------------ */

function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        "rounded-2xl border border-black/10 bg-fs-card p-4 " + (className ?? "")
      }
    >
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-fs-text">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/* ================================================================== */
/* Composant principal                                                 */
/* ================================================================== */

export function ReceptionBoard(props: Props) {
  const {
    hotelName,
    today,
    stats,
    rooms,
    stays,
    consumptions,
    clients,
    services,
    arrivals,
    taxPerNight,
    canCash,
    canInvoices,
    canReservations,
  } = props;

  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [roomQuery, setRoomQuery] = useState("");
  const [tab, setTab] = useState<"checkin" | "reservation" | "payment" | "checkout">(
    "checkin",
  );
  const [selectedStayId, setSelectedStayId] = useState<string | null>(
    stays[0]?.id ?? null,
  );

  // Champs du check-in rapide (formulaire contrôlé pour des totaux en direct).
  const [ci, setCi] = useState({
    roomId: "",
    clientId: "",
    guests: "1",
    nightlyRate: "",
    checkout: "",
    advance: "",
    method: "cash",
  });
  const set = (patch: Partial<typeof ci>) => setCi((p) => ({ ...p, ...patch }));

  const freeRooms = useMemo(
    () => rooms.filter((r) => isFree(r.status)),
    [rooms],
  );
  const filteredRooms = useMemo(() => {
    const q = roomQuery.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) => r.number.toLowerCase().includes(q));
  }, [rooms, roomQuery]);

  const selectedStay = stays.find((s) => s.id === selectedStayId) ?? null;
  const stayConsumptions = consumptions.filter(
    (c) => c.stay_id === selectedStayId,
  );
  const stayByRoom = useMemo(() => {
    const map = new Map<string, Stay>();
    for (const s of stays) if (s.room_id) map.set(s.room_id, s);
    return map;
  }, [stays]);

  /** Exécute une action serveur puis rafraîchit les données serveur. */
  const run = (
    fn: () => Promise<FormState>,
    okMsg: string,
    after?: () => void,
  ) =>
    startTransition(async () => {
      const res = await fn();
      if (res?.ok) {
        toast.success(okMsg);
        after?.();
        router.refresh();
      } else {
        toast.error(frError(res?.error));
      }
    });

  /* ----------------------------- Check-in live ----------------------------- */
  const nights =
    ci.checkout && ci.checkout > today
      ? nightsBetween(today, ci.checkout)
      : ci.checkout === today
        ? 1
        : 0;
  const rate = Number(ci.nightlyRate) || 0;
  const guests = Math.max(1, Number(ci.guests) || 1);
  const roomTotal = nights * rate;
  const taxTotal = nights * guests * taxPerNight;
  const ciTotal = roomTotal + taxTotal;
  const advance = Number(ci.advance) || 0;
  const ciRemaining = Math.max(0, ciTotal - advance);

  const selectRoom = (room: Room) => {
    if (isFree(room.status)) {
      setTab("checkin");
      set({
        roomId: room.id,
        nightlyRate: ci.nightlyRate || String(room.room_type?.base_price ?? ""),
      });
      return;
    }
    const st = stayByRoom.get(room.id);
    if (st) setSelectedStayId(st.id);
  };

  const submitCheckIn = (print: boolean) => {
    if (!ci.roomId) return toast.error("Sélectionnez une chambre libre.");
    if (!ci.checkout) return toast.error("Indiquez la date de départ.");
    if (rate <= 0) return toast.error("Indiquez le tarif par nuit.");
    const fd = new FormData();
    fd.set("room_id", ci.roomId);
    if (ci.clientId) fd.set("client_id", ci.clientId);
    fd.set("nightly_rate", String(rate));
    fd.set("guests_count", String(guests));
    fd.set("expected_check_out", ci.checkout);
    if (advance > 0) {
      fd.set("advance_paid", String(advance));
      fd.set("method", ci.method);
    }
    startTransition(async () => {
      const res = await createWalkInStay(FORM_IDLE, fd);
      if (res.ok) {
        toast.success("Check-in effectué. Clé remise, chambre occupée.");
        set({
          roomId: "",
          clientId: "",
          guests: "1",
          nightlyRate: "",
          checkout: "",
          advance: "",
        });
        if (print && res.stayId)
          window.open(`/reception/recu/${res.stayId}`, "_blank");
        router.refresh();
      } else {
        toast.error(frError(res.error));
      }
    });
  };

  const TABS = [
    { id: "checkin" as const, label: "Check-in", icon: LogIn },
    { id: "reservation" as const, label: "Réservation", icon: CalendarCheck },
    { id: "payment" as const, label: "Paiement", icon: CreditCard },
    { id: "checkout" as const, label: "Check-out", icon: LogOut },
  ];

  const statCards = [
    { label: "Chambres libres", value: stats.free, icon: BedDouble, color: "text-green-600", bg: "bg-green-100" },
    { label: "Occupées", value: stats.occupied, icon: BedDouble, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Réservations", value: stats.reservations, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Départs", value: stats.departures, icon: LogOut, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "À nettoyer", value: stats.dirty, icon: Brush, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Impayés", value: stats.unpaid, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
  ];

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(today + "T00:00:00"));

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fs-text">Réception</h1>
          <p className="mt-0.5 text-sm capitalize text-fs-on-surface-variant">
            {hotelName} · {dateLabel}
          </p>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-3 rounded-2xl border border-black/10 bg-fs-card p-3"
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${c.bg} ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-fs-on-surface-variant">
                {c.label}
              </div>
              <div className="text-xl font-extrabold leading-tight text-fs-text">
                {c.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trois colonnes */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* ---------------- Colonne 1 : état des chambres ---------------- */}
        <Panel
          title="État des chambres"
          action={
            <div className="flex items-center gap-1 rounded-lg border border-black/10 p-0.5">
              <button
                type="button"
                aria-label="Vue grille"
                onClick={() => setView("grid")}
                className={
                  "rounded-md p-1.5 " +
                  (view === "grid"
                    ? "bg-fs-accent text-white"
                    : "text-fs-on-surface-variant hover:bg-fs-surface-container")
                }
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Vue liste"
                onClick={() => setView("list")}
                className={
                  "rounded-md p-1.5 " +
                  (view === "list"
                    ? "bg-fs-accent text-white"
                    : "text-fs-on-surface-variant hover:bg-fs-surface-container")
                }
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          }
        >
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fs-on-surface-variant" />
            <Input
              value={roomQuery}
              onChange={(e) => setRoomQuery(e.target.value)}
              placeholder="Rechercher une chambre…"
              className="pl-9"
            />
          </div>

          {filteredRooms.length === 0 ? (
            <p className="py-6 text-center text-sm text-fs-on-surface-variant">
              Aucune chambre.
            </p>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-2">
              {filteredRooms.map((r) => (
                <RoomCard
                  key={r.id}
                  room={r}
                  stay={stayByRoom.get(r.id) ?? null}
                  selected={stayByRoom.get(r.id)?.id === selectedStayId || ci.roomId === r.id}
                  onClick={() => selectRoom(r)}
                  onMarkClean={
                    r.status === "dirty" || r.status === "cleaning"
                      ? () =>
                          run(
                            async () => {
                              await setRoomStatus(r.id, "available");
                              return { ok: true };
                            },
                            `Chambre ${r.number} prête.`,
                          )
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {filteredRooms.map((r) => {
                const vis = ROOM_VIS[r.status];
                const st = stayByRoom.get(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectRoom(r)}
                    className="flex w-full items-center justify-between gap-2 py-2 text-left hover:bg-fs-surface-container/50"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${vis.dot}`} />
                      <span className="font-semibold">Ch. {r.number}</span>
                      {st?.client?.name ? (
                        <span className="text-xs text-fs-on-surface-variant">
                          · {st.client.name}
                        </span>
                      ) : null}
                    </span>
                    <Badge tone={vis.tone}>{vis.label}</Badge>
                  </button>
                );
              })}
            </div>
          )}

          <RoomLegend />
        </Panel>

        {/* ---------------- Colonne 2 : actions rapides ---------------- */}
        <Panel>
          {/* Onglets */}
          <div className="mb-4 flex gap-1.5">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors " +
                    (active
                      ? "bg-fs-accent text-white"
                      : "border border-black/10 text-fs-text hover:bg-fs-surface-container")
                  }
                >
                  <t.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>

          {tab === "checkin" ? (
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Field label="Client">
                    <Select
                      value={ci.clientId}
                      onChange={(e) => set({ clientId: e.target.value })}
                    >
                      <option value="">— Client de passage</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                          {c.phone ? ` · ${c.phone}` : ""}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <NewClientButton onCreated={() => router.refresh()} />
              </div>

              <Field label="Chambre" required>
                <Select
                  value={ci.roomId}
                  onChange={(e) => {
                    const room = freeRooms.find((r) => r.id === e.target.value);
                    set({
                      roomId: e.target.value,
                      nightlyRate: room?.room_type?.base_price
                        ? String(room.room_type.base_price)
                        : ci.nightlyRate,
                    });
                  }}
                >
                  <option value="">— Sélectionner une chambre libre</option>
                  {freeRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Ch. {r.number}
                      {r.room_type?.name ? ` · ${r.room_type.name}` : ""}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Départ prévu" required>
                  <Input
                    type="date"
                    min={today}
                    value={ci.checkout}
                    onChange={(e) => set({ checkout: e.target.value })}
                  />
                </Field>
                <Field label="Personnes">
                  <Input
                    inputMode="numeric"
                    value={ci.guests}
                    onChange={(e) => set({ guests: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Prix / nuit" required>
                <Input
                  inputMode="numeric"
                  value={ci.nightlyRate}
                  onChange={(e) => set({ nightlyRate: e.target.value })}
                  placeholder="15 000"
                />
              </Field>

              {/* Récapitulatif live */}
              <div className="space-y-1.5 rounded-xl bg-fs-surface-container px-3 py-2.5 text-sm">
                <Line label={`Nuitées${nights ? ` (${nights})` : ""}`} value={formatCFA(roomTotal)} />
                {taxTotal > 0 ? <Line label="Taxe de séjour" value={formatCFA(taxTotal)} /> : null}
                <Line label="Total" value={formatCFA(ciTotal)} strong />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Avance">
                  <Input
                    inputMode="numeric"
                    value={ci.advance}
                    onChange={(e) => set({ advance: e.target.value })}
                    placeholder="0"
                  />
                </Field>
                <Field label="Mode de paiement">
                  <Select
                    value={ci.method}
                    onChange={(e) => set({ method: e.target.value })}
                  >
                    {PAYMENT_METHOD_OPTIONS.map((mtd) => (
                      <option key={mtd.value} value={mtd.value}>
                        {mtd.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-fs-accent/30 bg-fs-accent/5 px-3 py-2 text-sm font-bold">
                <span>Reste à payer</span>
                <span className="text-fs-accent">{formatCFA(ciRemaining)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button disabled={pending} onClick={() => submitCheckIn(false)}>
                  <Check className="h-4 w-4" /> Valider le check-in
                </Button>
                <Button
                  variant="secondary"
                  disabled={pending}
                  title="Valide le check-in puis ouvre le reçu à imprimer"
                  onClick={() => submitCheckIn(true)}
                >
                  <Printer className="h-4 w-4" /> Valider + reçu
                </Button>
              </div>
              {canReservations ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setTab("reservation")}
                >
                  <Plus className="h-4 w-4" /> Nouvelle réservation
                </Button>
              ) : null}
            </div>
          ) : null}

          {tab === "reservation" ? (
            canReservations ? (
              <ReservationForm clients={clients} onDone={() => router.refresh()} />
            ) : (
              <Locked />
            )
          ) : null}

          {tab === "payment" ? (
            !canCash ? (
              <Locked />
            ) : !selectedStay ? (
              <NoStay />
            ) : (
              <PaymentForm
                stay={selectedStay}
                onDone={() => router.refresh()}
              />
            )
          ) : null}

          {tab === "checkout" ? (
            !selectedStay ? (
              <NoStay />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-fs-on-surface-variant">
                  Clôturer le séjour de la chambre{" "}
                  <span className="font-semibold text-fs-text">
                    {selectedStay.room?.number}
                  </span>{" "}
                  ({selectedStay.client?.name ?? "client de passage"}). La facture
                  sera générée automatiquement.
                </p>
                <div className="space-y-1.5 rounded-xl bg-fs-surface-container px-3 py-2.5 text-sm">
                  <Line label="Total séjour" value={formatCFA(selectedStay.grand_total)} />
                  <Line label="Déjà payé" value={formatCFA(selectedStay.paid_total)} />
                  <Line
                    label="Reste à régler"
                    value={formatCFA(
                      Math.max(0, Number(selectedStay.grand_total) - Number(selectedStay.paid_total)),
                    )}
                    strong
                  />
                </div>
                <Button
                  variant="danger"
                  className="w-full"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await checkOutStay(selectedStay.id);
                      if (res.ok) {
                        toast.success("Check-out effectué. Facture générée.");
                        setSelectedStayId(null);
                        if (res.invoiceId && canInvoices)
                          router.push(`/invoices/${res.invoiceId}`);
                        else router.refresh();
                      } else {
                        toast.error(frError(res.error));
                      }
                    })
                  }
                >
                  <LogOut className="h-4 w-4" /> Confirmer le check-out
                </Button>
              </div>
            )
          ) : null}
        </Panel>

        {/* ---------------- Colonne 3 : séjour / client + agenda ---------------- */}
        <div className="space-y-4">
          <Panel title="Séjour / Client">
            {!selectedStay ? (
              <NoStay />
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fs-accent/10 text-sm font-bold text-fs-accent">
                    {(selectedStay.client?.name ?? "C P")
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-fs-text">
                      {selectedStay.client?.name ?? "Client de passage"}
                    </div>
                    <div className="text-xs text-fs-on-surface-variant">
                      Chambre {selectedStay.room?.number ?? "—"} ·{" "}
                      <Badge tone="orange">Occupée</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 rounded-xl bg-fs-surface-container px-3 py-2.5 text-sm">
                  <Line label="Total chambre" value={formatCFA(selectedStay.room_total)} />
                  {Number(selectedStay.services_total) > 0 ? (
                    <Line label="Consommations" value={formatCFA(selectedStay.services_total)} />
                  ) : null}
                  {Number(selectedStay.tax_total) > 0 ? (
                    <Line label="Taxe de séjour" value={formatCFA(selectedStay.tax_total)} />
                  ) : null}
                  <Line label="Payé" value={formatCFA(selectedStay.paid_total)} valueClass="text-green-700" />
                  <Line
                    label="Reste"
                    value={formatCFA(
                      Math.max(0, Number(selectedStay.grand_total) - Number(selectedStay.paid_total)),
                    )}
                    valueClass="text-red-600"
                    strong
                  />
                </div>

                {stayConsumptions.length > 0 ? (
                  <div className="rounded-xl border border-black/10 px-3 py-2.5 text-sm">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fs-on-surface-variant">
                      Consommations
                    </div>
                    <ul className="space-y-1">
                      {stayConsumptions.map((c) => (
                        <li key={c.id} className="flex justify-between gap-2">
                          <span className="text-fs-text">
                            {c.quantity} × {c.label}
                          </span>
                          <span className="tabular-nums">{formatCFA(c.total)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Actions du séjour */}
                <div className="grid grid-cols-2 gap-2">
                  <AddConsumptionModal
                    stayId={selectedStay.id}
                    services={services}
                    onDone={() => router.refresh()}
                  />
                  {canCash ? (
                    <Button onClick={() => setTab("payment")}>
                      <CreditCard className="h-4 w-4" /> Encaisser
                    </Button>
                  ) : (
                    <span />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <ExtendModal
                    stayId={selectedStay.id}
                    current={selectedStay.expected_check_out?.slice(0, 10) ?? today}
                    min={today}
                    onDone={() => router.refresh()}
                  />
                  <Button
                    variant="secondary"
                    className="text-xs"
                    onClick={() => setTab("checkout")}
                  >
                    <LogOut className="h-4 w-4" /> Check-out
                  </Button>
                  <Link
                    href={`/reception/recu/${selectedStay.id}`}
                    target="_blank"
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-black/10 bg-white px-2 text-xs font-semibold hover:bg-fs-surface-container"
                  >
                    <Printer className="h-4 w-4" /> Reçu
                  </Link>
                </div>
              </div>
            )}
          </Panel>

          {/* Agenda du jour */}
          <Panel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-sm font-bold">
                  <LogIn className="h-4 w-4 text-fs-accent" /> Arrivées du jour
                </div>
                {arrivals.length === 0 ? (
                  <p className="text-xs text-fs-on-surface-variant">Aucune arrivée prévue.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {arrivals.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate">
                          {a.client?.name ?? "Sans client"}
                        </span>
                        <AssignRoomModal
                          reservation={a}
                          freeRooms={freeRooms}
                          onDone={() => router.refresh()}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-sm font-bold">
                  <LogOut className="h-4 w-4 text-fs-accent" /> Départs du jour
                </div>
                {stays.filter((s) => (s.expected_check_out ?? "").slice(0, 10) === today)
                  .length === 0 ? (
                  <p className="text-xs text-fs-on-surface-variant">Aucun départ prévu.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {stays
                      .filter((s) => (s.expected_check_out ?? "").slice(0, 10) === today)
                      .map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStayId(s.id);
                              setTab("checkout");
                            }}
                            className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-0.5 text-left hover:bg-fs-surface-container/60"
                          >
                            <span className="min-w-0 truncate">
                              {s.client?.name ?? "Passage"} · Ch. {s.room?.number}
                            </span>
                            <LogOut className="h-3.5 w-3.5 shrink-0 text-fs-on-surface-variant" />
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sous-composants                                                     */
/* ------------------------------------------------------------------ */

function Line({
  label,
  value,
  strong,
  valueClass,
}: {
  label: string;
  value: string;
  strong?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={strong ? "font-semibold text-fs-text" : "text-fs-on-surface-variant"}>
        {label}
      </span>
      <span
        className={
          "tabular-nums " +
          (strong ? "font-bold " : "") +
          (valueClass ?? "text-fs-text")
        }
      >
        {value}
      </span>
    </div>
  );
}

function NoStay() {
  return (
    <div className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-fs-on-surface-variant">
      Sélectionnez une chambre occupée ou un départ pour afficher le séjour.
    </div>
  );
}

function Locked() {
  return (
    <div className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-fs-on-surface-variant">
      Vous n&apos;avez pas l&apos;accès requis pour cette action.
    </div>
  );
}

function RoomLegend() {
  const items: { label: string; dot: string }[] = [
    { label: "Libre", dot: "bg-green-500" },
    { label: "Occupée", dot: "bg-orange-500" },
    { label: "Réservée", dot: "bg-blue-500" },
    { label: "À nettoyer", dot: "bg-amber-500" },
    { label: "Maintenance", dot: "bg-red-500" },
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-black/5 pt-3 text-xs text-fs-on-surface-variant">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${i.dot}`} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function RoomCard({
  room,
  stay,
  selected,
  onClick,
  onMarkClean,
}: {
  room: Room;
  stay: Stay | null;
  selected: boolean;
  onClick: () => void;
  onMarkClean?: () => void;
}) {
  const vis = ROOM_VIS[room.status];
  const StatusIcon =
    room.status === "maintenance" || room.status === "blocked"
      ? Wrench
      : room.status === "dirty" || room.status === "cleaning"
        ? Brush
        : room.status === "reserved"
          ? CalendarCheck
          : KeyRound;
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "relative flex flex-col rounded-xl border p-3 text-left transition-shadow hover:shadow-md " +
        vis.wrap +
        (selected ? " ring-2 ring-fs-accent" : "")
      }
    >
      <div className="flex items-start justify-between">
        <span className="text-lg font-bold text-fs-text">{room.number}</span>
        <StatusIcon className="h-4 w-4 text-fs-on-surface-variant" />
      </div>
      <span className="mt-1">
        <Badge tone={vis.tone}>{vis.label}</Badge>
      </span>
      {stay?.client?.name ? (
        <span className="mt-1.5 truncate text-xs text-fs-on-surface-variant">
          {stay.client.name}
        </span>
      ) : (
        <span className="mt-1.5 flex items-center gap-1.5 text-fs-on-surface-variant">
          <KeyRound className="h-3.5 w-3.5" />
          <Wifi className="h-3.5 w-3.5" />
        </span>
      )}
      {onMarkClean ? (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onMarkClean();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              onMarkClean();
            }
          }}
          className="mt-2 inline-flex items-center justify-center gap-1 rounded-md bg-white/80 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-white"
        >
          <Check className="h-3.5 w-3.5" /> Prête
        </span>
      ) : null}
    </button>
  );
}

function NewClientButton({ onCreated }: { onCreated: () => void }) {
  return (
    <Modal
      title="Nouveau client"
      trigger={(open) => (
        <Button
          variant="secondary"
          className="mb-[1px] h-[42px] shrink-0 px-3"
          onClick={open}
          aria-label="Nouveau client"
          title="Nouveau client"
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      )}
    >
      {(close) => (
        <ResourceForm
          action={createClientRecord}
          close={() => {
            close();
            onCreated();
          }}
          submitLabel="Créer le client"
          successMessage="Client créé."
        >
          <Field label="Nom complet" required>
            <Input name="name" required placeholder="Ex. Moussa Ouédraogo" />
          </Field>
          <Field label="Téléphone">
            <Input name="phone" inputMode="tel" placeholder="+226 …" />
          </Field>
        </ResourceForm>
      )}
    </Modal>
  );
}

function ReservationForm({
  clients,
  onDone,
}: {
  clients: ClientLite[];
  onDone: () => void;
}) {
  return (
    <ResourceForm
      action={createReservation}
      close={onDone}
      submitLabel="Enregistrer la réservation"
      successMessage="Réservation enregistrée."
    >
      <Field label="Client">
        <Select name="client_id" defaultValue="">
          <option value="">— Sans client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.phone ? ` · ${c.phone}` : ""}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Arrivée" required>
          <Input name="check_in_date" type="date" required />
        </Field>
        <Field label="Départ" required>
          <Input name="check_out_date" type="date" required />
        </Field>
        <Field label="Personnes">
          <Input name="guests_count" inputMode="numeric" defaultValue={1} />
        </Field>
        <Field label="Prix négocié / nuit">
          <Input name="agreed_rate" inputMode="numeric" />
        </Field>
        <Field label="Avance">
          <Input name="advance_paid" inputMode="numeric" defaultValue={0} />
        </Field>
        <Field label="Source">
          <Input name="source" placeholder="Téléphone, WhatsApp…" />
        </Field>
      </div>
    </ResourceForm>
  );
}

function PaymentForm({ stay, onDone }: { stay: Stay; onDone: () => void }) {
  const balance = Math.max(
    0,
    Number(stay.grand_total) - Number(stay.paid_total),
  );
  return (
    <div className="space-y-3">
      <div className="space-y-1.5 rounded-xl bg-fs-surface-container px-3 py-2.5 text-sm">
        <Line label={`Chambre ${stay.room?.number ?? ""}`} value={stay.client?.name ?? "Passage"} />
        <Line label="Reste à payer" value={formatCFA(balance)} strong valueClass="text-red-600" />
      </div>
      <ResourceForm
        action={addPayment}
        close={onDone}
        submitLabel="Encaisser"
        successMessage="Paiement encaissé."
      >
        <input type="hidden" name="stay_id" value={stay.id} />
        <Field label="Montant" required>
          <Input
            name="amount"
            inputMode="numeric"
            required
            defaultValue={balance || ""}
          />
        </Field>
        <Field label="Mode de paiement">
          <Select name="method" defaultValue="cash">
            {PAYMENT_METHOD_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Référence (facultatif)">
          <Input name="reference" placeholder="ID Orange Money, Moov…" />
        </Field>
      </ResourceForm>
    </div>
  );
}

function AddConsumptionModal({
  stayId,
  services,
  onDone,
}: {
  stayId: string;
  services: Service[];
  onDone: () => void;
}) {
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  return (
    <Modal
      title="Ajouter une consommation"
      trigger={(open) => (
        <Button variant="secondary" onClick={open}>
          <Plus className="h-4 w-4" /> Consommation
        </Button>
      )}
    >
      {(close) => (
        <ResourceForm
          action={addConsumption}
          close={() => {
            close();
            onDone();
          }}
          submitLabel="Ajouter"
          successMessage="Consommation ajoutée."
        >
          <input type="hidden" name="stay_id" value={stayId} />
          {services.length > 0 ? (
            <Field label="Service (préremplit)">
              <Select
                defaultValue=""
                onChange={(e) => {
                  const svc = services.find((s) => s.id === e.target.value);
                  if (svc) {
                    setLabel(svc.name);
                    setPrice(String(svc.price));
                  }
                }}
              >
                <option value="">— Saisie libre</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          <Field label="Désignation" required>
            <Input
              name="label"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Eau minérale, plat…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix unitaire" required>
              <Input
                name="unit_price"
                inputMode="numeric"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
            <Field label="Quantité">
              <Input name="quantity" inputMode="numeric" defaultValue={1} />
            </Field>
          </div>
        </ResourceForm>
      )}
    </Modal>
  );
}

function ExtendModal({
  stayId,
  current,
  min,
  onDone,
}: {
  stayId: string;
  current: string;
  min: string;
  onDone: () => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState(current);
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title="Prolonger le séjour"
      trigger={(open) => (
        <Button variant="secondary" className="text-xs" onClick={open}>
          <CalendarPlus className="h-4 w-4" /> Prolonger
        </Button>
      )}
    >
      {(close) => (
        <div className="space-y-3">
          <Field label="Nouvelle date de départ" required>
            <Input
              type="date"
              min={min}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Button
            className="w-full"
            disabled={busy || !date}
            onClick={async () => {
              setBusy(true);
              const res = await extendStay(stayId, date);
              setBusy(false);
              if (res.ok) {
                toast.success("Séjour prolongé.");
                close();
                onDone();
              } else {
                toast.error(frError(res.error));
              }
            }}
          >
            <ArrowLeftRight className="h-4 w-4" /> Confirmer
          </Button>
        </div>
      )}
    </Modal>
  );
}

function AssignRoomModal({
  reservation,
  freeRooms,
  onDone,
}: {
  reservation: Reservation;
  freeRooms: Room[];
  onDone: () => void;
}) {
  const toast = useToast();
  const [roomId, setRoomId] = useState(freeRooms[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title="Check-in — attribuer une chambre"
      trigger={(open) => (
        <Button variant="secondary" className="h-7 shrink-0 px-2 text-xs" onClick={open}>
          Arrivée
        </Button>
      )}
    >
      {(close) =>
        freeRooms.length === 0 ? (
          <p className="text-sm text-fs-on-surface-variant">
            Aucune chambre libre. Libérez ou nettoyez une chambre d&apos;abord.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-fs-on-surface-variant">
              Client : {reservation.client?.name ?? "Sans client"}
            </p>
            <Field label="Chambre à attribuer" required>
              <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                {freeRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Ch. {r.number}
                    {r.room_type?.name ? ` · ${r.room_type.name}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Button
              className="w-full"
              disabled={busy || !roomId}
              onClick={async () => {
                setBusy(true);
                const res = await checkInReservation(reservation.id, roomId);
                setBusy(false);
                if (res.ok) {
                  toast.success("Check-in effectué. Séjour ouvert.");
                  close();
                  onDone();
                } else {
                  toast.error(frError(res.error));
                }
              }}
            >
              <LogIn className="h-4 w-4" /> Confirmer le check-in
            </Button>
          </div>
        )
      }
    </Modal>
  );
}
