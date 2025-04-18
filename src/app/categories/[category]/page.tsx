import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server"; // USO CORRETO: este arquivo é server-side.
import { notFound } from "next/navigation";
import Pagination from "@/components/Pagination";
import { generateSlug } from "@/lib/utils";
import { Metadata } from "next";
import { Database } from "@/types/supabase";

const PAGE_SIZE = 9;

type Params = {
    category: string;
};

type SearchParams = {
    page?: string;
};

type CategoryPageProps = {
    params: Params;
    searchParams: SearchParams;
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const categoryName = decodeURIComponent(params.category)
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    return {
        title: `Histórias de ${categoryName}`,
        description: `Explore histórias na categoria ${categoryName}`,
    };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const supabase = await createServerSupabaseClient<Database>();
    const page = searchParams.page ? parseInt(searchParams.page) : 1;
    const categoryName = decodeURIComponent(params.category)
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let stories: any[] = [];
    let storiesWithAuthorInfo: any[] = [];
    let storiesError: any = null;
    let seriesError: any = null;
    try {
        const {
            data: storiesData,
            count: storiesCount,
            error: storiesErrorResp,
        } = await supabase
            .from("stories")
            .select(
                `id, title, content, created_at, author_id`,
                { count: "exact" }
            )
            .eq("is_published", true)
            .ilike("category", categoryName)
            .order("created_at", { ascending: false });
        storiesError = storiesErrorResp;
        if (storiesError) {
            console.error("Erro ao buscar histórias:", storiesError);
        } else {
            stories = storiesData || [];
        }
    } catch (err) {
        console.error("Exceção ao buscar histórias:", err);
    }
    try {
        if (stories && stories.length > 0) {
            const authorIds = [...new Set(stories.map(story => story.author_id))].filter(Boolean);
            if (authorIds.length > 0) {
                try {
                    const { data: authorsData, error: authorsError } = await supabase
                        .from("profiles")
                        .select("id, username")
                        .in("id", authorIds);
                    if (authorsError) {
                        console.error("Erro ao buscar autores das histórias:", authorsError);
                    } else {
                        const authorMap: Record<string, string> = {};
                        authorsData?.forEach(author => {
                            authorMap[author.id] = author.username;
                        });
                        storiesWithAuthorInfo = stories.map(story => ({
                            ...story,
                            authorName: authorMap[story.author_id] || "Autor desconhecido"
                        }));
                    }
                } catch (err) {
                    console.error("Erro ao processar autores de histórias:", err);
                    storiesWithAuthorInfo = stories.map(story => ({
                        ...story,
                        authorName: "Autor desconhecido"
                    }));
                }
            } else {
                storiesWithAuthorInfo = stories.map(story => ({
                    ...story,
                    authorName: "Autor desconhecido"
                }));
            }
        }
    } catch (err) {
        console.error("Exceção ao processar autores de histórias:", err);
        storiesWithAuthorInfo = stories.map(story => ({
            ...story,
            authorName: "Autor desconhecido"
        }));
    }
    let seriesData: any[] = [];
    let seriesWithAuthorInfo: any[] = [];
    try {
        const {
            data: seriesResult,
            count: seriesCount,
            error: seriesErrorResp,
        } = await supabase
            .from("series")
            .select(
                `id, title, description, created_at, genre, author_id`,
                { count: "exact" }
            )
            .ilike("genre", categoryName)
            .order("created_at", { ascending: false });
        seriesError = seriesErrorResp;
        if (seriesError) {
            console.error("Erro ao buscar séries:", seriesError);
        } else {
            seriesData = seriesResult || [];
        }
    } catch (err) {
        console.error("Exceção ao buscar séries:", err);
    }
    try {
        if (seriesData && seriesData.length > 0) {
            const authorIds = [...new Set(seriesData.map(serie => serie.author_id))].filter(Boolean);
            if (authorIds.length > 0) {
                try {
                    const { data: authorsData, error: authorsError } = await supabase
                        .from("profiles")
                        .select("id, username")
                        .in("id", authorIds);
                    if (authorsError) {
                        console.error("Erro ao buscar autores:", authorsError);
                    } else {
                        const authorMap: Record<string, string> = {};
                        authorsData?.forEach(author => {
                            authorMap[author.id] = author.username;
                        });
                        seriesWithAuthorInfo = seriesData.map(serie => ({
                            ...serie,
                            authorName: authorMap[serie.author_id] || "Autor desconhecido"
                        }));
                    }
                } catch (err) {
                    console.error("Erro ao processar autores de séries:", err);
                    seriesWithAuthorInfo = seriesData.map(serie => ({
                        ...serie,
                        authorName: "Autor desconhecido"
                    }));
                }
            } else {
                seriesWithAuthorInfo = seriesData.map(serie => ({
                    ...serie,
                    authorName: "Autor desconhecido"
                }));
            }
        }
    } catch (err) {
        console.error("Exceção ao processar autores de séries:", err);
        seriesWithAuthorInfo = seriesData.map(serie => ({
            ...serie,
            authorName: "Autor desconhecido"
        }));
    }
    let chaptersData: any[] = [];
    let seriesInfo: Record<string, { title: string; id: string }> = {};
    try {
        const seriesIds = seriesData?.map(serie => serie.id) || [];
        if (seriesIds.length > 0) {
            seriesData.forEach(serie => {
                seriesInfo[serie.id] = {
                    title: serie.title,
                    id: serie.id
                };
            });
            try {
                const MAX_BATCH_SIZE = 10;
                let allChaptersFromSeries: any[] = [];
                for (let i = 0; i < seriesIds.length; i += MAX_BATCH_SIZE) {
                    const batchSeriesIds = seriesIds.slice(i, i + MAX_BATCH_SIZE);
                    try {
                        const { data: chaptersFromSeriesBatch, error: chaptersError } = await supabase
                            .from("chapters")
                            .select(`id, title, content, created_at, series_id, author_id`)
                            .in("series_id", batchSeriesIds)
                            .order("created_at", { ascending: false });
                        if (chaptersError) {
                            console.error(`Erro ao buscar lote de capítulos (${i} a ${i + MAX_BATCH_SIZE}):`, JSON.stringify(chaptersError, null, 2));
                            console.error(`IDs da série no lote com erro:`, batchSeriesIds);
                        } else if (chaptersFromSeriesBatch) {
                            allChaptersFromSeries.push(...chaptersFromSeriesBatch);
                        }
                    } catch (batchErr) {
                        console.error(`Exceção ao buscar lote de capítulos (${i} a ${i + MAX_BATCH_SIZE}):`, batchErr);
                        console.error(`IDs da série no lote com exceção:`, batchSeriesIds);
                    }
                }
                if (allChaptersFromSeries.length > 0) {
                    const authorIds = [...new Set(allChaptersFromSeries.map(chapter => chapter.author_id))].filter(Boolean);
                    if (authorIds.length > 0) {
                        try {
                            const { data: chapterAuthorsData, error: authorsError } = await supabase
                                .from("profiles")
                                .select("id, username")
                                .in("id", authorIds);
                            if (authorsError) {
                                console.error("Erro ao buscar autores de capítulos:", authorsError);
                                chaptersData = allChaptersFromSeries.map(chapter => ({
                                    ...chapter,
                                    authorName: "Autor desconhecido"
                                }));
                            } else {
                                const chapterAuthors: Record<string, string> = {};
                                chapterAuthorsData?.forEach(author => {
                                    chapterAuthors[author.id] = author.username;
                                });
                                chaptersData = allChaptersFromSeries.map(chapter => ({
                                    ...chapter,
                                    authorName: chapterAuthors[chapter.author_id] || "Autor desconhecido"
                                }));
                            }
                        } catch (authErr) {
                            console.error("Exceção ao buscar autores de capítulos:", authErr);
                            chaptersData = allChaptersFromSeries.map(chapter => ({
                                ...chapter,
                                authorName: "Autor desconhecido"
                            }));
                        }
                    } else {
                        chaptersData = allChaptersFromSeries.map(chapter => ({
                            ...chapter,
                            authorName: "Autor desconhecido"
                        }));
                    }
                }
            } catch (err) {
                console.error("Exceção geral ao processar capítulos:", err);
            }
        }
    } catch (err) {
        console.error("Exceção crítica ao processar capítulos:", err);
    }
    const createSummary = (htmlContent: string, maxLength = 150): string => {
        if (!htmlContent) return "";
        const textContent = htmlContent.replace(/<[^>]*>/g, "");
        if (textContent.length <= maxLength) return textContent;
        let summary = textContent.substring(0, maxLength);
        summary = summary.substring(0, summary.lastIndexOf(" "));
        return `${summary}...`;
    };
    const allResults = [
        ...(storiesWithAuthorInfo || []).map(story => ({
            ...story,
            type: 'story',
            content: story.content,
            authorName: story.authorName
        })),
        ...(seriesWithAuthorInfo || []).map(serie => ({
            ...serie,
            type: 'series',
            content: serie.description,
            authorName: serie.authorName
        })),
        ...(chaptersData || []).map(chapter => ({
            ...chapter,
            type: 'chapter',
            content: chapter.content,
            authorName: chapter.authorName,
            seriesTitle: seriesInfo[chapter.series_id]?.title || "Série Desconhecida",
            seriesId: chapter.series_id
        }))
    ].filter(Boolean);
    allResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const paginatedResults = allResults.slice(from, to + 1);
    const totalCount = allResults.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    if (allResults.length === 0 && !storiesError && !seriesError) {
        return (
            <div className="max-w-[75rem] mx-auto py-[1.875rem] sm:px-0 px-4">
                <h1 className="text-3xl font-bold text-black mb-[1.875rem]">Histórias de {categoryName}</h1>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-lg text-gray-600 mb-4">Ainda não há histórias nesta categoria.</p>
                    <Link 
                        href="/dashboard/new" 
                        className="inline-block h-10 px-6 bg-[#484DB5] text-white font-medium rounded-md hover:bg-opacity-90 transition-all duration-300 ease-in-out flex items-center justify-center"
                    >
                        Seja o primeiro a publicar
                    </Link>
                </div>
                <div className="mt-8 text-center">
                    <Link 
                        href="/categories" 
                        className="inline-block h-10 px-6 border border-[#E5E7EB] bg-white text-[#484DB5] font-medium rounded-md hover:shadow-md transition-all duration-300 ease-in-out flex items-center justify-center"
                    >
                        Ver todas as categorias
                    </Link>
                </div>
            </div>
        );
    }
    return (
        <div className="max-w-[75rem] mx-auto py-[1.875rem] sm:px-0 px-4">
            <h1 className="text-3xl font-bold text-black mb-[1.875rem]">Histórias de {categoryName}</h1>
            {allResults.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-lg text-gray-600 mb-4">Ainda não há histórias nesta categoria.</p>
                    <Link 
                        href="/dashboard/new" 
                        className="inline-block h-10 px-6 bg-[#484DB5] text-white font-medium rounded-md hover:bg-opacity-90 transition-all duration-300 ease-in-out flex items-center justify-center"
                    >
                        Seja o primeiro a publicar
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {paginatedResults.map((item) => (
                            <Link
                                href={item.type === 'story' 
                                    ? `/story/${generateSlug(item.title, item.id)}`
                                    : item.type === 'series'
                                    ? `/series/${generateSlug(item.title, item.id)}`
                                    : `/chapter/${item.id}`
                                }
                                key={`${item.type}-${item.id}`}
                                className="block p-4 bg-white border border-[#E5E7EB] rounded-md shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 relative overflow-hidden group"
                            >
                                <div className="flex flex-col">
                                    {item.type === 'chapter' && (
                                        <div className="mb-1">
                                            <span className="text-sm font-medium text-[#484DB5]">
                                                Capítulo da série: {item.seriesTitle}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-[#484DB5] transition-colors duration-300">
                                            {item.title}
                                        </h3>
                                        <span className="text-xs font-medium text-white px-2 py-0.5 rounded-full bg-[#484DB5] bg-opacity-80">
                                            {item.type === 'story' ? 'Conto' : item.type === 'series' ? 'Série' : 'Capítulo'}
                                        </span>
                                    </div>
                                </div>
                                {item.content && (
                                    <p className="text-gray-600 mb-3 line-clamp-2 mt-2">
                                        {createSummary(item.content)}
                                    </p>
                                )}
                                <div className="flex items-center justify-between mt-2 text-sm">
                                    <p className="text-[#484DB5] font-medium">
                                        por {item.authorName}
                                    </p>
                                    <p className="text-gray-500">
                                        {new Date(item.created_at).toLocaleDateString("pt-BR")}
                                    </p>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left -z-10"></div>
                            </Link>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="mt-8">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                baseUrl={`/categories/${params.category}`}
                            />
                        </div>
                    )}
                </>
            )}
            <div className="mt-8 text-center">
                <Link 
                    href="/categories" 
                    className="inline-block h-10 px-6 border border-[#E5E7EB] bg-white text-[#484DB5] font-medium rounded-md hover:shadow-md transition-all duration-300 ease-in-out flex items-center justify-center"
                >
                    Ver todas as categorias
                </Link>
            </div>
        </div>
    );
}
