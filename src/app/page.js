import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Edit, BookOpen, Share2, MessageSquare } from "lucide-react";

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
        .limit(10);

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
            };
        })
    );

    // Ordenar por número de comentários (decrescente) e pegar os 10 primeiros
    const mostCommentedStories = storiesWithCommentCounts
        .sort((a, b) => b.comment_count - a.comment_count)
        .slice(0, 10);

    // Buscar os 10 escritores mais ativos (que mais publicam)
    // Primeiro, buscar todos os escritores com contagem de publicações
    const { data: authorStats } = await supabase
        .from("stories")
        .select(
            `
      author_id,
      profiles!stories_author_id_fkey(username, avatar_url)
    `
        )
        .eq("is_published", true);

    // Contar o número de histórias por autor
    const authorCounts = {};
    (authorStats || []).forEach((story) => {
        const authorId = story.author_id;
        if (!authorCounts[authorId]) {
            authorCounts[authorId] = {
                id: authorId,
                username: story.profiles.username,
                avatar_url: story.profiles.avatar_url,
                count: 0,
            };
        }
        authorCounts[authorId].count += 1;
    });

    // Converter para array, ordenar por contagem e pegar os 10 primeiros
    const topWriters = Object.values(authorCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

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
            <section className="hero">
                <h1>O lugar certo para nós!</h1>
                <p>
                    Um espaço para compartilhar suas histórias com o mundo,
                    <br />
                    comentar, conversar, seguir, favoritar e criar sem limites.
                    Seja você!
                </p>
                {/* <div className="hero-buttons">
                    <Link href="/signup" className="btn primary">
                        Cadastre-se
                    </Link>
                </div> */}
            </section>

            <section className="columns-section">
                <div className="columns-grid">
                    {/* Coluna 1: Histórias Recentes */}
                    <div className="column">
                        <h2>Histórias Recentes</h2>
                        <div className="stories-list">
                            {recentStories?.length === 0 ? (
                                <p>Nenhuma história publicada ainda.</p>
                            ) : (
                                recentStories?.map((story) => (
                                    <Link
                                        href={`/story/${story.id}`}
                                        key={story.id}
                                        className="story-card"
                                    >
                                        <h3>{story.title}</h3>
                                        <div className="story-meta-line">
                                            <span className="author-name">
                                                {story.profiles.username}
                                            </span>
                                            <span className="story-date">
                                                {formatDate(story.created_at)}
                                            </span>
                                        </div>
                                        <p className="story-summary">
                                            {createSummary(story.content)}
                                        </p>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Coluna 2: Mais Comentados */}
                    <div className="column">
                        <h2>Mais Comentados</h2>
                        <div className="stories-list">
                            {mostCommentedStories?.length === 0 ? (
                                <p>Nenhuma história comentada ainda.</p>
                            ) : (
                                mostCommentedStories?.map((story) => (
                                    <Link
                                        href={`/story/${story.id}`}
                                        key={story.id}
                                        className="story-card"
                                    >
                                        <h3>{story.title}</h3>
                                        <div className="story-meta-line">
                                            <span className="author-name">
                                                {story.profiles.username}
                                            </span>
                                            <div className="meta-right">
                                                <span className="story-date">
                                                    {formatDate(
                                                        story.created_at
                                                    )}
                                                </span>
                                                <span className="comment-badge">
                                                    <span className="comment-icon-container">
                                                        <MessageSquare
                                                            size={14}
                                                        />
                                                    </span>
                                                    <span>
                                                        {story.comment_count}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                        <p className="story-summary">
                                            {createSummary(story.content)}
                                        </p>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Coluna 3: Top 10 Escritores */}
                    <div className="column">
                        <h2>Top 10 Escritores</h2>
                        <div className="writers-list">
                            {topWriters?.length === 0 ? (
                                <p>Nenhum escritor ativo ainda.</p>
                            ) : (
                                topWriters?.map((writer, index) => (
                                    <div
                                        key={writer.id}
                                        className="writer-card"
                                    >
                                        <div className="writer-rank">
                                            #{index + 1}
                                        </div>

                                        {writer.avatar_url ? (
                                            <img
                                                src={writer.avatar_url}
                                                alt={writer.username}
                                                className="writer-avatar"
                                            />
                                        ) : (
                                            <div className="writer-avatar-placeholder">
                                                {writer.username
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}

                                        <div className="writer-info">
                                            <h3>
                                                <Link
                                                    href={`/profile/${encodeURIComponent(
                                                        writer.username
                                                    )}`}
                                                >
                                                    {writer.username}
                                                </Link>
                                            </h3>
                                            <p className="writer-stats">
                                                {writer.count}{" "}
                                                {writer.count === 1
                                                    ? "história"
                                                    : "histórias"}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="features-section">
                <h2>Como funciona</h2>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Edit size={32} color="#4a4fbc" />
                        </div>
                        <h3>1. Crie uma conta</h3>
                        <p>
                            Registre-se gratuitamente para começar a
                            compartilhar suas histórias com outros leitores.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <BookOpen size={32} color="#4a4fbc" />
                        </div>
                        <h3>2. Escreva suas histórias</h3>
                        <p>
                            Use nosso editor intuitivo para criar suas obras com
                            formatação profissional.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <Share2 size={32} color="#4a4fbc" />
                        </div>
                        <h3>3. Compartilhe com o mundo</h3>
                        <p>
                            Publique suas histórias e receba feedback valioso da
                            comunidade de leitores.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
