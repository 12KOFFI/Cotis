/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimisation images : si pas de domaine externe, laisser vide
  // En production, les images sont auto-optimisées
  images: {
    remotePatterns: [
      // Autorise TOUS les domaines en HTTPS (pour votre serveur de production)
      {
        protocol: "https",
        hostname: "**",
      },
      // Autorise le backend local en HTTP pour le développement
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
};

export default nextConfig;