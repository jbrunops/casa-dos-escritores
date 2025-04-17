"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";

// Tipagem global para reutilização
interface Series {
    id: string;
    title: string;
    description: string;
    genre: string;
    tags: string[];
    author_id: string;
    is_completed: boolean;
}

export default function NewChapterPage() {
    const router = useRouter();
    const params = useParams();
    const seriesId = params.seriesId as string;
    const [series, setSeries] = useState<Series | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nextChapterNumber, setNextChapterNumber] = useState(1);
    const supabase = createBrowserClient();
    // Carrega informações da série e define o próximo número do capítulo
    useEffect(() => {
        async function fetchSeriesInfo() {
            try {
                setLoading(true);
                setError(null);
                // Verifica autenticação
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }
                // Busca série
                const { data: seriesData, error: seriesError } = await supabase
                    .from("series")
                    .select("*")
                    .eq("id", seriesId)
                    .single();
                if (seriesError || !seriesData) {
                    setError("Série não encontrada");
                    return;
                }
                if (seriesData.author_id !== user.id) {
                    router.push("/dashboard");
                    return;
                }
                setSeries(seriesData);
                // Busca capítulos para definir o próximo número
                const { data: chapters } = await supabase
                    .from("chapters")
                    .select("chapter_number")
                    .eq("series_id", seriesId)
                    .order("chapter_number", { ascending: false });
                const nextNumber = chapters && chapters.length > 0 ? chapters[0].chapter_number + 1 : 1;
                setNextChapterNumber(nextNumber);
            } catch (err: any) {
                setError("Não foi possível carregar a série");
            } finally {
                setLoading(false);
            }
        }
        if (seriesId) fetchSeriesInfo();
    }, [seriesId, router, supabase]);

    // Handler para criação de capítulo
    const handleSubmit = async (formData: { title: string; content: string; chapterNumber: number }) => {
        setError(null);
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Você precisa estar logado");
            const { error: insertError } = await supabase
                .from("chapters")
                .insert({
                    title: formData.title,
                    content: formData.content,
                    chapter_number: formData.chapterNumber,
                    series_id: seriesId,
                    author_id: user.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
            if (insertError) throw insertError;
            // Atualiza timestamp da série
            await supabase
                .from("series")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", seriesId);
            router.push(`/series/${seriesId}`);
        } catch (err: any) {
            setError(err.message || "Erro ao criar capítulo");
        } finally {
            setLoading(false);
        }
    };

    // Feedback visual e UX amigável
    if (loading) return <div className="flex items-center gap-2 text-gray-600"><span className="animate-spin">⏳</span> Carregando...</div>;
    if (error) return <div className="text-red-500 font-semibold">{error}</div>;
    if (!series) return null;

    return (
        <ContentEditor
            type="chapter"
            headerTitle={`Novo Capítulo para: ${series.title}`}
            backPath={`/series/${seriesId}`}
            backLabel="Voltar para a série"
            title={""}
            content={""}
            seriesId={seriesId}
            chapterNumber={nextChapterNumber}
            onSubmit={handleSubmit}
        />
    );
}
