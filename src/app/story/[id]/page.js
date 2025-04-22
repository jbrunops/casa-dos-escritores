import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import ContentViewer from "@/components/content-viewer";
import { extractIdFromSlug } from "@/lib/utils";

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
            description: `Leia "${story.title}" na Casa dos Escritores`,
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
                profiles(id, username, avatar_url, bio)
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

        // Buscar histórias relacionadas (mesma categoria)
        const { data: relatedStories } = await supabase
            .from("stories")
            .select(
                `
                id, 
                title, 
                content, 
                created_at, 
                view_count,
                profiles(username, avatar_url)
                `
            )
            .eq("category", story.category)
            .eq("is_published", true)
            .neq("id", id)
            .order("view_count", { ascending: false })
            .limit(3);

        return (
            <div className="max-w-[75rem] mx-auto">
                <ContentViewer
                    id={story.id}
                    title={story.title}
                    content={story.content}
                    createdAt={story.created_at}
                    author={story.profiles}
                    viewCount={story.view_count}
                    relatedItems={relatedStories}
                    userId={session?.user?.id}
                    contentType="story"
                    category={story.category}
                />
            </div>
        );
    } catch (error) {
        console.error("Erro na página de história:", error);
        notFound();
    }
}
