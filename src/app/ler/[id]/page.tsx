import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { extractIdFromSlug } from "@/lib/utils";
import ContentViewer, { AuthorProfile, SeriesInfo, NavigationInfo } from "@/components/ContentViewer"; // Import types
import { notFound } from 'next/navigation';
import { Metadata } from "next";
import { SupabaseClient } from "@supabase/supabase-js";

// --- Interfaces for DB data ---
interface ChapterDB {
    id: string;
    title: string | null;
    content: string | null;
    chapter_number: number;
    created_at: string;
    series_id: string;
    author_id: string;
    series?: { id: string; title: string | null } | null;
}

interface StoryDB {
    id: string;
    title: string | null;
    content: string | null;
    created_at: string;
    author_id: string;
    profiles?: { id: string; username: string; avatar_url: string | null } | null;
}

interface SiblingChapter {
    id: string;
    chapter_number: number;
    title: string | null;
}

// --- Metadata Generation ---
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    let contentId: string;
    let supabase: SupabaseClient;
    try {
        const slug = params.id;
        contentId = extractIdFromSlug(slug) || slug;
        supabase = createServerSupabaseClient();

        // Try fetching as Chapter first
        type ChapterMeta = { title: string | null; series: { title: string | null } | null };
        const { data: chapter, error: chapterError } = await supabase
            .from("chapters")
            .select("title, series(title)")
            .eq("id", contentId)
            .maybeSingle<ChapterMeta>(); // Use maybeSingle e o tipo definido

        if (chapter && !chapterError) {
            return {
                title: `${chapter.title || 'Capítulo'} | ${chapter.series?.title || 'Série'} - Casa dos Escritores`,
                // Add description, open graph tags, etc.
            };
        }

        // If not a chapter, try fetching as Story
        type StoryMeta = { title: string | null };
        const { data: story, error: storyError } = await supabase
            .from("stories")
            .select("title")
            .eq("id", contentId)
            .maybeSingle<StoryMeta>();

        if (story && !storyError) {
            return {
                title: `${story.title || 'História'} - Casa dos Escritores`,
                // Add description, open graph tags, etc.
            };
        }

        console.warn(`Metadata: Content not found for ID '${contentId}'`);
        return { title: "Conteúdo não encontrado - Casa dos Escritores" };

    } catch (error: any) {
        console.error("Error generating metadata for content:", { error: error.message, contentId });
        return { title: "Conteúdo - Casa dos Escritores" };
    }
}

// --- Page Component ---
export default async function ReaderPage({ params }: { params: { id: string } }) {
    let contentId: string;
    let supabase: SupabaseClient;

    try {
        const slug = params.id;
        contentId = extractIdFromSlug(slug) || slug;
        supabase = createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        // --- 1. Attempt to fetch as Chapter --- 
        const { data: chapter, error: chapterError } = await supabase
            .from("chapters")
            .select('*, author_id, series(id, title)') // Fetch series relationship
            .eq("id", contentId)
            .maybeSingle<ChapterDB>();

        if (chapterError) {
            console.warn(`Error checking for chapter (ID: ${contentId}):`, chapterError.message);
            // Don't throw yet, could be a story
        }

        if (chapter) {
             console.log("Found chapter:", chapter.id);
            // Chapter found, now fetch author and navigation
            const authorProfile = await fetchAuthorProfile(supabase, chapter.author_id);
            const navigation = await fetchChapterNavigation(supabase, chapter.series_id, chapter.id);

            return (
                <ContentViewer
                    contentType="chapter"
                    contentId={chapter.id}
                    title={chapter.title}
                    content={chapter.content}
                    authorProfile={authorProfile} // Fetched separately
                    createdAt={chapter.created_at}
                    seriesInfo={chapter.series ?? undefined} // Pass series info
                    chapterNumber={chapter.chapter_number}
                    navigation={navigation}
                    userId={userId}
                />
            );
        }

        // --- 2. Attempt to fetch as Story --- 
        console.log(`Chapter not found or error. Attempting to fetch story (ID: ${contentId})...`);
        const { data: story, error: storyError } = await supabase
            .from("stories")
            .select('*, author_id, profiles(*)') // Join profiles
            .eq("id", contentId)
            .maybeSingle<StoryDB>();

        if (storyError) {
             console.error(`Error fetching story (ID: ${contentId}):`, storyError.message);
             // If we got here, chapter check likely failed or returned null
             notFound(); // Assume content doesn't exist if story fetch also fails
        }

        if (story) {
             console.log("Found story:", story.id);
            if (!story.profiles) {
                console.warn(`Story ${story.id} found, but author profile join failed. Fetching separately.`);
                 // Fallback: fetch profile separately if join failed (should ideally not happen)
                 const authorProfile = await fetchAuthorProfile(supabase, story.author_id);
                 return (
                    <ContentViewer
                        contentType="story"
                        contentId={story.id}
                        title={story.title}
                        content={story.content}
                        authorProfile={authorProfile} // Use separately fetched profile
                        createdAt={story.created_at}
                        userId={userId}
                    />
                );
            } else {
                 // Use profile from the join
                return (
                    <ContentViewer
                        contentType="story"
                        contentId={story.id}
                        title={story.title}
                        content={story.content}
                        authorProfile={story.profiles as AuthorProfile} // Cast joined profile
                        createdAt={story.created_at}
                        userId={userId}
                    />
                );
            }
        }

        // --- 3. Not Found --- 
        console.log(`Content not found (neither chapter nor story) for ID: ${contentId}`);
        notFound();

    } catch (error: any) {
        console.error(`General error in ReaderPage for ID '${contentId || params.id}':`, error.message);
        notFound();
    }
}

// --- Helper Data Fetching Functions ---
async function fetchAuthorProfile(supabase: SupabaseClient, authorId: string): Promise<AuthorProfile> {
    if (!authorId) {
        console.warn("Attempted to fetch profile with null/empty authorId");
        return { id: '', username: "Desconhecido", avatar_url: null }; // Return default/unknown profile
    }
    try {
        const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .eq("id", authorId)
            .single<AuthorProfile>();

        if (profileError || !profileData) {
            console.error(`Failed to fetch profile for author ${authorId}:`, profileError?.message);
            return { id: authorId, username: "Autor não encontrado", avatar_url: null }; // Indicate profile fetch failure
        }
        return profileData;
    } catch (err: any) {
         console.error(`Exception fetching profile for author ${authorId}:`, err.message);
         return { id: authorId, username: "Erro ao buscar autor", avatar_url: null };
    }
}

async function fetchChapterNavigation(supabase: SupabaseClient, seriesId: string, currentChapterId: string): Promise<NavigationInfo | null> {
     if (!seriesId) return null;
    try {
        const { data: siblings, error: siblingsError } = await supabase
            .from("chapters")
            .select("id, chapter_number, title")
            .eq("series_id", seriesId)
            .order("chapter_number", { ascending: true });

        if (siblingsError) {
            console.error(`Error fetching sibling chapters for series ${seriesId}:`, siblingsError.message);
            return null;
        }
        if (!siblings || siblings.length === 0) return null;

        const currentIndex = siblings.findIndex((ch) => ch.id === currentChapterId);
        if (currentIndex === -1) return null; // Current chapter not found in siblings?

        const prevChapter = currentIndex > 0 ? siblings[currentIndex - 1] : null;
        const nextChapter = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

        return {
            prevChapter: prevChapter as SiblingChapter | null,
            nextChapter: nextChapter as SiblingChapter | null,
        };
    } catch (err: any) {
         console.error(`Exception fetching navigation for series ${seriesId}:`, err.message);
        return null;
    }
} 