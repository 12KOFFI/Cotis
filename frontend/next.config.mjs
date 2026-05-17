import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // En dev local, autorise les origines réseau
  allowedDevOrigins: ["192.168.1.2"],

  // Optimisation images : si pas de domaine externe, laisser vide
  // En production sur Vercel, les images sont auto-optimisées
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default withPWA(nextConfig);
