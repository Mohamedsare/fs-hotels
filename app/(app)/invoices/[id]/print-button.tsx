"use client";

import { Button } from "@/components/ui/ui";

/** Bouton d'impression — masqué à l'impression via la classe `print:hidden`. */
export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      Imprimer / PDF
    </Button>
  );
}
