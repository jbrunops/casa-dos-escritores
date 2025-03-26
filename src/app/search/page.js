import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
    title: "Resultados de pesquisa",
    description: "Pesquise histórias em nossa plataforma",
};

export default async function SearchPage({ searchParams }) {
    const query = searchParams.q || "";

    // Se não há consulta, redirecionar para home
    if (!query) {
        return (
            <div className="search-results-page">
                <h1>Pesquisa</h1>
                <p className="no-results">
                    Por favor, insira um termo de pesquisa.
                </p>
                <Link href="/" className="btn primary">
                    Voltar para o início
                </Link>
            </div>
        );
    }

    const supabase = await createServerSupabaseClient();

    try {
        // Buscar histórias que correspondem à consulta
        const { data: stories, error } = await supabase
            .from("stories")
            .select(
                `
                id,
                title,
                content,
                created_at,
                category,
                profiles(username)
            `
            )
            .eq("is_published", true)
            .or(
                `title.ilike.%${query}%,content.ilike.%${query}%,category.ilike.%${query}%`
            )
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        // Buscar perfis de usuário que correspondem à consulta
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select(
                `
                id,
                username,
                bio,
                avatar_url
            `
            )
            .ilike("username", `%${query}%`)
            .limit(10);

        if (profilesError) {
            console.error("Erro ao buscar perfis:", profilesError);
        }

        // Função para criar resumo do conteúdo HTML
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

        // Destacar o termo da pesquisa no texto
        const highlightText = (text, query) => {
            // Escapar caracteres especiais na consulta
            const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            // Criar uma expressão regular para buscar o termo (não sensível a maiúsculas/minúsculas)
            const regex = new RegExp(`(${safeQuery})`, "gi");

            // Dividir o texto pelo termo e criar um array com o termo destacado
            const parts = text.split(regex);

            return parts
                .map((part, i) =>
                    regex.test(part)
                        ? `<mark class="search-highlight">${part}</mark>`
                        : part
                )
                .join("");
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

        // Processar os resultados para destaque
        const processedStories = stories.map((story) => ({
            ...story,
            highlightedTitle: highlightText(story.title, query),
            summary: highlightText(createSummary(story.content), query),
        }));

        return (
            <div className="search-results-page">
                <h1>Resultados para "{query}"</h1>

                <div className="search-results-count">
                    Encontrados {stories.length + (profiles?.length || 0)}{" "}
                    resultados
                </div>

                {/* Resultados de perfis */}
                {profiles && profiles.length > 0 && (
                    <div className="search-section">
                        <h2>Escritores</h2>
                        <div className="writers-results">
                            {profiles.map((profile) => (
                                <Link
                                    href={`/profile/${encodeURIComponent(
                                        profile.username
                                    )}`}
                                    key={profile.id}
                                    className="writer-result-card"
                                >
                                    {profile.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt={profile.username}
                                            className="writer-avatar"
                                        />
                                    ) : (
                                        <div className="writer-avatar-placeholder">
                                            {profile.username
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                    )}
                                    <div className="writer-info">
                                        <h3>{profile.username}</h3>
                                        {profile.bio && (
                                            <p className="writer-bio">
                                                {profile.bio.length > 100
                                                    ? profile.bio.substring(
                                                          0,
                                                          100
                                                      ) + "..."
                                                    : profile.bio}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Resultados de histórias */}
                <div className="search-section">
                    <h2>Histórias</h2>

                    {processedStories.length === 0 ? (
                        <p className="no-results">
                            Nenhuma história encontrada para "{query}".
                            <br />
                            Tente outras palavras-chave ou categorias.
                        </p>
                    ) : (
                        <div className="story-results">
                            {processedStories.map((story) => (
                                <Link
                                    href={`/story/${story.id}`}
                                    key={story.id}
                                    className="story-result-card"
                                >
                                    <div className="result-header">
                                        <h3
                                            dangerouslySetInnerHTML={{
                                                __html: story.highlightedTitle,
                                            }}
                                        ></h3>
                                        {story.category && (
                                            <span className="story-category-badge">
                                                {story.category}
                                            </span>
                                        )}
                                    </div>

                                    <div className="result-meta">
                                        <span className="result-author">
                                            Por {story.profiles.username}
                                        </span>
                                        <span className="result-date">
                                            {formatDate(story.created_at)}
                                        </span>
                                    </div>

                                    <p
                                        className="result-summary"
                                        dangerouslySetInnerHTML={{
                                            __html: story.summary,
                                        }}
                                    ></p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="search-actions">
                    <Link href="/" className="btn secondary">
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
