import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Désactiver ESLint pendant le build pour le déploiement
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Désactiver les erreurs TypeScript pendant le build pour le déploiement
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
