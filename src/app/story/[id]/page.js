import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Comments from "@/components/Comments";
import StoryContent from "@/components/StoryContent";
import { extractIdFromSlug, formatDate, calculateReadingTime } from "@/lib/utils";
import { Eye } from "lucide-react";

export async function generateMetadata({ params }) {
    try {
        const slug = await Promise.resolve(params.id);
        const id = extractIdFromSlug(slug) || slug; // Usar o slug diretamente se não conseguir extrair o ID
        const supabase = await createServerSupabaseClient();

        const { data: story, error } = await supabase
            .from("stories")
            .select("title")
            .eq("id", id)
            .single();

        if (error || !story) {
            return { title: "História não encontrada" };
        }

        return {
            title: story.title,
            description: `Leia "${story.title}" na Plataforma para Escritores`,
        };
    } catch (error) {
        console.error("Erro ao gerar metadata:", error);
        return { title: "História" };
    }
}

export default async function StoryPage({ params }) {
    try {
        const slug = await Promise.resolve(params.id);
        const id = extractIdFromSlug(slug) || slug;
        
        console.log("----- DIAGNÓSTICO DE HISTÓRIA -----");
        console.log("Slug recebido da URL:", slug);
        console.log("ID extraído para consulta:", id);
        console.log("Tipo do ID:", typeof id);
        
        const supabase = await createServerSupabaseClient();

        // Buscar a história
        const { data: story, error } = await supabase
            .from("stories")
            .select(
                `
                id, 
                title, 
                content, 
                category, 
                created_at, 
                view_count,
                is_published, 
                author_id, 
                profiles(username, avatar_url)
            `
            )
            .eq("id", id)
            .single();

        // Verificar se a história existe e está publicada
        if (error) {
            console.error(`Erro ao buscar história com ID '${id}':`, error);
            notFound();
        }
        
        if (!story) {
            console.error(`História não encontrada para o ID: '${id}'`);
            notFound();
        }
        
        if (!story.is_published) {
            console.error(`História ID '${id}' não está publicada`);
            notFound();
        }
        
        console.log("História encontrada com sucesso:", story.id, story.title);

        // Obter a sessão atual para verificar se o usuário está logado
        const {
            data: { session },
        } = await supabase.auth.getSession();

        // Incrementar contador de visualizações
        try {
            await supabase
                .from("stories")
                .update({ view_count: (story.view_count || 0) + 1 })
                .eq("id", id);

            // Atualizar localmente para exibição
            story.view_count = (story.view_count || 0) + 1;
        } catch (updateError) {
            console.error("Erro ao atualizar visualizações:", updateError);
            // Continue mesmo se falhar ao atualizar contagem
        }

        // Formatar a data de publicação
        const formattedDate = formatDate(story.created_at);

        // Calcular tempo estimado de leitura
        const readingTime = calculateReadingTime(story.content);

        return (
            <div className="medium-story">
                <h1 className="story-title">{story.title}</h1>

                <div className="story-meta">
                    <div className="author-info">
                        {story.profiles?.avatar_url ? (
                            <img
                                src={story.profiles.avatar_url}
                                alt={story.profiles.username || "Autor"}
                                className="author-avatar"
                            />
                        ) : (
                            <div className="author-avatar-placeholder">
                                {(story.profiles?.username || "A")
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>
                        )}
                        <div>
                            <Link
                                href={`/profile/${encodeURIComponent(
                                    story.profiles?.username || ""
                                )}`}
                                className="author-name"
                            >
                                {story.profiles?.username ||
                                    "Autor desconhecido"}
                            </Link>
                            <div className="publication-info">
                                <span className="publication-date">
                                    {formattedDate}
                                </span>
                                <span className="reading-time">
                                    {readingTime} min de leitura
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="story-tags">
                        {story.category && (
                            <Link
                                href={`/categories/${story.category
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")}`}
                                className="story-category"
                            >
                                {story.category}
                            </Link>
                        )}

                        <span className="view-count" title="Visualizações">
                            <Eye size={16} className="text-[#484DB5]" /> {story.view_count.toLocaleString("pt-BR")}
                        </span>
                    </div>
                </div>

                <StoryContent content={story.content} />

                {/* Informações do autor ao final do artigo */}
                <div className="author-bio-section">
                    <Link
                        href={`/profile/${encodeURIComponent(
                            story.profiles?.username || ""
                        )}`}
                    >
                        <div className="author-bio">
                            {story.profiles?.avatar_url ? (
                                <img
                                    src={story.profiles.avatar_url}
                                    alt={story.profiles.username || "Autor"}
                                    className="author-bio-avatar"
                                />
                            ) : (
                                <div className="author-bio-avatar-placeholder">
                                    {(story.profiles?.username || "A")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                            )}
                            <div className="author-bio-content">
                                <h3>
                                    Escrito por{" "}
                                    {story.profiles?.username ||
                                        "Autor desconhecido"}
                                </h3>
                                <p>
                                    Veja mais histórias deste autor visitando
                                    seu perfil.
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>

                <Comments
                    storyId={story.id}
                    userId={session?.user?.id}
                    authorId={story.author_id}
                />
            </div>
        );
    } catch (error) {
        console.error("Erro na página de história:", error);
        notFound();
    }
}
