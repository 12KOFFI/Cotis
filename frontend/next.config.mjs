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

export default nextConfig;
