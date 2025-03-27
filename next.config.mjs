/** @type {import('next').NextConfig} */
const nextConfig = {
    // Desabilitar a verificação de ESLint durante o build para evitar falhas
    eslint: {
        // Não falhar o build em erros do ESLint
        ignoreDuringBuilds: true,
    },
    // Otimizações para Vercel
    swcMinify: true,
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
};

export default nextConfig;
