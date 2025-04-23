// src/app/series/page.js
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Pagination from "@/components/Pagination";
import SeriesCard from "@/components/SeriesCard";

const PAGE_SIZE = 18; // Ajustando para 3 linhas de 6 cards (lg)

export const metadata = {
    title: "Séries Literárias | Casa Dos Escritores",
    description:
        "Explore séries de histórias em capítulos na Casa dos Escritores",
};

export default async function SeriesPage({ searchParams }) {
    try {
        console.log("Carregando página de séries");
        const supabase = await createServerSupabaseClient();
        const page = searchParams.page ? parseInt(searchParams.page) : 1;

        // Calcular o offset para paginação
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // Buscar séries com paginação E DADOS DO AUTOR
        const {
            data: series,
            count,
            error,
        } = await supabase
            .from("series_with_author")
            .select(
                `
                id,
                title,
                genre,
                cover_url,
                is_completed,
                view_count,
                author_id,
                author_name
              `,
                { count: "exact" }
            )
            .order("created_at", { ascending: false })
            .range(from, to);

        if (error) {
            // Log detalhado do erro do Supabase
            console.error("[Server] Erro detalhado ao buscar séries do Supabase:", JSON.stringify(error, null, 2));
            console.error("[Server] Stack do erro Supabase:", error.stack);
            throw error; // Re-lançar o erro original
        }

        console.log("Séries encontradas:", series?.length || 0);

        // Buscar contagem de capítulos para cada série EM LOTE
        let seriesWithDetails = [];
        if (series && series.length > 0) {
            const seriesIds = series.map(s => s.id);
            const { data: chapterCounts, error: countError } = await supabase
                .from('chapters')
                .select('series_id, id', { count: 'exact', head: false })
                .in('series_id', seriesIds);

            if (countError) {
                console.warn("[Server] Erro ao contar capítulos em lote (Séries Page):", countError);
                // Continuar mesmo com erro, definindo 0
            }

            const countsMap = chapterCounts?.reduce((acc, { series_id }) => {
                acc[series_id] = (acc[series_id] || 0) + 1;
                return acc;
            }, {}) || {};

            // Combinar dados
            seriesWithDetails = series.map(serie => ({
                ...serie,
                chapter_count: countsMap[serie.id] || 0,
            }));
        } else {
             seriesWithDetails = []; // Garante que seja um array vazio se não houver séries
        }
       
        // Calcular o número total de páginas
        const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

        return (
            <div className="max-w-[75rem] mx-auto px-4 md:px-0">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Séries Literárias</h1>
                    <p className="text-gray-600">
                        Explore histórias em capítulos criadas pelos escritores
                        da plataforma.
                    </p>
                </div>

                {seriesWithDetails?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <p className="text-gray-600">Ainda não há séries publicadas.</p>
                        <Link href="/dashboard/new" className="h-10 px-4 flex items-center justify-center bg-[#484DB5] text-white rounded-md hover:shadow-md transition-shadow duration-200">
                            Crie a primeira série
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-2">
                            {seriesWithDetails.map((serie, index) => (
                                <SeriesCard 
                                    key={serie.id}
                                    serie={serie}
                                    index={index}
                                    showRanking={false}
                                />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-8">
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    baseUrl="/series"
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    } catch (error) {
        // Log detalhado no catch principal
        console.error("[Server] Erro GERAL na página de séries:", error?.message || error);
        console.error("[Server] Stack do erro GERAL:", error?.stack);
        return (
            <div className="max-w-[75rem] mx-auto px-4 md:px-0">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Séries Literárias</h1>
                    <p className="text-gray-600">
                        Explore histórias em capítulos criadas pelos escritores
                        da plataforma.
                    </p>
                </div>
                <div className="error-message">
                    <p>
                        Não foi possível carregar as séries. Por favor, tente
                        novamente.
                    </p>
                </div>
            </div>
        );
    }
}
