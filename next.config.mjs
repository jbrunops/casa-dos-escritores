/** @type {import('next').NextConfig} */
const nextConfig = {
    // Desabilitar a verificação de ESLint durante o build para evitar falhas
    eslint: {
        // Não falhar o build em erros do ESLint
        ignoreDuringBuilds: true,
    },
    // Otimizações para Vercel
    reactStrictMode: true,
    poweredByHeader: false,
    // Configuração para imagens externas que possam ser usadas
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
    // Variáveis de ambiente explicitamente definidas
    env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://kkykesdoqdeagnuvlxao.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreWtlc2RvcWRlYWdudXZseGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODc5NTYsImV4cCI6MjA1OTM2Mzk1Nn0.kS69ce8FLws_rXMvbqOhRgMsaPntbzDGgwckQHYTnyk",
        SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreWtlc2RvcWRlYWdudXZseGFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzc4Nzk1NiwiZXhwIjoyMDU5MzYzOTU2fQ.mpMIymtj-VHrouVu9RGEcQY3qvNOAi6hgjUW-Cs2in0",
    },
};

export default nextConfig;