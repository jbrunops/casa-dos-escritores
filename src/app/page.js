import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Edit, BookOpen, Share2, MessageSquare, BookText, Book } from "lucide-react";
import RankedSeriesList from "@/components/RankedSeriesList";
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
        { data: topWriters, error: writersError },
        { data: featuredSeries, error: featuredSeriesError }
    ] = await Promise.all([
        supabase.rpc('get_recent_content', { p_limit: 10, p_offset: 0 }),
        supabase.rpc('get_most_commented_content', { p_limit: 10, p_offset: 0 }),
        supabase.rpc('get_top_writers', { p_limit: 10, p_offset: 0 }),
        // Buscar séries em destaque para passar como dados iniciais para RankedSeriesList
        supabase.from("series_with_author")
            .select(`
                id,
                title,
                cover_url,
                genre,
                view_count,
                is_completed,
                author_id,
                author_name,
                created_at
            `)
            .order('view_count', { ascending: false })
            .limit(8)
    ]);

    // Buscar contagem de capítulos para séries em destaque
    let seriesWithChapters = [];
    if (featuredSeries?.length > 0) {
        const seriesIds = featuredSeries.map(s => s.id);
        const { data: chapterCounts } = await supabase
            .from('chapters')
            .select('series_id, id')
            .in('series_id', seriesIds);

        const countsMap = chapterCounts?.reduce((acc, { series_id }) => {
            acc[series_id] = (acc[series_id] || 0) + 1;
            return acc;
        }, {}) || {};

        seriesWithChapters = featuredSeries.map(serie => ({
            ...serie,
            chapter_count: countsMap[serie.id] || 0,
        }));
    }

    // Logar os dados recebidos *antes* de checar erros
    console.log("[ Server ] Dados recebidos - Recentes:", JSON.stringify(recentContent, null, 2));
    console.log("[ Server ] Dados recebidos - Comentados:", JSON.stringify(mostCommentedContent, null, 2));
    console.log("[ Server ] Dados recebidos - Escritores:", JSON.stringify(topWriters, null, 2));

    // Ajustar logs de erro
    if (recentError) console.error("[ Server ] Erro ao buscar conteúdo recente:", JSON.stringify(recentError, null, 2));
    if (commentedError) console.error("[ Server ] Erro ao buscar conteúdo mais comentado:", JSON.stringify(commentedError, null, 2));
    if (writersError) console.error("[ Server ] Erro ao buscar top escritores:", JSON.stringify(writersError, null, 2));
    if (featuredSeriesError) console.error("[ Server ] Erro ao buscar séries em destaque:", JSON.stringify(featuredSeriesError, null, 2));

    return (
        <>
            {/* Adiciona o H1 principal da página inicial */}
            <h1 className="sr-only">Casa Dos Escritores: Sua Plataforma para Publicar e Conectar</h1>
            
            {/* SEÇÃO: Séries em Destaque (Mais Vistas) */}
            <RankedSeriesList 
              title="Séries em Destaque"
              orderByField="view_count"
              orderByAscending={false}
              limit={8}
              initialData={seriesWithChapters}
            />

            {/* NOVA SEÇÃO: Novas Séries (Mais Recentes) - Adicionado padding top */}
            {/* <div className="pt-6">
              <RankedSeriesList 
                title="Novas Séries"
                orderByField="created_at"
                orderByAscending={false}
                limit={8}
              />
            </div> */}
            
            {/* Seção de 3 colunas */}
            <section className="max-w-[75rem] mx-auto px-4 md:px-0 py-8 three-columns-section">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Coluna 1: Histórias Recentes */}
                    <div className="column">
                        <h2 className="text-2xl font-extrabold text-black mb-4 border-[#D7D7D7] pb-2 relative">
                            Recentes
                            <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                        </h2>
                        <RecentContentList contentList={recentContent} />
                    </div>

                    {/* Coluna 2: Mais Comentados */}
                    <div className="column">
                        <h2 className="text-2xl font-extrabold text-black mb-4 border-[#D7D7D7] pb-2 relative">
                            Mais Comentados
                            <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                        </h2>
                        <MostCommentedList contentList={mostCommentedContent} />
                    </div>

                    {/* Coluna 3: Top 10 Escritores */}
                    <div className="column">
                        <h2 className="text-2xl font-extrabold text-black mb-4 border-[#D7D7D7] pb-2 relative">
                            Escritores em Destaque
                            <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                        </h2>
                        <TopWritersList writers={topWriters} />
                    </div>
                </div>
            </section>


        </>
    );
}
