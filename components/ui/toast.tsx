"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  leaving: boolean;
  duration: number;
}

interface ToastApi {
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Hook d'accès aux toasts. Sûr même hors provider (no‑op). */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  return ctx ?? NOOP;
}

const NOOP: ToastApi = { success() {}, error() {}, info() {} };

const EXIT_MS = 220;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) =>
      list.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
    );
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, EXIT_MS);
  }, []);

  const push = useCallback(
    (type: ToastType, message: string, duration = 4500) => {
      const id = ++seq.current;
      setToasts((list) => [
        ...list,
        { id, type, message, leaving: false, duration },
      ]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m, d) => push("success", m, d),
      error: (m, d) => push("error", m, d ?? 6000),
      info: (m, d) => push("info", m, d),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onClose={dismiss} />
    </ToastContext.Provider>
  );
}

function Toaster({
  toasts,
  onClose,
}: {
  toasts: ToastItem[];
  onClose: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:items-end sm:p-0">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

const TONES: Record<
  ToastType,
  { bar: string; icon: string; ring: string; symbol: string }
> = {
  success: {
    bar: "bg-green-500",
    icon: "bg-green-100 text-green-700",
    ring: "ring-green-500/20",
    symbol: "✓",
  },
  error: {
    bar: "bg-red-500",
    icon: "bg-red-100 text-red-700",
    ring: "ring-red-500/20",
    symbol: "!",
  },
  info: {
    bar: "bg-fs-accent",
    icon: "bg-orange-100 text-fs-accent",
    ring: "ring-fs-accent/20",
    symbol: "i",
  },
};

function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: () => void;
}) {
  const tone = TONES[toast.type];
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border border-black/10 bg-fs-card shadow-2xl ring-1 ${tone.ring}`}
      style={{
        animation: `${
          toast.leaving ? "fs-toast-out" : "fs-toast-in"
        } ${EXIT_MS}ms cubic-bezier(0.16,1,0.3,1) both`,
      }}
    >
      <div className="flex items-start gap-3 p-3.5 pr-10">
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${tone.icon}`}
          aria-hidden
        >
          {tone.symbol}
        </span>
        <p className="min-w-0 flex-1 break-words pt-0.5 text-sm font-medium leading-snug text-fs-text">
          {toast.message}
        </p>
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-fs-on-surface-variant hover:bg-fs-surface-container"
        >
          ✕
        </button>
      </div>
      {!toast.leaving ? (
        <div
          className={`h-1 origin-left ${tone.bar}`}
          style={{
            animation: `fs-toast-bar ${toast.duration}ms linear both`,
          }}
        />
      ) : null}
    </div>
  );
}
