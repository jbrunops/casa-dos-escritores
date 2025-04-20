import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Pagination from "@/components/Pagination";
import { Metadata } from "next";
import { SupabaseClient } from "@supabase/supabase-js";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from 'next/image'; // Import Image component

const PAGE_SIZE = 9; // Number of items per page

// --- Interfaces ---
interface BaseContent {
    id: string;
    title: string | null;
    created_at: string;
    author_id: string;
}

interface Story extends BaseContent {
    content: string | null;
    category: string | null;
}

interface Series extends BaseContent {
    description: string | null;
    genre: string | null; // Assuming genre maps to category for series
    cover_url?: string | null;
}

interface Chapter extends BaseContent {
    content: string | null;
    series_id: string;
    chapter_number: number;
}

interface Profile {
    id: string;
    username: string;
    avatar_url?: string;
}

interface CombinedContent {
    id: string;
    type: "story" | "series" | "chapter";
    title: string;
    summary: string; // Generated summary
    authorName: string;
    authorAvatar?: string | null;
    authorId: string;
    createdAt: Date;
    category: string;
    seriesId?: string; // For chapters
    seriesTitle?: string; // For chapters
    chapterNumber?: number; // For chapters
    coverUrl?: string | null; // For series
    link: string;
}

interface PageProps {
    params: { category: string };
    searchParams: { page?: string };
}

// --- Metadata Function ---
export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
    const categoryName = decodeCategorySlug(params.category);
    return {
        title: `Histórias de ${categoryName} - Casa dos Escritores`,
        description: `Explore histórias, séries e capítulos na categoria ${categoryName} na Casa dos Escritores.`,
    };
}

// --- Helper Functions ---
const decodeCategorySlug = (slug: string): string => {
    try {
        return decodeURIComponent(slug)
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    } catch (e) {
        console.error("Error decoding category slug:", e);
        return slug; // Fallback to raw slug
    }
};

// Function to create summary from HTML content (simplified)
const createSummary = (htmlContent: string | null, maxLength = 100): string => {
    if (!htmlContent) return "";
    // Basic stripping of HTML tags (consider a more robust library for complex HTML)
    const textContent = htmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, ' ').trim();
    return textContent.length > maxLength
        ? textContent.substring(0, maxLength) + "..."
        : textContent;
};

const formatRelativeDate = (date: Date): string => {
    try {
        return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch {
        return "";
    }
};

// --- Data Fetching Function ---
async function fetchCategoryContent(supabase: SupabaseClient, categoryName: string, page: number): Promise<{ content: CombinedContent[], totalCount: number, error: string | null }> {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let combinedContent: CombinedContent[] = [];
    let totalCount = 0;
    let fetchError: string | null = null;

    try {
        // Fetch published stories matching the category with pagination
        const { data: storiesData, count: storiesCount, error: storiesError } = await supabase
            .from("stories")
            .select("*, profiles(id, username, avatar_url)", { count: "exact" })
            .eq("is_published", true)
            .ilike("category", categoryName)
            .order("created_at", { ascending: false })
            .range(from, to);

        if (storiesError) throw new Error(`Stories fetch failed: ${storiesError.message}`);
        totalCount = storiesCount || 0;

        const stories = (storiesData as any[] || []) as (Story & { profiles: Profile | null })[];

        // Fetch series matching the genre (category)
        const { data: seriesData, error: seriesError } = await supabase
            .from("series")
            .select("*, profiles(id, username, avatar_url)")
            .ilike("genre", categoryName)
            .order("created_at", { ascending: false }); // No pagination for series on this page?

        if (seriesError) throw new Error(`Series fetch failed: ${seriesError.message}`);
        const series = (seriesData as any[] || []) as (Series & { profiles: Profile | null })[];

        // Fetch latest chapters from series in this category
        const seriesIds = series.map(s => s.id);
        let chapters: (Chapter & { profiles: Profile | null, series: { title: string | null } | null })[] = [];
        if (seriesIds.length > 0) {
             const { data: chaptersData, error: chaptersError } = await supabase
                .from("chapters")
                .select("*, profiles(id, username, avatar_url), series(title)")
                .in("series_id", seriesIds)
                .order("created_at", { ascending: false })
                .limit(PAGE_SIZE); // Limit chapter results too?

            if (chaptersError) throw new Error(`Chapters fetch failed: ${chaptersError.message}`);
             chapters = (chaptersData as any[] || []) as (Chapter & { profiles: Profile | null, series: { title: string | null } | null })[];
        }


        // Combine and format data
        combinedContent = [
            ...stories.map(story => ({
                id: story.id,
                type: "story" as const,
                title: story.title || "História sem título",
                summary: createSummary(story.content),
                authorName: story.profiles?.username || "Desconhecido",
                authorAvatar: story.profiles?.avatar_url,
                authorId: story.author_id,
                createdAt: new Date(story.created_at),
                category: story.category || categoryName,
                link: `/story/${story.id}`,
            })),
            ...series.map(s => ({
                id: s.id,
                type: "series" as const,
                title: s.title || "Série sem título",
                summary: createSummary(s.description, 150), // Longer summary for series
                authorName: s.profiles?.username || "Desconhecido",
                authorAvatar: s.profiles?.avatar_url,
                authorId: s.author_id,
                createdAt: new Date(s.created_at),
                category: s.genre || categoryName,
                coverUrl: s.cover_url,
                link: `/obra/${s.id}`,
            })),
             ...chapters.map(ch => ({
                id: ch.id,
                type: "chapter" as const,
                title: ch.title || "Capítulo sem título",
                summary: createSummary(ch.content),
                authorName: ch.profiles?.username || "Desconhecido",
                authorAvatar: ch.profiles?.avatar_url,
                authorId: ch.author_id,
                createdAt: new Date(ch.created_at),
                category: categoryName, // Chapter inherits category from context
                seriesId: ch.series_id,
                seriesTitle: ch.series?.title || undefined,
                chapterNumber: ch.chapter_number,
                link: `/ler/${ch.series_id}/${ch.id}`,
            })),
        ];

        // Sort combined content by creation date (most recent first)
        combinedContent.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    } catch (error: any) {
        console.error("Error fetching category content:", error);
        fetchError = error.message || "Ocorreu um erro ao buscar o conteúdo.";
        // totalCount remains 0 if initial story fetch failed
    }

    // Apply pagination only to the combined list if needed, or keep story pagination?
    // Current implementation paginates *only stories*. Series/Chapters are added on top.
    // This might be confusing. A better approach might be to paginate the combined list.
    // For now, returning combined list but totalCount is based on stories only.

    return { content: combinedContent, totalCount, error: fetchError };
}

// --- Page Component ---
export default async function CategoryPage({ params, searchParams }: PageProps) {
    const supabase = createServerSupabaseClient();
    const page = searchParams.page ? parseInt(searchParams.page) : 1;
    const categoryName = decodeCategorySlug(params.category);

    const { content: combinedContent, totalCount, error } = await fetchCategoryContent(supabase, categoryName, page);

    if (error && combinedContent.length === 0) {
        // If there's a fetch error and no content at all, show error message
        // (Could refine this logic, e.g., show error even if some old cached data exists?)
        return (
            <div className="max-w-[75rem] mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold mb-6">{categoryName}</h1>
                <p className="text-red-600 bg-red-50 p-4 rounded-md">Erro ao carregar conteúdo: {error}</p>
            </div>
        );
    }

    if (combinedContent.length === 0) {
        // If no error, but no content found for this category
         return (
            <div className="max-w-[75rem] mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold mb-6">{categoryName}</h1>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-md">Nenhuma publicação encontrada nesta categoria.</p>
            </div>
        );
        // Or potentially trigger notFound() if category itself is invalid?
        // Need logic to check if categoryName is valid based on a predefined list or DB check.
        // notFound();
    }

    return (
        <div className="max-w-[75rem] mx-auto py-[1.875rem] sm:px-0 px-4">
            <h1 className="text-3xl font-bold text-black mb-[1.875rem]">{categoryName}</h1>

            {error && <p className="text-yellow-600 bg-yellow-50 p-3 rounded-md mb-4">Aviso: {error}</p>} 

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1.875rem]">
                {combinedContent.map((item) => (
                    <Link href={item.link} key={`${item.type}-${item.id}`} className="block group">
                        <div className="bg-white rounded-lg shadow-sm border border-border h-full flex flex-col transition-shadow duration-300 hover:shadow-md overflow-hidden">
                            {item.type === 'series' && item.coverUrl && (
                                <div className="relative w-full h-40">
                                    <Image
                                        src={item.coverUrl}
                                        alt={`Capa de ${item.title}`}
                                        layout="fill"
                                        objectFit="cover"
                                        className="transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                            )}
                            <div className="p-4 flex flex-col flex-grow">
                                <span className="text-xs font-medium uppercase tracking-wider mb-1 px-2 py-0.5 rounded-full inline-block self-start bg-opacity-10"
                                    style={{ backgroundColor: item.type === 'story' ? 'rgba(72, 77, 181, 0.1)' : item.type === 'series' ? 'rgba(52, 142, 86, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                                             color: item.type === 'story' ? '#484DB5' : item.type === 'series' ? '#348E56' : '#D97706' }}>
                                    {item.type === 'story' ? 'História' : item.type === 'series' ? 'Série' : 'Capítulo'}
                                </span>
                                <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-1 group-hover:text-[#484DB5] transition-colors duration-300 line-clamp-2">
                                    {item.title}
                                </h2>
                                {item.type === 'chapter' && item.seriesTitle && (
                                     <p className="text-xs text-gray-500 mb-2">de: <span className="font-medium">{item.seriesTitle}</span></p>
                                )}
                                <p className="text-sm text-gray-600 mb-3 flex-grow line-clamp-3">
                                    {item.summary}
                                </p>
                                <div className="mt-auto border-t border-gray-100 pt-3">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center space-x-1.5">
                                            <Image
                                                src={item.authorAvatar || '/default-avatar.png'} // Fallback avatar
                                                alt={`Avatar de ${item.authorName}`}
                                                width={20}
                                                height={20}
                                                className="rounded-full"
                                            />
                                            <span>{item.authorName}</span>
                                        </div>
                                        <span>{formatRelativeDate(item.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Pagination - applies only based on story count for now */}
            {totalCount > PAGE_SIZE && (
                <div className="mt-8">
                    <Pagination
                        currentPage={page}
                        totalItems={totalCount}
                        itemsPerPage={PAGE_SIZE}
                        baseUrl={`/categories/${params.category}`}
                    />
                </div>
            )}
        </div>
    );
} 