import Link from "next/link";
import Comments from "@/components/Comments";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import StoryContent from "@/components/StoryContent";
import { ArrowLeft, ArrowRight, BookOpen, ListOrdered } from "lucide-react";
import Script from "next/script";
import { extractIdFromSlug, generateSlug } from "@/lib/utils";

export async function generateMetadata({ params }) {
    // Buscar informações do capítulo para o título da página
    const slug = params.id;
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
    const slug = params.id;
    const id = extractIdFromSlug(slug) || slug;
    
    console.log("----- DIAGNÓSTICO DE CAPÍTULO -----");
    console.log("Slug recebido da URL:", slug);
    console.log("ID extraído para consulta:", id);
    console.log("Tipo do ID:", typeof id);

    const supabase = await createServerSupabaseClient();
    
    // Obter a sessão do usuário
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Buscar dados do capítulo atual
    const { data: chapter, error } = await supabase
        .from("chapters")
        .select("id, title, content, chapter_number, series_id, author_id, created_at")
        .eq("id", id)
        .single();

    if (error) {
        console.error(`Erro ao buscar capítulo com ID '${id}':`, error?.message);
        return (
            <div className="content-wrapper">
                <div className="message-banner error">
                    Capítulo não encontrado.
                </div>
                <div className="text-center mt-4">
                    <Link href="/series" className="btn primary">
                        Voltar para séries
                    </Link>
                </div>
            </div>
        );
    }
    
    if (!chapter) {
        console.error(`Capítulo não encontrado para o ID: '${id}'`);
        return (
            <div className="content-wrapper">
                <div className="message-banner error">
                    Capítulo não encontrado.
                </div>
                <div className="text-center mt-4">
                    <Link href="/series" className="btn primary">
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
        .select("title, id, cover_url")
        .eq("id", chapter.series_id)
        .single();
        
    // Obter dados do autor separadamente
    const { data: author } = await supabase
        .from("profiles")
        .select("username")
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

    // Formatar data para exibição
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    };

    return (
        <div className="chapter-page">
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
            
            <div className="chapter-navbar">
                <Link href={`/series/${generateSlug(series.title, chapter.series_id)}`} className="chapter-series-link">
                    <ArrowLeft size={16} />
                    <span>{series.title}</span>
                </Link>
                
                <div className="chapter-nav-controls">
                    {prevChapter ? (
                        <Link
                            href={`/chapter/${generateSlug(prevChapter.title, prevChapter.id)}`}
                            className="chapter-nav-link prev"
                            title={`Capítulo ${prevChapter.chapter_number}: ${prevChapter.title}`}
                        >
                            <ArrowLeft size={16} />
                            <span>Cap. {prevChapter.chapter_number}</span>
                        </Link>
                    ) : (
                        <span className="chapter-nav-link disabled">
                            <ArrowLeft size={16} />
                            <span>Primeiro</span>
                        </span>
                    )}
                    
                    <Link
                        href={`/series/${generateSlug(series.title, chapter.series_id)}`}
                        className="chapter-nav-link"
                        title="Ver todos os capítulos"
                    >
                        <ListOrdered size={16} />
                        <span>Índice</span>
                    </Link>
                    
                    {nextChapter ? (
                        <Link
                            href={`/chapter/${generateSlug(nextChapter.title, nextChapter.id)}`}
                            className="chapter-nav-link next"
                            title={`Capítulo ${nextChapter.chapter_number}: ${nextChapter.title}`}
                        >
                            <span>Cap. {nextChapter.chapter_number}</span>
                            <ArrowRight size={16} />
                        </Link>
                    ) : (
                        <span className="chapter-nav-link disabled">
                            <span>Último</span>
                            <ArrowRight size={16} />
                        </span>
                    )}
                </div>
            </div>
            
            <div className="chapter-container">
                <div className="chapter-header">
                    <h1 className="chapter-title">
                        Capítulo {chapter.chapter_number}: {chapter.title}
                    </h1>
                    <div className="chapter-meta">
                        <span className="chapter-author">Por {author.username}</span>
                        <span className="chapter-date">{formatDate(chapter.created_at)}</span>
                    </div>
                </div>

                <div className="chapter-content">
                    <StoryContent content={chapter.content} />
                </div>

                <div className="chapter-navigation-bottom">
                    {prevChapter && (
                        <Link
                            href={`/chapter/${generateSlug(prevChapter.title, prevChapter.id)}`}
                            className="chapter-nav-button prev"
                        >
                            <ArrowLeft size={16} />
                            <span>Capítulo {prevChapter.chapter_number}: {prevChapter.title}</span>
                        </Link>
                    )}

                    {nextChapter && (
                        <Link
                            href={`/chapter/${generateSlug(nextChapter.title, nextChapter.id)}`}
                            className="chapter-nav-button next"
                        >
                            <span>Capítulo {nextChapter.chapter_number}: {nextChapter.title}</span>
                            <ArrowRight size={16} />
                        </Link>
                    )}
                </div>

                <Link href={`/series/${generateSlug(series.title, chapter.series_id)}`} className="view-all-chapters">
                    <ListOrdered size={16} />
                    <span>Ver todos os capítulos</span>
                </Link>

                <div className="chapter-comments">
                    <h3 className="comments-title">Comentários</h3>
                    <Comments contentId={id} contentType="chapter" userId={userId} />
                </div>
            </div>
        </div>
    );
}