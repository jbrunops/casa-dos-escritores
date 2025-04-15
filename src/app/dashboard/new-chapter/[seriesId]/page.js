"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";

export default function NewChapterPage() {
    const router = useRouter();
    const params = useParams();
    const seriesId = params.seriesId;

    const [series, setSeries] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nextChapterNumber, setNextChapterNumber] = useState(1);

    const supabase = createBrowserClient();

    // Buscar informações da série e definir número do capítulo
    useEffect(() => {
        async function fetchSeriesInfo() {
            try {
                setLoading(true);

                // Verificar se usuário está autenticado
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }

                // Buscar série
                const { data: seriesData, error: seriesError } = await supabase
                    .from("series")
                    .select("*")
                    .eq("id", seriesId)
                    .single();

                if (seriesError) {
                    console.error("Erro ao buscar série:", seriesError);
                    throw new Error(
                        "Não foi possível encontrar a série especificada"
                    );
                }

                if (!seriesData) {
                    throw new Error("Série não encontrada");
                }

                // Verificar se o usuário é o autor da série
                if (seriesData.author_id !== user.id) {
                    router.push("/dashboard");
                    return;
                }

                setSeries(seriesData);

                // Buscar maior número de capítulo existente
                const { data: chapters, error: chaptersError } = await supabase
                    .from("chapters")
                    .select("chapter_number")
                    .eq("series_id", seriesId)
                    .order("chapter_number", { ascending: false });

                if (chaptersError) {
                    console.error("Erro ao buscar capítulos:", chaptersError);
                }

                const nextNumber =
                    chapters && chapters.length > 0
                        ? chapters[0].chapter_number + 1
                        : 1;

                setNextChapterNumber(nextNumber);
            } catch (err) {
                console.error("Erro ao buscar informações da série:", err);
                setError("Não foi possível carregar as informações da série");
            } finally {
                setLoading(false);
            }
        }

        if (seriesId) {
            fetchSeriesInfo();
        }
    }, [seriesId, router, supabase]);

    const handleSubmit = async (formData) => {
        const { title, content, chapterNumber } = formData;
        
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) throw new Error("Você precisa estar logado");

            // Inserir novo capítulo
            const { data, error } = await supabase
                .from("chapters")
                .insert({
                    title,
                    content,
                    chapter_number: chapterNumber || nextChapterNumber,
                    series_id: seriesId,
                    author_id: user.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select();

            if (error) {
                console.error("Erro ao inserir capítulo:", error);
                throw error;
            }

            // Atualizar timestamp da série
            const { error: updateError } = await supabase
                .from("series")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", seriesId);

            if (updateError) {
                console.error("Erro ao atualizar timestamp da série:", updateError);
            }

            // Notificar seguidores sobre o novo capítulo
            if (data && data[0]) {
                await notifyFollowers(user.id, data[0].id, title, seriesId, series?.title);
            }

            // Redirecionar após uma breve pausa
            setTimeout(() => {
                router.push(`/series/${seriesId}`);
            }, 1500);

            return {
                success: true,
                message: "Capítulo criado com sucesso!"
            };
        } catch (err) {
            console.error("Erro ao criar capítulo:", err);
            return {
                success: false,
                message: err.message || "Ocorreu um erro ao salvar o capítulo"
            };
        }
    };

    // Função para notificar seguidores sobre um novo capítulo
    const notifyFollowers = async (authorId, chapterId, chapterTitle, seriesId, seriesTitle) => {
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
                    type: 'new_chapter',
                    sender_id: authorId,
                    is_read: false,
                    additional_data: {
                        chapter_id: chapterId,
                        chapter_title: chapterTitle,
                        series_id: seriesId,
                        series_title: seriesTitle,
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
                <div className="w-12 h-12 border-4 border-t-[#484DB5] border-r-[#E5E7EB] border-b-[#E5E7EB] border-l-[#E5E7EB] rounded-full animate-spin mb-4"></div>
                <p className="text-gray-700 font-medium">Carregando informações da série...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-[75rem] mx-auto px-4 py-8">
                <div className="flex items-center bg-red-100 text-red-700 p-4 rounded-lg mb-6">
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <ContentEditor
            type="chapter"
            headerTitle={`Novo Capítulo: ${series?.title}`}
            backPath={`/series/${seriesId}`}
            backLabel="Voltar para a série"
            seriesId={seriesId}
            chapterNumber={nextChapterNumber}
            onSubmit={handleSubmit}
        />
    );
}
