"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";

export default function EditChapterPage() {
    const router = useRouter();
    const params = useParams();
    const chapterId = params.id;

    const [chapter, setChapter] = useState(null);
    const [seriesId, setSeriesId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const supabase = createBrowserClient();

    // Buscar informações do capítulo
    useEffect(() => {
        async function fetchChapterInfo() {
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

                // Buscar capítulo
                const { data: chapterData, error: chapterError } = await supabase
                    .from("chapters")
                    .select("*, series:series_id(title)")
                    .eq("id", chapterId)
                    .single();

                if (chapterError) {
                    console.error("Erro ao buscar capítulo:", chapterError);
                    throw new Error(
                        "Não foi possível encontrar o capítulo especificado"
                    );
                }

                if (!chapterData) {
                    throw new Error("Capítulo não encontrado");
                }

                // Verificar se o usuário é o autor do capítulo
                if (chapterData.author_id !== user.id) {
                    router.push("/dashboard");
                    return;
                }

                setChapter(chapterData);
                setSeriesId(chapterData.series_id);
            } catch (err) {
                console.error("Erro ao buscar informações do capítulo:", err);
                setError("Não foi possível carregar as informações do capítulo");
            } finally {
                setLoading(false);
            }
        }

        if (chapterId) {
            fetchChapterInfo();
        }
    }, [chapterId, router, supabase]);

    const handleSubmit = async (formData) => {
        const { title, content } = formData;
        
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) throw new Error("Você precisa estar logado");
            
            // Atualizar capítulo
            const { data: updateData, error: updateError } = await supabase
                .from("chapters")
                .update({
                    title,
                    content,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", chapterId)
                .select();
                
            if (updateError) {
                throw updateError;
            }
            
            // Atualizar timestamp da série
            const { error: seriesUpdateError } = await supabase
                .from("series")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", seriesId);
                
            if (seriesUpdateError) {
                console.error("Erro ao atualizar timestamp da série:", seriesUpdateError);
            }

            // Redirecionar após uma breve pausa
            setTimeout(() => {
                router.push(`/series/${seriesId}`);
            }, 1500);

            return {
                success: true,
                message: "Capítulo atualizado com sucesso!"
            };
        } catch (err) {
            console.error("Erro ao salvar capítulo:", err); 
            return {
                success: false,
                message: err.message || "Ocorreu um erro ao salvar o capítulo"
            };
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
                <div className="w-12 h-12 border-4 border-t-[#484DB5] border-r-[#E5E7EB] border-b-[#E5E7EB] border-l-[#E5E7EB] rounded-full animate-spin mb-4"></div>
                <p className="text-gray-700 font-medium">Carregando informações do capítulo...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-[75rem] mx-auto py-8">
                <div className="flex items-center bg-red-100 text-red-700 p-4 rounded-lg mb-6">
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <ContentEditor
            type="chapter"
            headerTitle={`Editar Capítulo: ${chapter?.title}`}
            backPath={`/series/${seriesId}`}
            backLabel="Voltar para a série"
            title={chapter?.title}
            content={chapter?.content}
            seriesId={seriesId}
            chapterNumber={chapter?.chapter_number}
            onSubmit={handleSubmit}
        />
    );
} 