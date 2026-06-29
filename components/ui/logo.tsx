import Image from "next/image";
import logoMark from "@/images/logo-mark.png";

/**
 * Logo FasoStock Hôtels (marque détourée). Import statique : Next infère les
 * dimensions intrinsèques ; on règle la taille d'affichage via `className`.
 */
export function Logo({ className = "h-16 w-auto" }: { className?: string }) {
  return (
    <Image src={logoMark} alt="FasoStock Hôtels" className={className} priority />
  );
}
