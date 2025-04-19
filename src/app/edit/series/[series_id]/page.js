'use client';

import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { generateSlug } from '@/lib/utils';

export default function EditSeriesPage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createBrowserClient();
    const [user, setUser] = useState(null);
    const [seriesData, setSeriesData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const seriesId = params.series_id;

    // Buscar usuário e dados da série
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                setError("Usuário não autenticado.");
                router.push(`/login?redirect=/edit/series/${seriesId}`);
                setIsLoading(false);
                return;
            }
            setUser(user);

            if (seriesId) {
                const { data, error: seriesError } = await supabase
                    .from('series')
                     // Seleciona campos relevantes para edição da série
                    .select('*, author_id, genre, series_type')
                    .eq('id', seriesId)
                    .single();

                if (seriesError || !data) {
                    setError("Série não encontrada ou erro ao buscar dados.");
                    console.error("Erro ao buscar série:", seriesError);
                } else if (data.author_id !== user.id) {
                    setError("Você não tem permissão para editar esta série.");
                } else {
                    // Renomeia 'genre' para 'category' para compatibilidade com ContentEditor
                    setSeriesData({ ...data, category: data.genre }); 
                }
            }
            setIsLoading(false);
        };
        fetchData();
    }, [supabase, router, seriesId]);

    const handleSeriesUpdate = async (formData) => {
        if (!user || !seriesData) {
            return { success: false, message: "Dados não carregados ou permissão negada." };
        }

        const { title, description, category, tags, coverFile, isCompleted, seriesType, id } = formData;
        let coverUrl = seriesData.cover_url; // Mantém a URL antiga por padrão

        if (!seriesType) {
             return { success: false, message: "Por favor, selecione o tipo da obra (Livro, Novela ou Série)." };
        }

        try {
            // Upload de nova capa, se fornecida
            if (coverFile) {
                 try {
                    const fileFormData = new FormData();
                    fileFormData.append('file', coverFile);
                    fileFormData.append('userId', user.id);
                    // Opcional: passar a URL antiga para a API deletar o arquivo antigo
                    if (coverUrl) {
                        fileFormData.append('oldFileUrl', coverUrl);
                    }
                    
                    const response = await fetch('/api/upload', { // Assume que a API /api/upload pode lidar com a substituição
                        method: 'POST', 
                        body: fileFormData
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Erro no upload da nova imagem');
                    }
                    
                    const uploadData = await response.json();
                    coverUrl = uploadData.url; // Atualiza para a nova URL
                    
                    if (!coverUrl) {
                        throw new Error("Não foi possível obter URL da nova imagem após upload.");
                    }
                } catch (uploadErr) {
                    console.error("Erro no upload da nova capa:", uploadErr);
                    throw new Error(`Erro no upload da nova imagem: ${uploadErr.message}`);
                }
            }

            // Atualizar dados da série no banco
            const { error } = await supabase
                .from('series')
                .update({
                    title,
                    description,
                    genre: category, // Atualiza o gênero com base na categoria do formulário
                    tags,
                    series_type: seriesType,
                    cover_url: coverUrl, // Usa a URL da capa (nova ou antiga)
                    is_completed: isCompleted, // Atualiza o status de conclusão
                    updated_at: new Date().toISOString(),
                })
                .eq('id', seriesId)
                .eq('author_id', user.id);

            if (error) throw error;

            // Redirecionar para a página da obra após o sucesso
            router.push(`/obra/${generateSlug(title, seriesId)}`);

            return {
                success: true,
                message: "Série atualizada com sucesso!"
            };

        } catch (err) {
            console.error("Erro ao atualizar série:", err);
            return {
                success: false,
                message: err.message || "Ocorreu um erro ao atualizar a série"
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
    
     if (!seriesData) {
         return <div className="flex justify-center items-center h-screen"><p>Não foi possível carregar os dados da série.</p></div>;
    }

    return (
        <ContentEditor
            type="series" // Indica ao editor que é uma série
            headerTitle={`Editar Série: ${seriesData?.title || ''}`}
            backPath={`/obra/${generateSlug(seriesData.title, seriesId)}`} // Atualizado para /obra/
            backLabel="Voltar para a Obra"
            onSubmit={handleSeriesUpdate}
            initialData={seriesData} // Passa os dados existentes para o editor
            isEditing={true} // Flag para indicar modo de edição (útil no ContentEditor)
        />
    );
} 