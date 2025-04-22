import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import ContentViewer from "@/components/content-viewer";
import Script from "next/script";
import { extractIdFromSlug, generateSlug } from "@/lib/utils";

export async function generateMetadata({ params }) {
    // Corrigido: Await params
    const resolvedParams = await Promise.resolve(params);
    const slug = resolvedParams.id;
    const id = extractIdFromSlug(slug) || slug;
    
    try {
        const supabase = await createServerSupabaseClient();
        const { data: chapter } = await supabase
            .from("chapters")
            .select("title, series_id, series(title)")
            .eq("id", id)
            .single();

        if (chapter) {
            return {
                title: `${chapter.title} | ${chapter.series.title} - Casa dos Escritores`,
                description: `Leia o capítulo "${chapter.title}" da série "${chapter.series.title}" na Casa dos Escritores`,
            };
        }
    } catch (error) {
        console.error("Erro ao buscar dados para metadata:", error);
    }

    return {
        title: "Leitura de Capítulo - Casa dos Escritores",
    };
}

export default async function ChapterPage({ params }) {
    // Corrigido: Await params
    const resolvedParams = await Promise.resolve(params);
    const slug = resolvedParams.id;
    const id = extractIdFromSlug(slug) || slug;
    
    console.log("----- DIAGNÓSTICO DE CAPÍTULO -----");
    console.log("Slug recebido da URL:", slug);
    console.log("ID extraído para consulta:", id);
    console.log("Tipo do ID:", typeof id);

    const supabase = await createServerSupabaseClient();
    
    // Corrigido: Usar getUser() para obter usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id; // Obter userId do usuário autenticado

    // Buscar dados do capítulo atual
    const { data: chapter, error } = await supabase
        .from("chapters")
        .select("id, title, content, chapter_number, series_id, author_id, created_at, view_count")
        .eq("id", id)
        .single();

    if (error || !chapter) {
        console.error(`Erro ao buscar capítulo com ID '${id}':`, error?.message);
        return (
            <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4">
                    Capítulo não encontrado.
                </div>
                <div className="text-center mt-4">
                    <Link href="/series" className="inline-flex items-center justify-center h-10 px-4 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-all duration-300 hover:-translate-y-1">
                        Voltar para séries
                    </Link>
                </div>
            </div>
        );
    }
    
    console.log("Capítulo encontrado com sucesso:", chapter.id, chapter.title);

    // Obter dados da série separadamente
    const { data: series } = await supabase
        .from("series")
        .select("title, id, cover_url, genre")
        .eq("id", chapter.series_id)
        .single();

    // Obter dados do autor separadamente
    const { data: author } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio")
        .eq("id", chapter.author_id)
        .single();

    // Buscar navegação para capítulos anterior e próximo
    const { data: siblings } = await supabase
        .from("chapters")
        .select("id, chapter_number, title")
        .eq("series_id", chapter.series_id)
        .order("chapter_number", { ascending: true });

    let prevChapter = null;
    let nextChapter = null;

    if (siblings) {
        const currentIndex = siblings.findIndex(
            (ch) => ch.id === chapter.id
        );

        if (currentIndex > 0) {
            prevChapter = siblings[currentIndex - 1];
        }

        if (currentIndex < siblings.length - 1) {
            nextChapter = siblings[currentIndex + 1];
        }
    }

    // Buscar outros capítulos da mesma série
    const { data: otherChapters } = await supabase
        .from("chapters")
        .select("id, title, chapter_number, created_at")
        .eq("series_id", chapter.series_id)
        .neq("id", id)
        .order("chapter_number", { ascending: true })
        .limit(5);

    return (
        <div className="max-w-[75rem] mx-auto">
            {/* Script para incrementar a contagem de visualização do lado do cliente */}
            <Script id="increment-view">{`
                (async function() {
                    try {
                        await fetch('/api/chapters/view?id=${id}', {
                            method: 'POST',
                            cache: 'no-store'
                        });
                    } catch (error) {
                        console.error('Erro ao registrar visualização:', error);
                    }
                })();
            `}</Script>
            
            <ContentViewer
                id={chapter.id}
                title={chapter.title}
                content={chapter.content}
                createdAt={chapter.created_at}
                author={author}
                viewCount={chapter.view_count || 0}
                relatedItems={otherChapters}
                userId={userId}
                contentType="chapter"
                chapterNumber={chapter.chapter_number}
                seriesId={series?.id}
                seriesTitle={series?.title || "Série desconhecida"}
                category={series?.genre}
                prevChapter={prevChapter}
                nextChapter={nextChapter}
            />
        </div>
    );
}