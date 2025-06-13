// src/app/search/page.js
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { generateSlug } from "@/lib/utils";
import { ArrowLeft, Search } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { safeHighlightText, escapeHtml } from "@/lib/sanitize";

export const metadata = {
    title: "Resultados de pesquisa",
    description: "Pesquise histórias em nossa plataforma",
};

const PAGE_SIZE = 10;

// Função para criar um resumo seguro
const createSummary = (htmlContent, maxLength = 150) => {
    if (!htmlContent) return "";
    
    // Remover tags HTML básico (não usar regex complexo para evitar problemas)
    const textContent = htmlContent
        .replace(/<[^>]*>/g, " ") // Remove todas as tags
        .replace(/\s+/g, " ") // Normaliza espaços
        .trim();
    
    if (textContent.length <= maxLength) {
        return escapeHtml(textContent);
    }
    
    const summary = textContent.substring(0, maxLength);
    const lastSpaceIndex = summary.lastIndexOf(" ");
    const truncated = lastSpaceIndex > 0 ? summary.substring(0, lastSpaceIndex) : summary;
    
    return escapeHtml(`${truncated}...`);
};

// Formatar a data para o formato compacto
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

export default async function SearchPage({ searchParams }) {
    try {
        const query = searchParams.q || "";
        const page = parseInt(searchParams.page) || 1;
        const offset = (page - 1) * PAGE_SIZE;

        if (!query.trim()) {
            return notFound();
        }

        const supabase = createBrowserClient();

        // Buscar histórias com perfis
        const { data: stories, error: storiesError } = await supabase
            .from("stories")
            .select(`
                id,
                title,
                content,
                category,
                created_at,
                profiles!inner(username)
            `)
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .order("created_at", { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

        if (storiesError) {
            console.error("Erro ao buscar histórias:", storiesError);
        }

        // Buscar séries
        const { data: series, error: seriesError } = await supabase
            .from("series")
            .select("id, title, description, cover_url, created_at")
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .order("created_at", { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

        if (seriesError) {
            console.error("Erro ao buscar séries:", seriesError);
        }

        // Buscar capítulos
        const { data: chapters, error: chaptersError } = await supabase
            .from("chapters")
            .select("id, title, content, created_at")
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .order("created_at", { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

        if (chaptersError) {
            console.error("Erro ao buscar capítulos:", chaptersError);
        }

        // Buscar perfis/usuários
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, bio, avatar_url")
            .or(`username.ilike.%${query}%,bio.ilike.%${query}%`)
            .range(offset, offset + PAGE_SIZE - 1);

        if (profilesError) {
            console.error("Erro ao buscar perfis:", profilesError);
        }

        // Processar os resultados para destaque SEGURO
        const processedStories = (stories || []).map((story) => ({
            ...story,
            highlightedTitle: safeHighlightText(story.title, query),
            summary: safeHighlightText(createSummary(story.content), query),
        }));

        return (
            <div className="mx-auto max-w-[75rem] px-4 md:px-0 py-8">
                <div className="flex items-center mb-6">
                    <Link 
                        href="/"
                        className="mr-3 h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Resultados para &quot;{escapeHtml(query)}&quot;</h1>
                </div>

                <div className="text-sm text-gray-500 mb-6">
                    Encontrados {(stories?.length || 0) + (profiles?.length || 0) + (series?.length || 0) + (chapters?.length || 0)} resultados
                </div>

                {/* Resultados de séries */}
                {series && series.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Séries</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {series.map((serie) => (
                        <Link
                          href={`/series/${generateSlug(serie.title, serie.id)}`}
                          key={serie.id}
                          className="flex items-start p-4 bg-white rounded-lg border border-[#E5E7EB] hover:shadow-md transition-all duration-200"
                        >
                          {serie.cover_url ? (
                            <img
                              src={serie.cover_url}
                              alt={escapeHtml(serie.title)}
                              className="w-12 h-12 rounded-full object-cover mr-4"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[#484DB5] text-white flex items-center justify-center font-medium mr-4">
                              {serie.title.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">{escapeHtml(serie.title)}</h3>
                            {serie.description && (
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {escapeHtml(serie.description)}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resultados de capítulos */}
                {chapters && chapters.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Capítulos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {chapters.map((chapter) => (
                        <Link
                          href={`/chapter/${generateSlug(chapter.title, chapter.id)}`}
                          key={chapter.id}
                          className="flex flex-col p-4 bg-white rounded-lg border border-[#E5E7EB] hover:shadow-md transition-all duration-200"
                        >
                          <h3 className="font-medium text-gray-900">{escapeHtml(chapter.title)}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {createSummary(chapter.content)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resultados de perfis */}
                {profiles && profiles.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Escritores</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {profiles.map((profile) => (
                                <Link
                                    href={`/profile/${encodeURIComponent(profile.username)}`}
                                    key={profile.id}
                                    className="flex items-start p-4 bg-white rounded-lg border border-[#E5E7EB] hover:shadow-md transition-all duration-200"
                                >
                                    {profile.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt={escapeHtml(profile.username)}
                                            className="w-12 h-12 rounded-full object-cover mr-4"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-[#484DB5] text-white flex items-center justify-center font-medium mr-4">
                                            {profile.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-medium text-gray-900">{escapeHtml(profile.username)}</h3>
                                        {profile.bio && (
                                            <p className="text-sm text-gray-500 line-clamp-2">
                                                {escapeHtml(profile.bio)}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Resultados de histórias */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Histórias</h2>

                    {processedStories.length === 0 ? (
                        <div className="bg-white rounded-lg border border-[#E5E7EB] p-8 text-center">
                            <Search size={40} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 mb-2">
                                Nenhuma história encontrada para &quot;{escapeHtml(query)}&quot;.
                            </p>
                            <p className="text-gray-400 mb-6">
                                Tente outras palavras-chave ou categorias.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {processedStories.map((story) => (
                                <Link
                                    href={`/story/${generateSlug(story.title, story.id)}`}
                                    key={story.id}
                                    className="block bg-white rounded-lg border border-[#E5E7EB] p-4 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3
                                            className="text-lg font-medium text-gray-900"
                                            dangerouslySetInnerHTML={{
                                                __html: story.highlightedTitle,
                                            }}
                                        ></h3>
                                        {story.category && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                                {escapeHtml(story.category)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center text-sm text-gray-500 mb-3">
                                        <span className="mr-3">
                                            Por {escapeHtml(story.profiles.username)}
                                        </span>
                                        <span>
                                            {formatDate(story.created_at)}
                                        </span>
                                    </div>

                                    <p
                                        className="text-gray-600 line-clamp-2"
                                        dangerouslySetInnerHTML={{
                                            __html: story.summary,
                                        }}
                                    ></p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-4 mt-8">
                    <div className="flex gap-4">
                        {page > 1 && (
                            <Link
                                href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                            >
                                Página Anterior
                            </Link>
                        )}
                        {((stories?.length === PAGE_SIZE) || (series?.length === PAGE_SIZE) || (chapters?.length === PAGE_SIZE) || (profiles?.length === PAGE_SIZE)) && (
                            <Link
                                href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
                                className="px-4 py-2 bg-[#484DB5] text-white rounded hover:bg-opacity-90 transition"
                            >
                                Próxima Página
                            </Link>
                        )}
                    </div>
                    <Link href="/" className="inline-flex items-center justify-center h-10 px-6 rounded-md border border-[#E5E7EB] text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200">
                        Voltar para o início
                    </Link>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Erro na busca:", error);
        return notFound();
    }
}
