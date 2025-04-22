"use client";

import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";

export default function NewSeriesPage() {
    const router = useRouter();
    const supabase = createBrowserClient();

    const handleSubmit = async (formData) => {
        const { title, description, category, tags, coverFile } = formData;
        
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) throw new Error("Você precisa estar logado");

            // Upload da capa, se fornecida
            let coverUrl = null;
            if (coverFile) {
                try {
                    const formData = new FormData();
                    formData.append('file', coverFile);
                    formData.append('userId', user.id);
                    
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Erro no upload da imagem');
                    }
                    
                    const data = await response.json();
                    coverUrl = data.url;
                    
                    if (!coverUrl) {
                        throw new Error("Não foi possível obter URL da imagem");
                    }
                } catch (uploadErr) {
                    console.error("Erro no upload da capa:", uploadErr);
                    throw new Error(`Erro no upload da imagem: ${uploadErr.message}`);
                }
            }

            // Criar série
            const { data, error } = await supabase
                .from("series")
                .insert({
                    title,
                    description,
                    genre: category,
                    tags,
                    author_id: user.id,
                    cover_url: coverUrl,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select();

            if (error) throw error;

            // Notificar seguidores sobre a nova série
            if (data && data[0]) {
                await notifyFollowers(user.id, data[0].id, title);
            }

            // Redirecionar após breve pausa
            setTimeout(() => {
                router.push(`/dashboard/new-chapter/${data[0].id}`);
            }, 1500);

            return {
                success: true,
                message: "Série criada com sucesso!"
            };
        } catch (err) {
            console.error("Erro na criação da série:", err);
            return {
                success: false,
                message: err.message || "Ocorreu um erro ao criar a série"
            };
        }
    };

    // Função para notificar seguidores sobre uma nova série
    const notifyFollowers = async (authorId, seriesId, seriesTitle) => {
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
                    type: 'new_story', // Usando o mesmo tipo para simplificar
                    sender_id: authorId,
                    is_read: false,
                    additional_data: {
                        series_id: seriesId,
                        story_title: `Série: ${seriesTitle}`, // Para compatibilidade com o componente existente
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
            type="series"
            headerTitle="Criar Nova Série"
            backPath="/dashboard"
            backLabel="Voltar ao Dashboard"
            onSubmit={handleSubmit}
        />
    );
}
