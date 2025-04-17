"use client";

import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor"; // agora usando .tsx
import { generateSlug } from "@/lib/utils"; // agora usando utils.ts

export default function NewStoryPage() {
    const router = useRouter();
    const supabase = createBrowserClient();

    const handleSubmit = async (formData) => {
        const { title, content, category, isDraft } = formData;
        
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) throw new Error("Você precisa estar logado");

            const { data, error } = await supabase
                .from("stories")
                .insert({
                    title,
                    content,
                    category: category || "Sem categoria",
                    author_id: user.id,
                    is_published: !isDraft,
                })
                .select();

            if (error) throw error;

            // Se a história foi publicada (não é rascunho), notificar seguidores
            if (!isDraft && data[0]) {
                await notifyFollowers(user.id, data[0].id, title);
            }

            // Redirecionar após uma breve pausa
            setTimeout(() => {
                if (isDraft) {
                    router.push(`/dashboard`);
                } else {
                    router.push(`/story/${generateSlug(title, data[0].id)}`);
                }
            }, 1500);

            return {
                success: true,
                message: isDraft
                    ? "História salva como rascunho com sucesso!"
                    : "História publicada com sucesso!"
            };
        } catch (err) {
            console.error("Erro:", err);
            return {
                success: false,
                message: err.message || "Ocorreu um erro ao salvar a história"
            };
        }
    };

    // Função para notificar seguidores sobre uma nova história
    const notifyFollowers = async (authorId, storyId, storyTitle) => {
        try {
            // Obter todos os seguidores do autor
            const { data: followers, error: followersError } = await supabase
                .from('follows')
                .select('follower_id')
                .eq('following_id', authorId);
                
            if (followersError) throw followersError;
            
            if (followers && followers.length > 0) {
                // Obter detalhes do autor para inserir nas notificações
                const { data: authorData, error: authorError } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', authorId)
                    .single();
                    
                if (authorError) throw authorError;
                
                // Criar notificações em lote para todos os seguidores
                const notifications = followers.map(follower => ({
                    user_id: follower.follower_id,
                    type: 'new_story',
                    sender_id: authorId,
                    is_read: false,
                    additional_data: {
                        story_id: storyId,
                        story_title: storyTitle,
                        username: authorData.username
                    }
                }));
                
                // Inserir todas as notificações
                const { error: notificationError } = await supabase
                    .from('notifications')
                    .insert(notifications);
                    
                if (notificationError) throw notificationError;
            }
        } catch (error) {
            console.error('Erro ao notificar seguidores:', error);
            // Não propagar o erro, para não interromper o fluxo principal
        }
    };

    return (
        <ContentEditor
            type="story"
            headerTitle="Criar Novo Conto"
            backPath="/dashboard/new"
            backLabel="Voltar à seleção"
            onSubmit={handleSubmit}
        />
    );
}
