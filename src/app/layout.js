import Script from 'next/script';
import "./globals.css";
import { Poppins } from 'next/font/google';
import Header from "@/components/Header";
import Link from "next/link";

// ADICIONADO: Configuração da fonte Poppins
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata = {
    title: "Casa Dos Escritores: Plataforma Online para Autores Publicarem e se Conectarem",
    description: "Publique, conecte-se e cresça na Casa Dos Escritores. A plataforma online ideal para autores independentes encontrarem leitores e ferramentas.",
    openGraph: {
        title: "Casa Dos Escritores: Plataforma Online para Autores", 
        description: "A plataforma online ideal para autores independentes encontrarem leitores e ferramentas.", 
        url: 'https://casadosescritores.com.br',
        siteName: 'Casa dos Escritores',
        images: [
          {
            url: 'https://casadosescritores.com.br/og-default-image.jpg', 
            width: 1200,
            height: 630,
            alt: 'Casa dos Escritores - Plataforma para Autores',
          },
        ],
        locale: 'pt_BR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image', 
        title: 'Casa Dos Escritores: Plataforma Online para Autores',
        description: 'A plataforma online ideal para autores independentes encontrarem leitores e ferramentas.',
        images: ['https://casadosescritores.com.br/og-default-image.jpg'], 
    },
};

// Definindo o objeto schema fora do return
const schemaData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "Casa Dos Escritores",
      "url": "https://casadosescritores.com.br/", 
      "description": "Publique, conecte-se e cresça na Casa Dos Escritores. A plataforma online ideal para autores independentes encontrarem leitores e ferramentas."
    },
    {
      "@type": "Organization",
      "name": "Casa Dos Escritores",
      "url": "https://casadosescritores.com.br/", 
      "sameAs": [
        "https://www.instagram.com/casadosescritoresbr"
      ],
      "logo": "https://casadosescritores.com.br/casadosescritores.png" 
    }
  ]
};

export default function RootLayout({ children }) {
    return (
        <html lang="pt-BR" className={poppins.className}>
            <head>
                {/* REMOVIDO: Tag <link> para Google Fonts */}
                {/* 
                <link
                    href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                */}
                <meta name="google-adsense-account" content="ca-pub-2169694779628621"></meta>
                {/* AdSense Script */}
                <Script
                  async
                  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2169694779628621"
                  crossOrigin="anonymous"
                  strategy="lazyOnload" // Opcional: controla quando carregar (lazyOnload é bom para desempenho)
                />
                {/* Schema Markup */}
                <script 
                  type="application/ld+json" 
                  dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} 
                />
            </head>
            <body suppressHydrationWarning>
                <Header />
                <main>{children}</main>
                <footer className="border-t border-border mt-[1.875rem] bg-primary">
                    <div className="content-wrapper py-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Coluna 1 - Logo e informações */}
                            <div className="flex flex-col space-y-4">
                                <div className="flex items-center">
                                    <h2 className="text-xl font-bold text-white">Casa dos Escritores</h2>
                                </div>
                                <p className="text-white max-w-sm">O lugar ideal para compartilhar suas histórias, conectar-se com outros escritores e inspirar leitores.</p>
                                <p className="text-white">&copy; {new Date().getFullYear()} Casa Dos Escritores</p>
                            </div>
                            
                            {/* Coluna 2 - Links úteis */}
                            <div className="flex flex-col space-y-4">
                                <h3 className="text-lg font-semibold text-white">Links úteis</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <Link href="/categories" className="text-white hover:text-opacity-80 transition-colors duration-200">Categorias</Link>
                                    <Link href="/series" className="text-white hover:text-opacity-80 transition-colors duration-200">Séries</Link>
                                    {/* Mantido espaço para outros links */}
                                </div>
                            </div>
                            
                            {/* Coluna 3 - Formulário de sugestão */}
                            <div className="flex flex-col space-y-4">
                                <h3 className="text-lg font-semibold text-white">Envie sua sugestão</h3>
                                <p className="text-white">Ajude-nos a melhorar a plataforma com suas ideias.</p>
                                <form className="space-y-3">
                                    <input 
                                        type="email" 
                                        placeholder="Seu e-mail"
                                        className="w-full h-10 px-3 bg-white text-gray-600 placeholder-gray-400 focus:outline-none rounded-md"
                                    />
                                    <textarea 
                                        placeholder="Sua sugestão"
                                        className="w-full p-3 bg-white text-gray-600 placeholder-gray-400 focus:outline-none min-h-[5rem] rounded-md"
                                    ></textarea>
                                    <button 
                                        type="submit"
                                        className="h-10 px-4 bg-white text-primary rounded-md hover:bg-opacity-90 transition-all duration-300 ease-in-out"
                                    >
                                        Enviar
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </footer>
            </body>
        </html>
    );
}
