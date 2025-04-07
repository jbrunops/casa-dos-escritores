// src/app/series/page.js
import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Pagination from "@/components/Pagination";
import { generateSlug } from "@/lib/utils";
import { BookOpen, User, Eye, Tag } from "lucide-react";

const PAGE_SIZE = 12; // Número de séries por página

export const metadata = {
    title: "Séries Literárias",
    description:
        "Explore séries de histórias em capítulos na Casa dos Escritores",
};

export default async function SeriesPage({ searchParams }) {
    try {
        console.log("Carregando página de séries");
        const supabase = await createServerSupabaseClient();
        
        // Aguardar searchParams antes de usar suas propriedades
        const searchParamsPage = searchParams ? searchParams.page : null;
        const page = searchParamsPage ? parseInt(searchParamsPage) : 1;

        // Calcular o offset para paginação
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // Buscar séries com paginação
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
                author_id
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

        // Buscar autores para cada série
        const seriesWithAuthors = await Promise.all(
            (series || []).map(async (serie) => {
                try {
                    const { data: author } = await supabase
                        .from("profiles")
                        .select("username")
                        .eq("id", serie.author_id)
                        .single();

                    return {
                        ...serie,
                        author_name: author?.username || "Autor desconhecido",
                    };
                } catch (err) {
                    console.warn(
                        "Erro ao buscar autor para série:",
                        serie.id,
                        err
                    );
                    return {
                        ...serie,
                        author_name: "Autor desconhecido",
                    };
                }
            })
        );

        // Buscar contagem de capítulos para cada série
        const seriesWithChapterCount = await Promise.all(
            seriesWithAuthors.map(async (serie) => {
                const { count: chapterCount, error: countError } =
                    await supabase
                        .from("chapters")
                        .select("*", { count: "exact" })
                        .eq("series_id", serie.id);

                if (countError) {
                    console.warn("Erro ao contar capítulos:", countError);
                    return {
                        ...serie,
                        chapter_count: 0,
                    };
                }

                return {
                    ...serie,
                    chapter_count: chapterCount || 0,
                };
            })
        );

        // Calcular o número total de páginas
        const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Séries Literárias</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Explore histórias em capítulos criadas pelos escritores da plataforma.
                    </p>
                </div>

                {series?.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-lg shadow-sm border border-[#E5E7EB]">
                        <p className="text-gray-600 mb-4">Ainda não há séries publicadas.</p>
                        <Link 
                            href="/dashboard/new-series" 
                            className="inline-flex items-center px-4 py-2 bg-[#484DB5] text-white rounded-md hover:bg-[#3a3e9f] transition-colors"
                        >
                            <BookOpen className="w-5 h-5 mr-2" />
                            Crie a primeira série
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-6 justify-center">
                            {seriesWithChapterCount.map((serie) => (
                                <Link
                                    href={`/series/${generateSlug(serie.title, serie.id)}`}
                                    key={serie.id}
                                    className="bg-white rounded-lg overflow-hidden shadow-sm flex flex-col border border-[#E5E7EB] w-[220px]"
                                >
                                    <div className="relative h-[300px] bg-gray-100">
                                        {serie.cover_url ? (
                                            <img
                                                src={serie.cover_url}
                                                alt={serie.title}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[#f8f9fe]">
                                                <span className="text-5xl font-bold text-[#484DB5]">
                                                    {serie.title
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 flex-grow flex flex-col">
                                        <h3 className="text-base font-semibold text-gray-800 mb-1 line-clamp-2">
                                            {serie.title}
                                        </h3>
                                        
                                        <div className="text-xs text-gray-500 mb-1">
                                            {serie.author_name}
                                        </div>
                                        
                                        {serie.genre && (
                                            <div className="mb-4">
                                                <span className="text-xs text-[#484DB5]">
                                                    {serie.genre}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-center mt-auto text-xs text-gray-600">
                                            <div className="flex space-x-4">
                                                <div className="flex items-center">
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    <span>{serie.view_count || 0}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <BookOpen className="w-4 h-4 mr-1" />
                                                    <span>{serie.chapter_count}</span>
                                                </div>
                                            </div>
                                            
                                            {!serie.is_completed && (
                                                <span className="bg-[#484DB5] text-white text-xs px-2 py-0.5 rounded">
                                                    em andamento
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-10">
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
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Séries Literárias</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Explore histórias em capítulos criadas pelos escritores da plataforma.
                    </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700">
                    <p className="mb-2 font-medium">
                        Não foi possível carregar as séries. Por favor, tente novamente.
                    </p>
                    <p className="text-sm text-red-600">
                        Se o problema persistir, entre em contato com o suporte.
                    </p>
                </div>
            </div>
        );
    }
}
