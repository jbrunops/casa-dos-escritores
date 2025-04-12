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
    
    if (!chapter) {
        console.error(`Capítulo não encontrado para o ID: '${id}'`);
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
        <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-6">
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
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border border-[#E5E7EB] p-4">
                <Link href={`/series/${generateSlug(series.title, chapter.series_id)}`} className="inline-flex items-center text-gray-700 hover:text-[#484DB5] transition-colors duration-200 mb-2 sm:mb-0">
                    <ArrowLeft size={16} className="mr-1" />
                    <span className="font-medium">{series.title}</span>
                </Link>
                
                <div className="flex items-center gap-2">
                    {prevChapter ? (
                        <Link
                            href={`/chapter/${generateSlug(prevChapter.title, prevChapter.id)}`}
                            className="inline-flex items-center h-10 px-3 border border-[#E5E7EB] rounded-md text-gray-700 hover:text-[#484DB5] hover:border-[#484DB5] transition-all duration-300 hover:-translate-y-1"
                            title={`Capítulo ${prevChapter.chapter_number}: ${prevChapter.title}`}
                        >
                            <ArrowLeft size={16} className="mr-1" />
                            <span>Cap. {prevChapter.chapter_number}</span>
                        </Link>
                    ) : (
                        <span className="inline-flex items-center h-10 px-3 border border-[#E5E7EB] rounded-md text-gray-400 bg-gray-50 cursor-not-allowed">
                            <ArrowLeft size={16} className="mr-1" />
                            <span>Primeiro</span>
                        </span>
                    )}
                    
                    <Link
                        href={`/series/${generateSlug(series.title, chapter.series_id)}`}
                        className="inline-flex items-center h-10 px-3 border border-[#E5E7EB] rounded-md text-gray-700 hover:text-[#484DB5] hover:border-[#484DB5] transition-all duration-300 hover:-translate-y-1"
                        title="Ver todos os capítulos"
                    >
                        <ListOrdered size={16} className="mr-1" />
                        <span>Índice</span>
                    </Link>
                    
                    {nextChapter ? (
                        <Link
                            href={`/chapter/${generateSlug(nextChapter.title, nextChapter.id)}`}
                            className="inline-flex items-center h-10 px-3 border border-[#E5E7EB] rounded-md text-gray-700 hover:text-[#484DB5] hover:border-[#484DB5] transition-all duration-300 hover:-translate-y-1"
                            title={`Capítulo ${nextChapter.chapter_number}: ${nextChapter.title}`}
                        >
                            <span>Cap. {nextChapter.chapter_number}</span>
                            <ArrowRight size={16} className="ml-1" />
                        </Link>
                    ) : (
                        <span className="inline-flex items-center h-10 px-3 border border-[#E5E7EB] rounded-md text-gray-400 bg-gray-50 cursor-not-allowed">
                            <span>Último</span>
                            <ArrowRight size={16} className="ml-1" />
                        </span>
                    )}
                </div>
            </div>
            
            <div className="border border-[#E5E7EB] mb-6">
                <div className="p-6 border-b border-[#E5E7EB]">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                        Capítulo {chapter.chapter_number}: {chapter.title}
                    </h1>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span className="inline-flex items-center">Por <Link href={`/profile/${encodeURIComponent(author.username)}`} className="ml-1 font-medium text-[#484DB5] hover:underline transition-all duration-200">{author.username}</Link></span>
                        <span className="inline-flex items-center">{formatDate(chapter.created_at)}</span>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    <StoryContent content={chapter.content} />
                </div>

                <div className="px-6 pb-6 flex flex-col sm:flex-row gap-4 justify-between">
                    {prevChapter && (
                        <Link
                            href={`/chapter/${generateSlug(prevChapter.title, prevChapter.id)}`}
                            className="inline-flex items-center justify-center h-10 px-4 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-all duration-300 hover:-translate-y-1"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            <span className="truncate max-w-[200px]">Capítulo {prevChapter.chapter_number}</span>
                        </Link>
                    )}

                    <Link 
                        href={`/series/${generateSlug(series.title, chapter.series_id)}`} 
                        className="inline-flex items-center justify-center h-10 px-4 border border-[#E5E7EB] text-gray-700 rounded-md hover:bg-gray-50 transition-all duration-300 hover:-translate-y-1"
                    >
                        <ListOrdered size={16} className="mr-2" />
                        <span>Ver todos os capítulos</span>
                    </Link>

                    {nextChapter && (
                        <Link
                            href={`/chapter/${generateSlug(nextChapter.title, nextChapter.id)}`}
                            className="inline-flex items-center justify-center h-10 px-4 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-all duration-300 hover:-translate-y-1"
                        >
                            <span className="truncate max-w-[200px]">Capítulo {nextChapter.chapter_number}</span>
                            <ArrowRight size={16} className="ml-2" />
                        </Link>
                    )}
                </div>

                <div className="p-6 border-t border-[#E5E7EB]">
                    <Comments contentId={id} contentType="chapter" userId={userId} />
                </div>
            </div>
        </div>
    );
}