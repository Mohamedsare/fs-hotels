"use client";

import { SubmitButton } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/ui";
import { FORM_IDLE } from "@/lib/forms";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { createHotel } from "./actions";

export function OnboardingForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createHotel, FORM_IDLE);
  const done = useRef(false);

  useEffect(() => {
    if (state.ok && !done.current) {
      done.current = true;
      router.replace("/dashboard");
      router.refresh();
    }
  }, [state, router]);

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
      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
      <div className="pt-1">
        <SubmitButton>Créer l&apos;hôtel</SubmitButton>
      </div>
    </form>
  );
}