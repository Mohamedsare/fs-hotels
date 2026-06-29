import type { MetadataRoute } from "next";

// PWA : Next sert ce fichier sur /manifest.webmanifest et l'ajoute automatiquement
// au <head>. Icônes générées depuis images/logo.png (cf. public/icon-*.png).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FasoStock Hôtels",
    short_name: "FS Hôtels",
    description:
      "Gestion hôtelière — chambres, réservations, séjours, caisse et factures.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f8f7f5",
    theme_color: "#e85d2c",
    lang: "fr",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
