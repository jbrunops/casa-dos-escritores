'use client';

import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";
import { generateSlug } from "@/lib/utils";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function WriteChapterPage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createBrowserClient();
    const [user, setUser] = useState(null);
    const [seriesInfo, setSeriesInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const seriesId = params.series_id;

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            // 1. Verificar autenticação
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                setError("Usuário não autenticado.");
                router.push(`/login?redirect=/write/chapter/${seriesId}`);
                setIsLoading(false);
                return;
            }
            setUser(user);

            // 2. Buscar informações da série (título, autor)
            if (seriesId) {
                const { data: seriesData, error: seriesError } = await supabase
                    .from('series')
                    .select('title, author_id')
                    .eq('id', seriesId)
                    .single();

                if (seriesError || !seriesData) {
                    setError("Série não encontrada ou erro ao buscar dados.");
                    console.error("Erro ao buscar série:", seriesError)
                    // Poderia redirecionar para uma página de erro 404 ou dashboard
                    // router.push('/dashboard'); 
                } else if (seriesData.author_id !== user.id) {
                    setError("Você não tem permissão para adicionar capítulos a esta série.");
                    // Redirecionar ou mostrar mensagem
                } else {
                    setSeriesInfo(seriesData);
                }
            }

            setIsLoading(false);
        };

        fetchData();
    }, [supabase, router, seriesId]);

    // >>> INÍCIO: Função para Notificar Seguidores sobre Novo Capítulo <<<
    const notifyFollowersNewChapter = async (authorId, chapterId, chapterTitle, seriesId, seriesTitle) => {
        try {
            // 1. Obter seguidores do autor
            const { data: followers, error: followersError } = await supabase
                .from('follows')
                .select('follower_id')
                .eq('following_id', authorId);
            if (followersError) throw followersError;

            if (followers && followers.length > 0) {
                // 2. Obter nome de usuário do autor
                const { data: authorData, error: authorError } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', authorId)
                    .single();
                if (authorError) throw authorError;

                // 3. Preparar notificações em lote
                const notifications = followers.map(follower => ({
                    user_id: follower.follower_id,
                    type: 'new_chapter', // NOVO TIPO DE NOTIFICAÇÃO
                    sender_id: authorId,
                    is_read: false,
                    additional_data: {
                        series_id: seriesId,
                        series_title: seriesTitle,
                        chapter_id: chapterId,
                        chapter_title: chapterTitle,
                        username: authorData.username // Nome do autor da série/capítulo
                    }
                }));

                // 4. Inserir notificações
                const { error: notificationError } = await supabase
                    .from('notifications')
                    .insert(notifications);
                if (notificationError) throw notificationError;

                console.log(`Notificações de novo capítulo enviadas para ${followers.length} seguidores.`);
            }
        } catch (error) {
            console.error('Erro ao notificar seguidores sobre novo capítulo:', error);
            // Não propagar o erro para não interromper o fluxo principal
        }
    };
    // >>> FIM: Função para Notificar Seguidores sobre Novo Capítulo <<<

    const handleChapterSubmit = async (formData) => {
        if (!user || !seriesInfo) {
            return { success: false, message: "Dados do usuário ou série não carregados." };
        }

        const { title, content, isDraft } = formData;
        
        try {
            const { count, error: countError } = await supabase
                .from('chapters')
                .select('*' , { count: 'exact', head: true })
                .eq('series_id', seriesId);

            if (countError) {
                throw new Error("Erro ao contar capítulos existentes: " + countError.message);
            }

            const chapterNumber = (count ?? 0) + 1;

            const chapterInsertData = {
                title,
                content,
                series_id: seriesId,
                author_id: user.id,
                chapter_number: chapterNumber
            };

            const { data, error } = await supabase
                .from("chapters")
                .insert(chapterInsertData)
                .select();

            if (error) {
                throw error;
            }

            if (!isDraft && data[0]) {
                await notifyFollowersNewChapter(
                    user.id, 
                    data[0].id,
                    title,
                    seriesId,
                    seriesInfo.title
                );
            }

            if (data && data.length > 0) {
                router.push(`/ler/${generateSlug(title, data[0].id)}`);
            } else {
                router.push(`/obra/${generateSlug(seriesInfo.title, seriesId)}`);
            }

            return {
                success: true,
                message: isDraft ? "Capítulo salvo como rascunho!" : "Capítulo publicado com sucesso!"
            };

        } catch (err) {
            console.error("[WriteChapterPage] Erro CAPTURADO no handleChapterSubmit:", err);
            return {
                success: false,
                message: err?.message || "Ocorreu um erro ao salvar o capítulo. Verifique o console para detalhes."
            };
        }
    };

    // Renderização condicional
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><p>Carregando...</p></div>;
    }

    if (error) {
        return <div className="flex flex-col justify-center items-center h-screen text-red-600">
                   <p className="mb-4">Erro:</p>
                   <p>{error}</p>
                   <Link href="/dashboard" className="mt-4 text-primary underline">Voltar ao Dashboard</Link>
               </div>;
    }

    if (!seriesInfo) {
        return <div className="flex justify-center items-center h-screen"><p>Série não encontrada ou não foi possível carregar os dados.</p></div>;
    }

    return (
        <ContentEditor
            type="chapter" // Indica ao editor que é um capítulo
            headerTitle={`Adicionar Capítulo ${seriesInfo ? ': ' + seriesInfo.title : ''}`}
            backPath={`/obra/${generateSlug(seriesInfo.title, seriesId)}`} // Atualizado para /obra/
            backLabel="Voltar para a Obra"
            onSubmit={handleChapterSubmit}
            chapterData={null} // Novo capítulo
            seriesId={seriesId}
            seriesInfo={seriesInfo} // Passa info da série para o form (para link Voltar)
            onSuccess={(chapterId, chapterTitle) => {
                 router.push(`/ler/${generateSlug(chapterTitle, chapterId)}`);
            }}
        />
    );
} 