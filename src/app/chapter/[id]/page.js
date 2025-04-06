import Link from "next/link";
import Comments from "@/components/Comments";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import StoryContent from "@/components/StoryContent";
import { ArrowLeft, ArrowRight, BookOpen, ListOrdered, User, Calendar } from "lucide-react";
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
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4">
                    Capítulo não encontrado.
                </div>
                <div className="text-center mt-4">
                    <Link href="/series" className="inline-flex items-center px-4 py-2 bg-[#484DB5] text-white rounded-md hover:bg-[#3a3e9f] transition-colors">
                        Voltar para séries
                    </Link>
                </div>
            </div>
        );
    }
    
    if (!chapter) {
        console.error(`Capítulo não encontrado para o ID: '${id}'`);
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4">
                    Capítulo não encontrado.
                </div>
                <div className="text-center mt-4">
                    <Link href="/series" className="inline-flex items-center px-4 py-2 bg-[#484DB5] text-white rounded-md hover:bg-[#3a3e9f] transition-colors">
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
        <div className="container mx-auto px-4 py-4 md:py-8">
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
            
            <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] mb-6">
                {/* Barra de navegação superior */}
                <div className="flex justify-between items-center p-3 border-b border-[#E5E7EB] bg-gray-50">
                    <Link 
                        href={`/series/${generateSlug(series.title, chapter.series_id)}`} 
                        className="flex items-center text-gray-600 hover:text-[#484DB5] transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-1" />
                        <span className="font-medium">Voltar para a série</span>
                    </Link>
                    
                    <div className="flex items-center space-x-2">
                        {prevChapter ? (
                            <Link
                                href={`/chapter/${generateSlug(prevChapter.title, prevChapter.id)}`}
                                className="flex items-center px-2 py-1 text-sm text-gray-600 hover:text-[#484DB5] transition-colors"
                                title={`Capítulo ${prevChapter.chapter_number}: ${prevChapter.title}`}
                            >
                                <ArrowLeft size={14} className="mr-1" />
                                <span>Cap. {prevChapter.chapter_number}</span>
                            </Link>
                        ) : (
                            <span className="flex items-center px-2 py-1 text-sm text-gray-400 cursor-not-allowed">
                                <ArrowLeft size={14} className="mr-1" />
                                <span>Primeiro</span>
                            </span>
                        )}
                        
                        <Link
                            href={`/series/${generateSlug(series.title, chapter.series_id)}`}
                            className="flex items-center px-2 py-1 text-sm text-gray-600 hover:text-[#484DB5] transition-colors"
                            title="Ver todos os capítulos"
                        >
                            <ListOrdered size={14} className="mr-1" />
                            <span>Índice</span>
                        </Link>
                        
                        {nextChapter ? (
                            <Link
                                href={`/chapter/${generateSlug(nextChapter.title, nextChapter.id)}`}
                                className="flex items-center px-2 py-1 text-sm text-gray-600 hover:text-[#484DB5] transition-colors"
                                title={`Capítulo ${nextChapter.chapter_number}: ${nextChapter.title}`}
                            >
                                <span>Cap. {nextChapter.chapter_number}</span>
                                <ArrowRight size={14} className="ml-1" />
                            </Link>
                        ) : (
                            <span className="flex items-center px-2 py-1 text-sm text-gray-400 cursor-not-allowed">
                                <span>Último</span>
                                <ArrowRight size={14} className="ml-1" />
                            </span>
                        )}
                    </div>
                </div>
                
                {/* Cabeçalho do capítulo */}
                <div className="p-6 border-b border-[#E5E7EB]">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                        Capítulo {chapter.chapter_number}: {chapter.title}
                    </h1>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                            <User size={16} className="mr-1" />
                            Por {author.username}
                        </span>
                        <span className="flex items-center">
                            <Calendar size={16} className="mr-1" />
                            {formatDate(chapter.created_at)}
                        </span>
                    </div>
                </div>

                {/* Conteúdo do capítulo */}
                <div className="p-6 md:p-8 prose prose-lg max-w-none">
                    <StoryContent content={chapter.content} />
                </div>

                {/* Navegação inferior */}
                <div className="px-6 py-4 border-t border-[#E5E7EB] flex flex-col md:flex-row gap-4 justify-between">
                    <div className="w-full md:w-auto">
                        {prevChapter && (
                            <Link
                                href={`/chapter/${generateSlug(prevChapter.title, prevChapter.id)}`}
                                className="w-full md:w-auto inline-flex items-center px-4 py-2 bg-white border border-[#E5E7EB] text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft size={16} className="mr-2" />
                                <span className="truncate">Capítulo {prevChapter.chapter_number}: {prevChapter.title}</span>
                            </Link>
                        )}
                    </div>

                    <div className="w-full md:w-auto text-right">
                        {nextChapter && (
                            <Link
                                href={`/chapter/${generateSlug(nextChapter.title, nextChapter.id)}`}
                                className="w-full md:w-auto inline-flex items-center justify-center md:justify-start px-4 py-2 bg-[#484DB5] text-white rounded-md hover:bg-[#3a3e9f] transition-colors"
                            >
                                <span className="truncate">Capítulo {nextChapter.chapter_number}: {nextChapter.title}</span>
                                <ArrowRight size={16} className="ml-2" />
                            </Link>
                        )}
                    </div>
                </div>
                
                <div className="px-6 py-4 text-center border-t border-[#E5E7EB] bg-gray-50">
                    <Link 
                        href={`/series/${generateSlug(series.title, chapter.series_id)}`} 
                        className="inline-flex items-center text-[#484DB5] hover:text-[#3a3e9f] transition-colors"
                    >
                        <ListOrdered size={16} className="mr-2" />
                        <span>Ver todos os capítulos</span>
                    </Link>
                </div>
            </div>

            {/* Comentários */}
            <div className="mb-8">
                <Comments contentId={id} contentType="chapter" userId={userId} />
            </div>
        </div>
    );
}