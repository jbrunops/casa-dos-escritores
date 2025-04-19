import { notFound } from "next/navigation";
// import Link from "next/link"; // Não mais usado diretamente aqui
import { createServerSupabaseClient } from "@/lib/supabase-server";
// import Comments from "@/components/Comments"; // Movido para ContentViewer
// import StoryContent from "@/components/StoryContent"; // Movido para ContentViewer
import { extractIdFromSlug, formatDate, calculateReadingTime } from "@/lib/utils";
// import { Eye } from "lucide-react"; // Movido para ContentViewer
import ContentViewer from "@/components/ContentViewer"; // Importar o novo componente

export async function generateMetadata({ params }) {
    let id;
    try {
        const slug = await Promise.resolve(params.id); // Re-adicionar await
        id = extractIdFromSlug(slug) || slug;
        const supabase = await createServerSupabaseClient(); // Criar após await

        const { data: story, error } = await supabase
            .from("stories")
            .select("title")
            .eq("id", id)
            .single();

        if (error || !story) {
            console.warn(`Metadata: História não encontrada para ID '${id}', Slug: '${params.id}'`);
            return { title: "História não encontrada" };
        }

        return {
            title: story.title,
            description: `Leia \"${story.title}\" na Casa dos Escritores`,
        };
    } catch (error) {
        console.error("Erro ao gerar metadata para história:", { error, params });
        return { title: "História - Casa dos Escritores" };
    }
}

export default async function StoryPage({ params }) {
    let id;
    try {
        const slug = await Promise.resolve(params.id); // Re-adicionar await
        id = extractIdFromSlug(slug) || slug;

        console.log("----- DIAGNÓSTICO DE HISTÓRIA -----");
        console.log("Slug recebido da URL:", slug);
        console.log("ID extraído para consulta:", id);
        console.log("Tipo do ID:", typeof id);
        
        const supabase = await createServerSupabaseClient(); // Criar após await

        // Buscar a história com dados do perfil do autor
        const { data: story, error: storyError } = await supabase // Renomear erro
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
                profiles (
                    username,
                    avatar_url,
                    id
                )
            `
            )
            .eq("id", id)
            .single();

        // Verificar se a história existe e está publicada
        if (storyError) {
            console.error(`Erro ao buscar história com ID '${id}':`, storyError);
            notFound();
        }
        
        if (!story) {
            console.error(`História não encontrada para o ID: '${id}'`);
            notFound();
        }
        
        if (!story.is_published) {
            // Adicionar verificação se o usuário logado é o autor (permitir visualização)
            const { data: { user } } = await supabase.auth.getUser();
            if (story.author_id !== user?.id) {
                 console.warn(`História ID '${id}' não publicada e usuário não é o autor.`);
                 notFound(); 
            }
            console.log(`História ID '${id}' não publicada, mas visualizada pelo autor.`);
        }
        
        console.log("História encontrada:", story.id, story.title);

        // Obter o usuário logado de forma segura
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        
        // Lógica de incremento de view (manter no servidor por enquanto)
        if (story.author_id !== userId) { // Não incrementar se for o próprio autor
             try {
                 await supabase
                     .from("stories")
                     .update({ view_count: (story.view_count || 0) + 1 })
                     .eq("id", id);
             } catch (updateError) {
                 console.error("Erro ao atualizar visualizações da história:", updateError);
             }
        } else {
             console.log("Visualização do autor, não incrementando contador.");
        }

        // Renderizar usando o ContentViewer
        return (
            <ContentViewer 
                contentType="story"
                contentId={story.id}
                title={story.title}
                content={story.content}
                authorProfile={story.profiles}
                createdAt={story.created_at}
                category={story.category}
                viewCount={story.view_count}
                userId={userId}
            />
        );
    } catch (error) {
        console.error("Erro na página de história:", { error, id, params });
        notFound(); 
    }
}
