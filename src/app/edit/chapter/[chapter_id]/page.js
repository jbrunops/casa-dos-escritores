'use client';

import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { generateSlug } from '@/lib/utils';

export default function EditChapterPage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createBrowserClient();
    const [user, setUser] = useState(null);
    const [chapterData, setChapterData] = useState(null);
    const [seriesTitle, setSeriesTitle] = useState(''); // Guardar título da série para o link de volta
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const chapterId = params.chapter_id;

    // Buscar usuário e dados do capítulo (e da série associada)
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                setError("Usuário não autenticado.");
                router.push(`/login?redirect=/edit/chapter/${chapterId}`);
                setIsLoading(false);
                return;
            }
            setUser(user);

            if (chapterId) {
                const { data, error: chapterError } = await supabase
                    .from('chapters')
                    .select('*, author_id, series_id, series(title)') // Pega dados do capítulo e título da série
                    .eq('id', chapterId)
                    .single();

                if (chapterError || !data) {
                    setError("Capítulo não encontrado ou erro ao buscar dados.");
                    console.error("Erro ao buscar capítulo:", chapterError);
                } else if (data.author_id !== user.id) {
                    setError("Você não tem permissão para editar este capítulo.");
                } else {
                    setChapterData(data);
                    if (data.series) {
                         setSeriesTitle(data.series.title);
                    } else {
                         console.warn("Não foi possível buscar o título da série associada.");
                    }
                }
            }
            setIsLoading(false);
        };
        fetchData();
    }, [supabase, router, chapterId]);

    const handleChapterUpdate = async (formData) => {
        if (!user || !chapterData) {
            return { success: false, message: "Dados não carregados ou permissão negada." };
        }

        const { title, content, isDraft } = formData;

        try {
            const { error } = await supabase
                .from('chapters')
                .update({
                    title,
                    content,
                    is_published: !isDraft,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', chapterId)
                .eq('author_id', user.id); // Segurança extra

            if (error) throw error;

            router.refresh(); // Atualiza a página para refletir a mudança

            // Redirecionar para a página de leitura do capítulo
            router.push(`/ler/${generateSlug(title, chapterId)}`); // Atualizado para /ler/

            return {
                success: true,
                message: isDraft ? "Rascunho de capítulo atualizado!" : "Capítulo atualizado com sucesso!"
            };

        } catch (err) {
            console.error("Erro ao atualizar capítulo:", err);
            return {
                success: false,
                message: err.message || "Ocorreu um erro ao atualizar o capítulo"
            };
        }
    };

    // Renderização
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><p>Carregando editor...</p></div>;
    }

    if (error) {
        return <div className="flex flex-col justify-center items-center h-screen text-red-600">
                   <p className="mb-4">Erro:</p>
                   <p>{error}</p>
                   <Link href="/dashboard" className="mt-4 text-primary underline">Voltar ao Dashboard</Link>
               </div>;
    }

     if (!chapterData) {
         return <div className="flex justify-center items-center h-screen"><p>Não foi possível carregar os dados do capítulo.</p></div>;
    }

    // Determina o path de volta (para a série ou capítulo)
    const backPath = chapterData.series_id && seriesTitle 
        ? `/obra/${generateSlug(seriesTitle, chapterData.series_id)}` 
        : `/ler/${generateSlug(chapterData.title, chapterId)}`; // Fallback para o próprio capítulo
    const backLabel = seriesTitle ? "Voltar para a Obra" : "Voltar";

    return (
        <ContentEditor
            type="chapter"
            headerTitle={`Editar Capítulo: ${chapterData?.title || ''}`}
            backPath={backPath}
            backLabel={backLabel}
            onSubmit={handleChapterUpdate}
            initialData={chapterData} // Passa os dados existentes
            isEditing={true} // Flag de edição
            seriesId={chapterData.series_id} // Passa seriesId se o editor precisar
            seriesInfo={{ id: chapterData.series_id, title: seriesTitle }} // Passa info da série para o form
        />
    );
} 