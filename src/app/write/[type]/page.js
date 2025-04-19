'use client';

import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";
import { generateSlug } from "@/lib/utils";
import { useEffect, useState } from 'react';

export default function WritePage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createBrowserClient();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Determina o tipo (story ou series) a partir da URL
    const type = params.type;

    // Busca o usuário ao montar o componente
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
            } else {
                // Redirecionar para login se não estiver autenticado
                router.push('/login?redirect=/write'); // Ou uma página de erro
            }
            setIsLoading(false);
        };
        fetchUser();
    }, [supabase, router]);

    const handleUnifiedSubmit = async (formData) => {
        if (!user) {
            return { success: false, message: "Usuário não autenticado." };
        }

        try {
            if (type === 'story') {
                // --- Lógica para criar CONTO ÚNICO --- 
                const { title, content, category, isDraft } = formData;

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

                // Notificar seguidores se publicado
                if (!isDraft && data[0]) {
                    await notifyFollowers(user.id, type, data[0].id, title);
                }
                
                // Redirecionar após pausa
                setTimeout(() => {
                    if (isDraft) {
                        router.push(`/dashboard`); // Vai para o dashboard se for rascunho
                    } else {
                        router.push(`/story/${generateSlug(title, data[0].id)}`);
                    }
                }, 1500);

                return {
                    success: true,
                    message: isDraft ? "Conto salvo como rascunho!" : "Conto publicado com sucesso!"
                };

            } else if (type === 'series') {
                // --- Lógica para criar SÉRIE --- 
                const { title, description, category, tags, coverFile } = formData;

                // Upload da capa, se fornecida
                let coverUrl = null;
                if (coverFile) {
                    try {
                        const fileFormData = new FormData();
                        fileFormData.append('file', coverFile);
                        fileFormData.append('userId', user.id);
                        
                        const response = await fetch('/api/upload', {
                            method: 'POST',
                            body: fileFormData
                        });
                        
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Erro no upload da imagem');
                        }
                        
                        const uploadData = await response.json();
                        coverUrl = uploadData.url;
                        
                        if (!coverUrl) {
                            throw new Error("Não foi possível obter URL da imagem após upload.");
                        }
                    } catch (uploadErr) {
                        console.error("Erro no upload da capa:", uploadErr);
                        throw new Error(`Erro no upload da imagem: ${uploadErr.message}`);
                    }
                }

                // Criar série no banco
                const { data, error } = await supabase
                    .from("series")
                    .insert({
                        title,
                        description,
                        genre: category, // Usando o campo category como gênero para séries
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
                    await notifyFollowers(user.id, type, data[0].id, title);
                }

                // Redirecionar para CRIAR O PRIMEIRO CAPÍTULO NA NOVA ROTA
                setTimeout(() => {
                    router.push(`/write/chapter/${data[0].id}`);
                }, 1500);

                return {
                    success: true,
                    message: "Série criada com sucesso! Você será redirecionado para criar o primeiro capítulo."
                };
            } else {
                 throw new Error("Tipo de conteúdo inválido.");
            }

        } catch (err) {
            console.error("Erro ao salvar conteúdo:", err);
            return {
                success: false,
                message: err.message || `Ocorreu um erro ao salvar ${type === 'story' ? 'o conto' : 'a série'}`
            };
        }
    };

    // --- Função Unificada para Notificar Seguidores --- 
    const notifyFollowers = async (authorId, contentType, contentId, contentTitle) => {
        try {
            // Obter seguidores
            const { data: followers, error: followersError } = await supabase
                .from('follows')
                .select('follower_id')
                .eq('following_id', authorId);
                
            if (followersError) throw followersError;
            
            if (followers && followers.length > 0) {
                // Obter detalhes do autor
                const { data: authorData, error: authorError } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', authorId)
                    .single();
                if (authorError) throw authorError;

                // Preparar notificações
                const notificationType = contentType === 'story' ? 'new_story' : 'new_series'; // Ajuste conforme necessário
                const notifications = followers.map(follower => ({
                    user_id: follower.follower_id,
                    type: notificationType,
                    sender_id: authorId,
                    is_read: false,
                    additional_data: {
                        [contentType === 'story' ? 'story_id' : 'series_id']: contentId,
                        [contentType === 'story' ? 'story_title' : 'series_title']: contentTitle,
                        username: authorData.username
                    }
                }));
                
                // Inserir notificações
                const { error: notificationError } = await supabase
                    .from('notifications')
                    .insert(notifications);
                if (notificationError) throw notificationError;
            }
        } catch (error) {
            console.error('Erro ao notificar seguidores:', error);
            // Não propagar erro para não interromper o fluxo principal
        }
    };

    // Renderização condicional enquanto carrega ou se o tipo for inválido
    if (isLoading) {
         return <div className="flex justify-center items-center h-screen"><p>Carregando...</p></div>; // Ou um spinner
    }

    if (type !== 'story' && type !== 'series') {
         return <div className="flex justify-center items-center h-screen"><p>Tipo de conteúdo inválido.</p></div>;
    }

    // Configurações para o ContentEditor
    const editorConfig = type === 'story' ? {
        type: 'story',
        headerTitle: 'Criar Novo Conto',
        backPath: '/write',
        backLabel: 'Voltar à seleção',
    } : {
        type: 'series',
        headerTitle: 'Criar Nova Série',
        backPath: '/write',
        backLabel: 'Voltar à seleção',
    };

    return (
        <ContentEditor
            {...editorConfig}
            onSubmit={handleUnifiedSubmit}
        />
    );
} 