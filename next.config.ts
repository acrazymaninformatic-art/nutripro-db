import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Mantiene el aviso de actualizaciones de seguridad de Next.js activo.
    agentUpgrade: "security",
    // Las subidas de documentos/fotos clínicas usan Server Actions y el
    // almacenamiento privado admite archivos de hasta 15 MB.
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
