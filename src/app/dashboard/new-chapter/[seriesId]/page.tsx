"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";

export default function NewChapterPage() {
    const router = useRouter();
    const params = useParams();
    const seriesId = params.seriesId as string;
    const [series, setSeries] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nextChapterNumber, setNextChapterNumber] = useState(1);
    const supabase = createBrowserClient();
    useEffect(() => {
        async function fetchSeriesInfo() {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { router.push("/login"); return; }
                const { data: seriesData, error: seriesError } = await supabase
                    .from("series").select("*").eq("id", seriesId).single();
                if (seriesError || !seriesData) { setError("Série não encontrada"); return; }
                if (seriesData.author_id !== user.id) { router.push("/dashboard"); return; }
                setSeries(seriesData);
                const { data: chapters, error: chaptersError } = await supabase
                    .from("chapters").select("chapter_number").eq("series_id", seriesId).order("chapter_number", { ascending: false });
                const nextNumber = chapters && chapters.length > 0 ? chapters[0].chapter_number + 1 : 1;
                setNextChapterNumber(nextNumber);
            } catch { setError("Não foi possível carregar a série"); } finally { setLoading(false); }
        }
        if (seriesId) fetchSeriesInfo();
    }, [seriesId, router, supabase]);
    const handleSubmit = async (formData: { title: string; content: string; chapterNumber: number }) => {};
    if (loading) return <div>Carregando...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
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
