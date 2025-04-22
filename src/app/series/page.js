// src/app/series/page.js
import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 12; // Número de séries por página

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
            .from("series")
            .select(
                `
                id,
                title,
                genre,
                cover_url,
                is_completed,
                view_count,
                author_id,
                profiles ( username ) 
              `,
                { count: "exact" }
            )
            .order("created_at", { ascending: false })
            .range(from, to);

        if (error) {
            console.error("Erro ao buscar séries:", error);
            throw error;
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
                author_name: serie.profiles?.username || "Autor desconhecido", 
                chapter_count: countsMap[serie.id] || 0,
            }));
        } else {
             seriesWithDetails = []; // Garante que seja um array vazio se não houver séries
        }
       
        // Calcular o número total de páginas
        const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

        return (
            <div className="max-w-[75rem] mx-auto px-4 sm:px-0">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Séries Literárias</h1>
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                            {seriesWithDetails.map((serie, index) => (
                                <Link
                                    href={`/series/${serie.id}`}
                                    key={serie.id}
                                    className="flex flex-col rounded-lg border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow bg-white"
                                >
                                    <div className="relative w-full pt-[150%]">
                                        {serie.cover_url ? (
                                            <Image
                                                src={serie.cover_url}
                                                alt={serie.title}
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                                className="object-cover"
                                                priority={index < 6}
                                            />
                                        ) : (
                                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-[#484DB5] text-white text-4xl font-bold">
                                                {serie.title.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 flex-grow flex flex-col">
                                        <h3 className="font-bold text-base line-clamp-2 mb-1">{serie.title}</h3>
                                        <p className="text-xs text-gray-600 mb-2">
                                            de {serie.author_name}
                                        </p>
                                        {serie.genre && (
                                            <div className="mb-2">
                                                <span className="text-xs text-[#484DB5] font-medium">
                                                    › {serie.genre}
                                                </span>
                                            </div>
                                        )}
                                        <div className="mt-auto flex items-center justify-between text-xs text-gray-600">
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                {serie.view_count?.toLocaleString("pt-BR") || "0"}
                                            </div>
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                {serie.chapter_count}
                                            </div>
                                            <span className="text-xs text-[#484DB5] bg-purple-100 px-2 py-0.5 rounded">
                                                {serie.is_completed ? "Completa" : "escrevendo..."}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
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
        console.error("Erro na página de séries:", error);
        return (
            <div className="max-w-[75rem] mx-auto px-4 sm:px-0">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Séries Literárias</h1>
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
