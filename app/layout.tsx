import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "FasoStock Hôtels",
  description:
    "Gestion hôtelière — chambres, réservations, séjours, caisse et factures.",
};

export const viewport: Viewport = {
  themeColor: "#e85d2c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-fs-surface text-fs-text antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}