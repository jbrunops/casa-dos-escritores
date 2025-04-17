"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";

interface Chapter {
    id: string;
    title: string;
    content: string;
    author_id: string;
    series_id: string;
    series?: { title: string };
}

export default function EditChapterPage() {
    const router = useRouter();
    const params = useParams();
    const chapterId = params.id as string;
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [seriesId, setSeriesId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createBrowserClient();

    useEffect(() => {
        async function fetchChapterInfo() {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }
                const { data: chapterData, error: chapterError } = await supabase
                    .from("chapters")
                    .select("*, series:series_id(title)")
                    .eq("id", chapterId)
                    .single();
                if (chapterError || !chapterData) {
                    setError("Capítulo não encontrado");
                    return;
                }
                if (chapterData.author_id !== user.id) {
                    router.push("/dashboard");
                    return;
                }
                setChapter(chapterData);
                setSeriesId(chapterData.series_id);
            } catch (err) {
                setError("Não foi possível carregar as informações do capítulo");
            } finally {
                setLoading(false);
            }
        }
        if (chapterId) fetchChapterInfo();
    }, [chapterId, router, supabase]);

    const handleSubmit = async (formData: { title: string; content: string }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Você precisa estar logado");
            const { error } = await supabase
                .from("chapters")
                .update({
                    title: formData.title,
                    content: formData.content,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", chapterId);
            if (error) throw error;
            // Atualizar timestamp da série (opcional)
            await supabase
                .from("series")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", seriesId);
            router.push(`/series/${seriesId}`);
        } catch (err) {
            setError("Erro ao atualizar capítulo");
        }
    };

    if (loading) return <div>Carregando...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!chapter) return null;

    return (
        <ContentEditor
            type="chapter"
            headerTitle={`Editar Capítulo: ${chapter.title}`}
            backPath={`/series/${seriesId}`}
            backLabel="Voltar para a série"
            title={chapter.title}
            content={chapter.content}
            seriesId={seriesId}
            chapterNumber={undefined}
            onSubmit={handleSubmit}
        />
    );
}
