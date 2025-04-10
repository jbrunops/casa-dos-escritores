import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Edit, BookOpen, Share2, MessageSquare, BookText, Book } from "lucide-react";
import SeriesHighlights from "@/components/SeriesHighlights";
import { generateSlug } from "@/lib/utils";

export default async function HomePage() {
    const supabase = await createServerSupabaseClient();

    // Buscar histórias recentes
    const { data: recentStories } = await supabase
        .from("stories")
        .select(
            `
      id,
      title,
      content,
      created_at,
      profiles(username)
    `
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(8); // Reduzindo para 8 para deixar espaço para capítulos

    // Buscar últimos capítulos
    let latestChaptersData = [];
    try {
        // Primeiro buscar os capítulos básicos
        const { data: latestChapters } = await supabase
            .from("chapters")
            .select("id, title, content, chapter_number, series_id, author_id, created_at")
            .not('series_id', 'is', null)
            .order("created_at", { ascending: false })
            .limit(6);

        // Processar cada capítulo para buscar detalhes relacionados
        if (latestChapters && latestChapters.length > 0) {
            const chaptersWithDetails = await Promise.all(
                latestChapters.map(async (chapter) => {
                    // Buscar dados da série relacionada
                    const { data: series } = await supabase
                        .from("series")
                        .select("title, id, cover_url")
                        .eq("id", chapter.series_id)
                        .single();
                    
                    // Buscar dados do autor
                    const { data: author } = await supabase
                        .from("profiles")
                        .select("username")
                        .eq("id", chapter.author_id)
                        .single();
                    
                    return {
                        ...chapter,
                        series,
                        author,
                        type: 'chapter'
                    };
                })
            );
            
            latestChaptersData = chaptersWithDetails;
        }
    } catch (error) {
        console.error("Erro ao buscar últimos capítulos:", error);
    }

    // Combinar histórias e capítulos, ordenados por data
    const recentContent = [
        ...(recentStories || []).map(item => ({ ...item, type: 'story' })),
        ...(latestChaptersData || []).map(item => ({ ...item, type: 'chapter' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

    // Obter as histórias com mais comentários
    // Primeiro buscar todas as histórias publicadas
    const { data: allStories } = await supabase
        .from("stories")
        .select(
            `
      id,
      title,
      content,
      created_at,
      profiles(username)
    `
        )
        .eq("is_published", true);

    // Buscar o número de comentários para cada história
    const storiesWithCommentCounts = await Promise.all(
        (allStories || []).map(async (story) => {
            const { count } = await supabase
                .from("comments")
                .select("*", { count: "exact" })
                .eq("story_id", story.id);

            return {
                ...story,
                comment_count: count || 0,
                type: 'story'
            };
        })
    );

    // Buscar todos os capítulos (para os mais comentados)
    const { data: allChapters } = await supabase
        .from("chapters")
        .select("id, title, content, chapter_number, series_id, author_id, created_at")
        .not('series_id', 'is', null);

    // Buscar detalhes adicionais para cada capítulo
    const chaptersWithDetails = await Promise.all(
        (allChapters || []).map(async (chapter) => {
            // Buscar série relacionada
            const { data: series } = await supabase
                .from("series")
                .select("title, id")
                .eq("id", chapter.series_id)
                .single();
            
            // Buscar autor
            const { data: author } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", chapter.author_id)
                .single();
            
            return {
                ...chapter,
                series,
                author
            };
        })
    );

    // Buscar o número de comentários para cada capítulo
    const chaptersWithCommentCounts = await Promise.all(
        (chaptersWithDetails || []).map(async (chapter) => {
            const { count } = await supabase
                .from("comments")
                .select("*", { count: "exact" })
                .eq("chapter_id", chapter.id);

            return {
                ...chapter,
                comment_count: count || 0,
                type: 'chapter'
            };
        })
    );

    // Combinar histórias e capítulos, ordenados por número de comentários
    const allContentWithComments = [
        ...storiesWithCommentCounts,
        ...chaptersWithCommentCounts
    ].sort((a, b) => b.comment_count - a.comment_count).slice(0, 10);

    // Buscar os 10 escritores mais ativos (que mais publicam)
    // Primeiro, buscar todos os escritores com contagem de publicações (histórias)
    const { data: authorStats } = await supabase
        .from("stories")
        .select(
            `
      author_id,
      profiles!stories_author_id_fkey(username, avatar_url)
    `
        )
        .eq("is_published", true);

    // Buscar TODOS os capítulos com seus autores e todos seus campos
    const { data: allChaptersWithAuthors } = await supabase
        .from("chapters")
        .select("*");
    
    // Log para debug
    console.log("Total de capítulos encontrados:", allChaptersWithAuthors?.length || 0);
    if (allChaptersWithAuthors?.length > 0) {
        console.log("Campos disponíveis nos capítulos:", Object.keys(allChaptersWithAuthors[0]));
    }
        
    // Buscar todos os perfis para uso posterior
    const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url");
        
    // Criar um mapa de perfis para fácil acesso
    const profilesMap = {};
    (allProfiles || []).forEach(profile => {
        profilesMap[profile.id] = profile;
    });

    // Criar uma tabela virtual de "publicações" que combina histórias e capítulos
    const publicationsByAuthor = {};
    
    // Log para debug
    console.log("Total de histórias encontradas:", authorStats?.length || 0);
    
    // Adicionar histórias à contagem
    (authorStats || []).forEach((story) => {
        if (!story.author_id || !story.profiles) return;
        
        const authorId = story.author_id;
        
        if (!publicationsByAuthor[authorId]) {
            publicationsByAuthor[authorId] = {
                id: authorId,
                username: story.profiles.username,
                avatar_url: story.profiles.avatar_url,
                count: 0
            };
        }
        
        publicationsByAuthor[authorId].count += 1;
    });
    
    // Adicionar todos os capítulos à contagem do mesmo autor
    (allChaptersWithAuthors || []).forEach((chapter) => {
        if (!chapter.author_id) return;
        
        const authorId = chapter.author_id;
        const authorProfile = profilesMap[authorId];
        
        if (!authorProfile) return;
        
        if (!publicationsByAuthor[authorId]) {
            publicationsByAuthor[authorId] = {
                id: authorId,
                username: authorProfile.username,
                avatar_url: authorProfile.avatar_url,
                count: 0
            };
        }
        
        publicationsByAuthor[authorId].count += 1;
    });
    
    // Log para debug - mostrar autores com suas contagens
    console.log("Autores e suas contagens:", Object.values(publicationsByAuthor).map(a => 
        ({ username: a.username, count: a.count })));
        
    // Converter para array, ordenar por contagem e pegar os 10 primeiros
    const topWriters = Object.values(publicationsByAuthor)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
        
    // Log para debug - mostrar top 10 escritores
    console.log("Top 10 escritores:", topWriters.map(a => ({ username: a.username, count: a.count })));

    // Função para criar um resumo do conteúdo HTML
    const createSummary = (htmlContent, maxLength = 150) => {
        // Remover todas as tags HTML
        const textContent = htmlContent?.replace(/<[^>]*>/g, "") || "";

        // Limitar o tamanho e adicionar reticências se necessário
        if (textContent.length <= maxLength) {
            return textContent;
        }

        // Cortar no final de uma palavra
        let summary = textContent.substring(0, maxLength);
        summary = summary.substring(0, summary.lastIndexOf(" "));
        return `${summary}...`;
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

    return (
        <div className="home-page">
            <section className="columns-section">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[75rem] mx-auto px-4 sm:px-6 md:px-0">
                    {/* Coluna 1: Histórias Recentes */}
                    <div className="column">
                        <h2 className="text-2xl font-extrabold text-black mb-4 border-b border-[#E5E7EB] pb-2 relative">
                            Histórias Recentes
                            <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                        </h2>
                        <div className="space-y-4">
                            {recentContent?.length === 0 ? (
                                <p>Nenhuma história publicada ainda.</p>
                            ) : (
                                recentContent.map((content) => 
                                    content.type === 'story' ? (
                                        <Link
                                            href={`/story/${generateSlug(content.title, content.id)}`}
                                            key={`story-${content.id}`}
                                            className="block p-4 rounded-lg border border-[#E5E7EB] hover:shadow-md transition-shadow"
                                        >
                                            <h3 className="font-semibold text-lg">{content.title}</h3>
                                            <div className="flex justify-between text-sm text-gray-600 mt-1 mb-2">
                                                <span className="font-bold text-[#484DB5]">
                                                    {content.type === 'chapter' ? content.author.username : content.profiles.username}
                                                </span>
                                                <span className="text-xs">
                                                    {formatDate(content.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-gray-700">
                                                {createSummary(content.content)}
                                            </p>
                                        </Link>
                                    ) : (
                                        <Link
                                            href={`/chapter/${generateSlug(content.title, content.id)}`}
                                            key={`chapter-${content.id}`}
                                            className="block relative p-4 rounded-lg border border-[#E5E7EB] bg-gray-50 hover:shadow-md transition-shadow"
                                        >
                                            <div className="absolute top-0 right-0 px-2 py-1 bg-[#484DB5] text-white text-xs rounded-tr-lg">
                                                Capítulo {content.chapter_number}
                                            </div>
                                            <h3 className="font-semibold text-lg mt-2 mb-3">{content.title}</h3>
                                            
                                            <div className="flex items-center text-sm text-gray-600 mt-1 mb-2">
                                                <span className="mr-2">
                                                    <span className="font-semibold">Série:</span>{" "}
                                                    <span 
                                                        className="inline-flex items-center bg-[#484DB5]/10 text-[#484DB5] px-2 py-0.5 rounded-md">
                                                        <Book size={14} className="mr-1" />
                                                        {content.series?.title}
                                                    </span>
                                                </span>
                                            </div>
                                            
                                            <p className="text-gray-700 my-4">
                                                {createSummary(content.content)}
                                            </p>
                                            
                                            <div className="flex justify-between text-sm text-gray-600 mt-4 pt-3 border-t border-[#E5E7EB]">
                                                <span className="font-bold text-[#484DB5]">
                                                    {content.type === 'chapter' ? content.author?.username : content.profiles.username}
                                                </span>
                                                <span className="text-xs">
                                                    {formatDate(content.created_at)}
                                                </span>
                                            </div>
                                        </Link>
                                    )
                                )
                            )}
                        </div>
                    </div>

                    {/* Coluna 2: Mais Comentados */}
                    <div className="column">
                        <h2 className="text-2xl font-extrabold text-black mb-4 border-b border-[#E5E7EB] pb-2 relative">
                            Mais Comentados
                            <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                        </h2>
                        <div className="space-y-4">
                            {allContentWithComments?.length === 0 ? (
                                <p>Nenhuma história comentada ainda.</p>
                            ) : (
                                allContentWithComments.map((content) => 
                                    content.type === 'story' ? (
                                        <Link
                                            href={`/story/${generateSlug(content.title, content.id)}`}
                                            key={`story-${content.id}`}
                                            className="block p-4 rounded-lg border border-[#E5E7EB] hover:shadow-md transition-shadow"
                                        >
                                            <h3 className="font-semibold text-lg">{content.title}</h3>
                                            <div className="flex justify-between text-sm text-gray-600 mt-1 mb-2">
                                                <span className="font-bold text-[#484DB5]">
                                                    {content.type === 'chapter' ? content.author.username : content.profiles.username}
                                                </span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs">
                                                        {formatDate(
                                                            content.created_at
                                                        )}
                                                    </span>
                                                    <span className="flex items-center bg-gray-100 px-2 py-0.5 rounded-full">
                                                        <MessageSquare
                                                            size={14}
                                                            className="mr-1 text-[#484DB5]"
                                                        />
                                                        <span>
                                                            {content.comment_count}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-gray-700">
                                                {createSummary(content.content)}
                                            </p>
                                        </Link>
                                    ) : (
                                        <Link
                                            href={`/chapter/${generateSlug(content.title, content.id)}`}
                                            key={`chapter-${content.id}`}
                                            className="block relative p-4 rounded-lg border border-[#E5E7EB] bg-gray-50 hover:shadow-md transition-shadow"
                                        >
                                            <div className="absolute top-0 right-0 px-2 py-1 bg-[#484DB5] text-white text-xs rounded-tr-lg">
                                                Capítulo {content.chapter_number}
                                            </div>
                                            <h3 className="font-semibold text-lg mt-2 mb-3">{content.title}</h3>
                                            
                                            <div className="flex items-center text-sm text-gray-600 mt-1 mb-2">
                                                <span className="mr-2">
                                                    <span className="font-semibold">Série:</span>{" "}
                                                    <span 
                                                        className="inline-flex items-center bg-[#484DB5]/10 text-[#484DB5] px-2 py-0.5 rounded-md">
                                                        <Book size={14} className="mr-1" />
                                                        {content.series?.title}
                                                    </span>
                                                </span>
                                            </div>
                                            
                                            <p className="text-gray-700 my-4">
                                                {createSummary(content.content)}
                                            </p>
                                            
                                            <div className="flex justify-between text-sm text-gray-600 mt-4 pt-3 border-t border-[#E5E7EB]">
                                                <span className="font-bold text-[#484DB5]">
                                                    {content.type === 'chapter' ? content.author?.username : content.profiles.username}
                                                </span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs">
                                                        {formatDate(content.created_at)}
                                                    </span>
                                                    <span className="flex items-center bg-gray-100 px-2 py-0.5 rounded-full">
                                                        <MessageSquare
                                                            size={14}
                                                            className="mr-1 text-[#484DB5]"
                                                        />
                                                        <span>
                                                            {content.comment_count}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                )
                            )}
                        </div>
                    </div>

                    {/* Coluna 3: Top 10 Escritores */}
                    <div className="column">
                        <h2 className="text-2xl font-extrabold text-black mb-4 border-b border-[#E5E7EB] pb-2 relative">
                            Top 10 Escritores
                            <span className="block h-1 w-32 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                        </h2>
                        <div className="space-y-3">
                            {topWriters?.length === 0 ? (
                                <p>Nenhum escritor ativo ainda.</p>
                            ) : (
                                topWriters?.map((writer, index) => (
                                    <div
                                        key={writer.id}
                                        className="flex items-center p-3 rounded-lg border border-[#E5E7EB] hover:shadow-sm transition-shadow"
                                    >
                                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#484DB5] text-white text-xs mr-3">
                                            {index + 1}
                                        </div>

                                        {writer.avatar_url ? (
                                            <img
                                                src={writer.avatar_url}
                                                alt={writer.username}
                                                className="w-10 h-10 rounded-full mr-3 object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-[#484DB5] text-white flex items-center justify-center mr-3">
                                                {writer.username
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}

                                        <div className="flex flex-col">
                                            <h3 className="font-medium">
                                                <Link
                                                    href={`/profile/${encodeURIComponent(
                                                        writer.username
                                                    )}`}
                                                >
                                                    {writer.username}
                                                </Link>
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {writer.count}{" "}
                                                {writer.count === 1
                                                    ? "publicação"
                                                    : "publicações"}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* NOVA SEÇÃO: Séries Destacadas */}
            <section className="series-highlights-section">
                <SeriesHighlights />
            </section>

            <section className="max-w-[75rem] mx-auto px-4 sm:px-6 md:px-0 py-12 features-section">
                <h2 className="text-3xl font-extrabold text-black mb-8 pb-2 relative">
                    Como funciona
                    <span className="block h-1 w-64 mt-2 bg-gradient-to-r from-[#484DB5] to-[#E5E7EB] rounded-full animate-pulse"></span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 features-grid">
                    <div className="bg-white p-6 rounded-lg shadow-md border border-[#E5E7EB] flex flex-col items-center text-center feature-card">
                        <div className="bg-[#484DB5]/10 p-4 rounded-full mb-4 feature-icon">
                            <Edit size={32} color="#484DB5" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-[#484DB5]">1. Crie uma conta</h3>
                        <p className="text-gray-700">
                            Registre-se gratuitamente para começar a
                            compartilhar suas histórias com outros leitores.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border border-[#E5E7EB] flex flex-col items-center text-center feature-card">
                        <div className="bg-[#484DB5]/10 p-4 rounded-full mb-4 feature-icon">
                            <BookOpen size={32} color="#484DB5" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-[#484DB5]">2. Escreva suas histórias</h3>
                        <p className="text-gray-700">
                            Use nosso editor intuitivo para criar suas obras com
                            formatação profissional.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border border-[#E5E7EB] flex flex-col items-center text-center feature-card">
                        <div className="bg-[#484DB5]/10 p-4 rounded-full mb-4 feature-icon">
                            <Share2 size={32} color="#484DB5" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-[#484DB5]">3. Compartilhe com o mundo</h3>
                        <p className="text-gray-700">
                            Publique suas histórias e receba feedback valioso da
                            comunidade de leitores.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
