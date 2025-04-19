'use client';

import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function EditStoryPage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createBrowserClient();
    const [user, setUser] = useState(null);
    const [storyData, setStoryData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const storyId = params.story_id;

    // Buscar usuário e dados da história
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                setError("Usuário não autenticado.");
                router.push(`/login?redirect=/edit/story/${storyId}`);
                setIsLoading(false);
                return;
            }
            setUser(user);

            if (storyId) {
                const { data, error: storyError } = await supabase
                    .from('stories')
                    .select('*, author_id') // Seleciona todos os campos necessários para o editor
                    .eq('id', storyId)
                    .single();

                if (storyError || !data) {
                    setError("História não encontrada ou erro ao buscar dados.");
                    console.error("Erro ao buscar história:", storyError);
                } else if (data.author_id !== user.id) {
                    setError("Você não tem permissão para editar esta história.");
                } else {
                    setStoryData(data);
                }
            }
            setIsLoading(false);
        };
        fetchData();
    }, [supabase, router, storyId]);

    const handleStoryUpdate = async (formData) => {
        if (!user || !storyData) {
            return { success: false, message: "Dados não carregados ou permissão negada." };
        }

        const { title, content, category, isDraft } = formData;

        try {
            const { error } = await supabase
                .from('stories')
                .update({
                    title,
                    content,
                    category: category || "Sem categoria",
                    is_published: !isDraft,
                    updated_at: new Date().toISOString(), // Atualiza a data de modificação
                })
                .eq('id', storyId)
                .eq('author_id', user.id); // Segurança extra: só atualiza se o autor for o mesmo

            if (error) throw error;

            // Redirecionar após pausa
            setTimeout(() => {
                if (isDraft) {
                    router.push(`/dashboard`);
                } else {
                    // Usa o título atualizado (formData.title) para gerar o slug
                    router.push(`/story/${generateSlug(title, storyId)}`);
                }
            }, 1500);

            return {
                success: true,
                message: isDraft ? "Rascunho atualizado com sucesso!" : "História atualizada com sucesso!"
            };

        } catch (err) {
            console.error("Erro ao atualizar história:", err);
            return {
                success: false,
                message: err.message || "Ocorreu um erro ao atualizar a história"
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

    if (!storyData) {
         return <div className="flex justify-center items-center h-screen"><p>Não foi possível carregar os dados da história.</p></div>;
    }

    return (
        <ContentEditor
            type="story"
            headerTitle="Editar Conto"
            backPath={`/story/${generateSlug(storyData.title, storyId)}`} // Volta para a página da história
            backLabel="Voltar ao Conto"
            onSubmit={handleStoryUpdate}
            initialData={storyData} // Passa os dados existentes para o editor
        />
    );
} 