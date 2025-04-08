// src/app/series/page.js
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Pagination from "@/components/Pagination";
import { generateSlug } from "@/lib/utils";

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
        const page = searchParams.page ? parseInt(searchParams.page) : 1;

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
                        .from("chapters") // Mudado de stories para chapters
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
            <div className="max-w-[75rem] mx-auto px-4">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Séries Literárias</h1>
                    <p className="text-gray-600">
                        Explore histórias em capítulos criadas pelos escritores
                        da plataforma.
                    </p>
                </div>

                {series?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <p className="text-gray-600">Ainda não há séries publicadas.</p>
                        <Link href="/dashboard/new" className="h-10 px-4 flex items-center justify-center bg-[#484DB5] text-white rounded-md hover:shadow-md transition-shadow duration-200">
                            Crie a primeira série
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {seriesWithChapterCount.map((serie) => (
                                <Link
                                    href={`/series/${generateSlug(serie.title, serie.id)}`}
                                    key={serie.id}
                                    className="group border border-[#E5E7EB] rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                                >
                                    <div className="aspect-[3/4] relative bg-gray-100">
                                        {serie.cover_url ? (
                                            <img
                                                src={serie.cover_url}
                                                alt={serie.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                                                {serie.title
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
                                            {serie.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            por {serie.author_name}
                                        </p>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">
                                                {serie.chapter_count}{" "}
                                                {serie.chapter_count === 1
                                                    ? "capítulo"
                                                    : "capítulos"}
                                            </span>
                                            <span className="text-gray-600">
                                                {serie.is_completed
                                                    ? "Completa"
                                                    : "Em andamento"}
                                            </span>
                                        </div>
                                        {serie.genre && (
                                            <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                                                {serie.genre}
                                            </span>
                                        )}
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
            <div className="max-w-[75rem] mx-auto px-4">
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
