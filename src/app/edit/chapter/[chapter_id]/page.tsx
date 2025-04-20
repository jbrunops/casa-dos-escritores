'use client';

import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor, { ContentFormData, ContentSubmitResult } from "@/components/ContentEditor"; // Import types
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Loader } from 'lucide-react'; // Import Loader

// --- Interfaces ---
interface ChapterData {
    id: string;
    title: string | null;
    content: string | null;
    created_at: string;
    updated_at: string;
    is_published: boolean;
    author_id: string;
    series_id: string;
    chapter_number: number;
    view_count: number;
    series?: { title: string | null }; // Nested series data
}

interface SeriesInfo {
    id: string;
    title: string | null;
}

export default function EditChapterPage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createBrowserClient();
    const [user, setUser] = useState<User | null>(null);
    const [chapterData, setChapterData] = useState<ChapterData | null>(null);
    const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null); // Store series info separately
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const chapterId = params.chapter_id as string; // Assert type

    // Fetch user and chapter data (including associated series title)
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
            if (userError || !currentUser) {
                setError("Usuário não autenticado.");
                router.push(`/login?redirect=/edit/chapter/${chapterId}`);
                setIsLoading(false);
                return;
            }
            setUser(currentUser);

            if (!chapterId) {
                setError("ID do capítulo inválido.");
                setIsLoading(false);
                return;
            }

            try {
                const { data, error: chapterError } = await supabase
                    .from('chapters')
                    .select('*, author_id, series_id, series(title)') // Fetch chapter and series title
                    .eq('id', chapterId)
                    .single<ChapterData>(); // Specify return type

                if (chapterError) throw chapterError; // Throw to catch block
                if (!data) throw new Error("Capítulo não encontrado.");
                if (data.author_id !== currentUser.id) {
                    setError("Você não tem permissão para editar este capítulo.");
                    // Optionally redirect to an unauthorized page or dashboard
                    router.push('/dashboard');
                } else {
                    setChapterData(data);
                    if (data.series) {
                        setSeriesInfo({ id: data.series_id, title: data.series.title });
                    } else {
                        console.warn("Não foi possível buscar informações da série associada.");
                        // Maybe fetch separately if needed?
                    }
                }
            } catch (err: any) {
                console.error("Erro ao buscar dados do capítulo:", err);
                setError(err.message || "Erro ao buscar dados do capítulo.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [supabase, router, chapterId]);

    const handleChapterUpdate = async (formData: ContentFormData): Promise<ContentSubmitResult> => {
        if (!user || !chapterData) {
            return { success: false, message: "Dados não carregados ou permissão negada." };
        }

        const { title, content, isDraft } = formData;

        try {
            const { error: updateError } = await supabase
                .from('chapters')
                .update({
                    title,
                    content,
                    is_published: !isDraft,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', chapterId)
                .eq('author_id', user.id); // Ensure user is the author

            if (updateError) throw updateError;

            router.refresh(); // Refresh server components

            // Redirect to the chapter reading page
            // Ensure series_id is available for the URL
            if (chapterData.series_id) {
                router.push(`/ler/${chapterData.series_id}/${chapterId}`);
            } else {
                console.error("Series ID missing, cannot redirect to /ler page.");
                // Redirect somewhere else, maybe dashboard?
                router.push('/dashboard');
            }

            return {
                success: true,
                message: isDraft ? "Rascunho de capítulo atualizado!" : "Capítulo atualizado com sucesso!"
            };

        } catch (err: any) {
            console.error("Erro ao atualizar capítulo:", err);
            return {
                success: false,
                message: err.message || "Ocorreu um erro ao atualizar o capítulo"
            };
        }
    };

    // --- Render Logic ---
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
                <Loader className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <p className="text-red-600 bg-red-100 p-4 rounded-md">{error}</p>
                <Link href="/dashboard" className="mt-4 inline-block text-primary hover:underline">
                    Voltar ao Dashboard
                </Link>
            </div>
        );
    }

     if (!chapterData) {
        // This state might be reached briefly or if fetch fails silently
         return (
            <div className="container mx-auto px-4 py-8 text-center">
                 <p className="text-gray-600">Não foi possível carregar os dados do capítulo.</p>
                  <Link href="/dashboard" className="mt-4 inline-block text-primary hover:underline">
                    Voltar ao Dashboard
                </Link>
            </div>
        );
    }

    // Determine the back path (to the series or chapter)
    const backPath = seriesInfo?.id && seriesInfo?.title
        ? `/obra/${seriesInfo.id}` // Simplified, assuming series ID is enough for obra page
        : `/ler/${chapterData.series_id}/${chapterId}`; // Fallback to the chapter itself if no series info
    const backLabel = seriesInfo?.title ? "Voltar para a Obra" : "Voltar";

    return (
        <ContentEditor
            type="chapter"
            headerTitle={`Editar Capítulo: ${chapterData.title || 'Sem Título'}`}
            backPath={backPath}
            backLabel={backLabel}
            onSubmit={handleChapterUpdate}
            initialData={{
                title: chapterData.title || '',
                content: chapterData.content || '',
                isDraft: !chapterData.is_published,
                // Pass other relevant fields if ContentEditor expects them
            }}
            seriesId={chapterData.series_id} // Pass seriesId if needed
            seriesInfo={seriesInfo ?? undefined} // Pass series info if available
        />
    );
} 