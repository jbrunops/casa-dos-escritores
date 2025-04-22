import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Edit, BookOpen, Share2, MessageSquare, BookText, Book } from "lucide-react";
import SeriesHighlights from "@/components/SeriesHighlights";
import { generateSlug, createSummary, formatDate } from "@/lib/utils";
import RecentContentList from "@/components/RecentContentList";
import MostCommentedList from "@/components/MostCommentedList";
import TopWritersList from "@/components/TopWritersList";

export default async function HomePage() {
    const supabase = await createServerSupabaseClient();

    // Buscar todos os dados necessários em paralelo usando as funções RPC
    const [
        { data: recentContent, error: recentError },
        { data: mostCommentedContent, error: commentedError },
        { data: topWriters, error: writersError }
    ] = await Promise.all([
        supabase.rpc('get_recent_content', { p_limit: 10, p_offset: 0 }),
        supabase.rpc('get_most_commented_content', { p_limit: 10, p_offset: 0 }),
        supabase.rpc('get_top_writers', { p_limit: 10, p_offset: 0 })
    ]);

    // Logar os dados recebidos *antes* de checar erros
    console.log("[ Server ] Dados recebidos - Recentes:", JSON.stringify(recentContent, null, 2));
    console.log("[ Server ] Dados recebidos - Comentados:", JSON.stringify(mostCommentedContent, null, 2));
    console.log("[ Server ] Dados recebidos - Escritores:", JSON.stringify(topWriters, null, 2));

    // Ajustar logs de erro
    if (recentError) console.error("[ Server ] Erro ao buscar conteúdo recente:", JSON.stringify(recentError, null, 2));
    if (commentedError) console.error("[ Server ] Erro ao buscar conteúdo mais comentado:", JSON.stringify(commentedError, null, 2));
    if (writersError) console.error("[ Server ] Erro ao buscar top escritores:", JSON.stringify(writersError, null, 2));

    return (
        <>
            {/* Adiciona o H1 principal da página inicial */}
            <h1 className="sr-only">Casa Dos Escritores: Sua Plataforma para Publicar e Conectar</h1>
            
            {/* Seção de 3 colunas */}
            <section className="max-w-[75rem] mx-auto px-4 md:px-0 three-columns-section">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Coluna 1: Histórias Recentes */}
                    <div className="column">
                        <h2 className="text-2xl font-extrabold text-black mb-4 border-[#E5E7EB] pb-2 relative">
                            Histórias e Capítulos Recentes
                            <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                        </h2>
                        <RecentContentList contentList={recentContent} />
                    </div>

                    {/* Coluna 2: Mais Comentados */}
                    <div className="column">
                        <h2 className="text-2xl font-extrabold text-black mb-4  border-[#E5E7EB] pb-2 relative">
                            Mais Comentados
                            <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                        </h2>
                        <MostCommentedList contentList={mostCommentedContent} />
                    </div>

                    {/* Coluna 3: Top 10 Escritores */}
                    <div className="column">
                        <h2 className="text-2xl font-extrabold text-black mb-4  border-[#E5E7EB] pb-2 relative">
                            Escritores em Destaque
                            <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                        </h2>
                        <TopWritersList writers={topWriters} />
                    </div>
                </div>
            </section>

            {/* NOVA SEÇÃO: Séries Destacadas */}
            <section className="max-w-[75rem] mx-auto px-4 md:px-0 series-highlights-section">
                <SeriesHighlights />
            </section>

            <section className="max-w-[75rem] mx-auto px-4 md:px-0 py-12 features-section">
                <h2 className="text-3xl font-extrabold text-black mb-8 pb-2 relative">
                    Comece a Publicar: Como Funciona
                    <span className="block h-1 w-64 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 features-grid">
                    <div className="bg-white p-6 rounded-lg shadow-md border border-[#E5E7EB] flex flex-col items-center text-center feature-card">
                        <div className="bg-[#484DB5]/10 p-4 rounded-full mb-4 feature-icon">
                            <Edit size={32} color="#484DB5" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-[#484DB5]">1. Crie uma conta</h3>
                        <p className="text-gray-700">
                            Registre-se gratuitamente para começar a
                            compartilhar suas histórias com outros leitores.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border border-[#E5E7EB] flex flex-col items-center text-center feature-card">
                        <div className="bg-[#484DB5]/10 p-4 rounded-full mb-4 feature-icon">
                            <BookOpen size={32} color="#484DB5" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-[#484DB5]">2. Escreva suas histórias</h3>
                        <p className="text-gray-700">
                            Use nosso editor intuitivo para criar suas obras com
                            formatação profissional.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border border-[#E5E7EB] flex flex-col items-center text-center feature-card">
                        <div className="bg-[#484DB5]/10 p-4 rounded-full mb-4 feature-icon">
                            <Share2 size={32} color="#484DB5" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-[#484DB5]">3. Conecte-se com Leitores e Autores</h3>
                        <p className="text-gray-700">
                            Publique suas histórias e receba feedback valioso da
                            comunidade de leitores e outros escritores.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}
