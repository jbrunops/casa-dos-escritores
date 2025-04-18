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

interface Series {
    id: string;
    title: string;
    genre: string;
    cover_url?: string;
    is_completed: boolean;
    view_count: number;
    author_id: string;
    author_name?: string;
    chapter_count?: number;
}

interface Profile {
    id: string;
    username: string;
}

interface SeriesPageProps {
    searchParams: { page?: string };
}

export default async function SeriesPage({ searchParams }: SeriesPageProps) {
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
            `id, title, genre, cover_url, is_completed, view_count, author_id`,
            { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(from, to);
    if (error) {
        console.error("Erro ao buscar séries:", error);
        throw error;
    }

    // Buscar autores para cada série
    const seriesWithAuthors = await Promise.all(
        (series || []).map(async (serie: Series) => {
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
                return {
                    ...serie,
                    author_name: "Autor desconhecido",
                };
            }
        })
    );

    // Buscar contagem de capítulos para cada série
    const seriesWithChapterCount = await Promise.all(
        seriesWithAuthors.map(async (serie: Series) => {
            const { count: chapterCount, error: countError } = await supabase
                .from("chapters")
                .select("*", { count: "exact" })
                .eq("series_id", serie.id);
            return {
                ...serie,
                chapter_count: countError ? 0 : chapterCount || 0,
            };
        })
    );

    // Renderização da UI
    return (
        <div className="series-page">
            <h1 className="text-2xl font-bold mb-4">Séries Literárias</h1>
            <div className="series-list grid grid-cols-1 md:grid-cols-3 gap-6">
                {seriesWithChapterCount.map((serie) => (
                    <div key={serie.id} className="border rounded-lg p-4 bg-white shadow">
                        <div className="flex flex-col items-center">
                            {serie.cover_url && (
                                <img
                                    src={serie.cover_url}
                                    alt={serie.title}
                                    className="w-32 h-48 object-cover mb-2 rounded"
                                />
                            )}
                            <h2 className="text-lg font-semibold mb-1">
                                <Link href={`/series/${generateSlug(serie.title, serie.id)}`}>{serie.title}</Link>
                            </h2>
                            <div className="max-w-[75rem] mx-auto w-full py-8 px-4 md:px-0">
                                {serie.author_name} • {serie.chapter_count} capítulos
                            </div>
                            <div className="text-xs text-gray-400">
                                {serie.genre} • {serie.is_completed ? "Completa" : "Em andamento"}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-8">
                <Pagination
                    totalItems={count || 0}
                    pageSize={PAGE_SIZE}
                    currentPage={page}
                    basePath="/series"
                />
            </div>
        </div>
    );
}
