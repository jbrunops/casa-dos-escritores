import "./globals.css";
import Header from "@/components/Header";
import Link from "next/link";
import { ReactNode } from "react";
import DashboardPage from "./dashboard/page";

export const metadata = {
    title: "Casa dos Escritores: Publique Livros, Encontre Leitores e Cresça",
    description: "Publique seu livro, conecte-se com outros autores e encontre leitores na Casa dos Escritores, a maior comunidade para escritores do Brasil.",
};

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="pt-BR">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <meta name="google-adsense-account" content="ca-pub-2169694779628621"></meta>
                {/* SEO e Social Media Optimization */}
                <meta property="og:title" content="Casa dos Escritores: Publique Livros, Encontre Leitores e Cresça" />
                <meta property="og:description" content="Publique seu livro, conecte-se com outros autores e encontre leitores na Casa dos Escritores, a maior comunidade para escritores do Brasil." />
                <meta property="og:image" content="/casadosescritores.png" />
                <meta property="og:url" content="https://casadosescritores.com.br/" />
                <meta property="og:type" content="website" />
                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Casa dos Escritores: Publique Livros, Encontre Leitores e Cresça" />
                <meta name="twitter:description" content="Publique seu livro, conecte-se com outros autores e encontre leitores na Casa dos Escritores, a maior comunidade para escritores do Brasil." />
                <meta name="twitter:image" content="/casadosescritores.png" />
                {/* Canonical URL */}
                <link rel="canonical" href="https://casadosescritores.com.br/" />
                {/* Dados estruturados Schema.org */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `{
                  \"@context\": \"https://schema.org\",
                  \"@type\": \"WebSite\",
                  \"name\": \"Casa dos Escritores\",
                  \"url\": \"https://casadosescritores.com.br/\",
                  \"potentialAction\": {
                    \"@type\": \"SearchAction\",
                    \"target\": \"https://casadosescritores.com.br/search?q={search_term_string}\",
                    \"query-input\": \"required name=search_term_string\"
                  }
                }` }} />
            </head>
            <body suppressHydrationWarning>
                <Header />
                <main className="max-w-[75rem] mx-auto w-full flex-1">{children}</main>
                <footer className="border-t border-[#C4C4C4] mt-[1.875rem] bg-[#484DB5]">
                    <div className="max-w-[75rem] mx-auto w-full py-12 px-4 md:px-0">
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
                                    <button type="submit" className="bg-white text-[#484DB5] px-4 py-2 rounded-md font-semibold hover:bg-gray-100 transition-all duration-200">Enviar</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </footer>
            </body>
        </html>
    );
}
