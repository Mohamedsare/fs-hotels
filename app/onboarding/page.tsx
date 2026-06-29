import { Card } from "@/components/ui/ui";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-bold">Bienvenue 👋</h1>
        <p className="mt-1 mb-4 text-sm text-fs-on-surface-variant">
          Configurons votre établissement pour commencer.
        </p>
        <OnboardingForm />
      </Card>
    </main>
  );
}