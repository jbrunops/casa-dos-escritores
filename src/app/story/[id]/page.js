import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Comments from "@/components/Comments";
import StoryContent from "@/components/StoryContent";
import { extractIdFromSlug, formatDate, calculateReadingTime } from "@/lib/utils";

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
            <div className="max-w-[75rem] mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-6">{story.title}</h1>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        {story.profiles?.avatar_url ? (
                            <img
                                src={story.profiles.avatar_url}
                                alt={story.profiles.username || "Autor"}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-[#484DB5] text-white flex items-center justify-center font-medium">
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
                                className="font-medium text-gray-900 hover:underline transition-all duration-200"
                            >
                                {story.profiles?.username ||
                                    "Autor desconhecido"}
                            </Link>
                            <div className="flex text-sm text-gray-500 gap-2">
                                <span>
                                    {formattedDate}
                                </span>
                                <span>·</span>
                                <span>
                                    {readingTime} min para ler
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {story.category && (
                            <Link
                                href={`/categories/${story.category
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")}`}
                                className="px-3 py-1 rounded-full text-sm bg-gray-100 border border-[#E5E7EB] hover:bg-gray-200 transition-colors duration-200"
                            >
                                {story.category}
                            </Link>
                        )}

                        <span className="flex items-center gap-1 text-sm text-gray-500" title="Visualizações">
                            👁️ {story.view_count.toLocaleString("pt-BR")}
                        </span>
                    </div>
                </div>

                <div className="mb-12">
                    <StoryContent content={story.content} />
                </div>

                {/* Informações do autor ao final do artigo */}
                <div className="my-12 py-8 border-t border-b border-[#E5E7EB]">
                    <Link
                        href={`/profile/${encodeURIComponent(
                            story.profiles?.username || ""
                        )}`}
                    >
                        <div className="flex items-center gap-4 hover:bg-gray-50 p-4 rounded-lg transition-colors duration-200">
                            {story.profiles?.avatar_url ? (
                                <img
                                    src={story.profiles.avatar_url}
                                    alt={story.profiles.username || "Autor"}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-[#484DB5] text-white flex items-center justify-center text-xl font-medium">
                                    {(story.profiles?.username || "A")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-medium">
                                    Escrito por{" "}
                                    {story.profiles?.username ||
                                        "Autor desconhecido"}
                                </h3>
                                <p className="text-gray-600">
                                    Veja mais histórias deste autor visitando
                                    seu perfil.
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="mt-12">
                    <Comments
                        storyId={story.id}
                        userId={session?.user?.id}
                        authorId={story.author_id}
                    />
                </div>
            </div>
        );
    } catch (error) {
        console.error("Erro na página de história:", error);
        notFound();
    }
}
