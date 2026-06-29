"use client";

import { SubmitButton } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Field, Input, Select } from "@/components/ui/ui";
import { FORM_IDLE } from "@/lib/forms";
import { frError } from "@/lib/errors";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { createHotel } from "./actions";

export function OnboardingForm() {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction] = useActionState(createHotel, FORM_IDLE);
  const done = useRef(false);
  const lastError = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.ok && !done.current) {
      done.current = true;
      toast.success("Établissement créé. Bienvenue sur FasoStock Hôtels !");
      router.replace("/dashboard");
      router.refresh();
    } else if (state.error && state.error !== lastError.current) {
      lastError.current = state.error;
      toast.error(frError(state.error));
    }
  }, [state, router, toast]);

  return (
    <form action={formAction} className="space-y-3">
      <Field label="Nom de l'hôtel" required>
        <Input name="name" required placeholder="Hôtel La Détente" />
      </Field>
      <Field label="Classement">
        <Select name="classification" defaultValue="unclassified">
          <option value="unclassified">Non classé</option>
          <option value="one_star">1 étoile</option>
          <option value="two_star">2 étoiles</option>
          <option value="three_star_plus">3 étoiles et +</option>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ville">
          <Input name="city" placeholder="Ouagadougou" />
        </Field>
        <Field label="Téléphone">
          <Input name="phone" placeholder="+226 ..." />
        </Field>
      </div>
      <Field label="Taxe touristique (FCFA / personne / nuit)">
        <Input name="tourism_tax_per_night" inputMode="numeric" placeholder="200" />
      </Field>
      <div className="pt-1">
        <SubmitButton>Créer l&apos;hôtel</SubmitButton>
      </div>
    </form>
  );
}