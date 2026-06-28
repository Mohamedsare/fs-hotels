import { redirect } from "next/navigation";

// Point d'entrée : on renvoie vers le tableau de bord (le layout (app) garde l'auth).
export default function Home() {
  redirect("/dashboard");
}