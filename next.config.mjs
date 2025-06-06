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
    
    // Cabeçalhos de segurança
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()'
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://kkykesdoqdeagnuvlxao.supabase.co wss://kkykesdoqdeagnuvlxao.supabase.co; frame-ancestors 'none';"
                    }
                ]
            }
        ];
    },
    
    // Configuração segura para imagens externas - apenas domínios confiáveis
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "kkykesdoqdeagnuvlxao.supabase.co",
                pathname: "/storage/v1/object/public/**",
            },
            {
                protocol: "https", 
                hostname: "images.unsplash.com",
            },
            {
                protocol: "https",
                hostname: "via.placeholder.com",
            },
        ],
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 60,
        dangerouslyAllowSVG: false,
    },
    // Variáveis de ambiente serão carregadas do .env.local
    // NUNCA exponha credenciais sensíveis no código!
};

export default nextConfig;