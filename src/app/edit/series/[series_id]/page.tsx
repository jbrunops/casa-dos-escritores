'use client';

import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor, { ContentFormData, ContentSubmitResult } from "@/components/ContentEditor"; // Import types
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Loader } from 'lucide-react'; // Import Loader

// --- Interfaces ---
interface SeriesData {
    id: string;
    title: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
    genre: string | null;
    tags: string[] | null;
    cover_url: string | null;
    series_type: string | null;
    is_completed: boolean;
    author_id: string;
    view_count: number;
    // Derived property for ContentEditor compatibility
    category?: string | null;
}

export default function EditSeriesPage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createBrowserClient();
    const [user, setUser] = useState<User | null>(null);
    const [seriesData, setSeriesData] = useState<SeriesData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const seriesId = params.series_id as string; // Assert type

    // Fetch user and series data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
            if (userError || !currentUser) {
                setError("Usuário não autenticado.");
                router.push(`/login?redirect=/edit/series/${seriesId}`);
                setIsLoading(false);
                return;
            }
            setUser(currentUser);

            if (!seriesId) {
                setError("ID da série inválido.");
                setIsLoading(false);
                return;
            }

            try {
                const { data, error: seriesError } = await supabase
                    .from('series')
                    .select('*, author_id') // Select all series fields + author_id
                    .eq('id', seriesId)
                    .single<SeriesData>(); // Specify return type

                if (seriesError) throw seriesError;
                if (!data) throw new Error("Série não encontrada.");
                if (data.author_id !== currentUser.id) {
                    setError("Você não tem permissão para editar esta série.");
                     router.push('/dashboard'); // Redirect if not authorized
                } else {
                    // Map 'genre' to 'category' for ContentEditor compatibility
                    setSeriesData({ ...data, category: data.genre });
                }
            } catch (err: any) {
                 console.error("Erro ao buscar dados da série:", err);
                 setError(err.message || "Erro ao buscar dados da série.");
             } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [supabase, router, seriesId]);

    const handleSeriesUpdate = async (formData: ContentFormData): Promise<ContentSubmitResult> => {
        if (!user || !seriesData) {
            return { success: false, message: "Dados não carregados ou permissão negada." };
        }

        // Destructure with default empty array for tags
        const { title, description, category, tags = [], coverFile, isCompleted, seriesType } = formData;
        let finalCoverUrl = seriesData.cover_url; // Keep old URL by default

        // Basic validation (example)
        if (!title?.trim()) {
            return { success: false, message: "O título da série não pode ficar em branco." };
        }
        if (!seriesType) {
             return { success: false, message: "Por favor, selecione o tipo da obra (Livro, Novela ou Série)." };
        }

        try {
            // Upload new cover if provided
            if (coverFile) {
                console.log("Uploading new cover image...");
                 try {
                    const fileFormData = new FormData();
                    fileFormData.append('file', coverFile);
                    fileFormData.append('userId', user.id);
                    // Optional: Pass old URL for potential deletion in API
                    if (finalCoverUrl) {
                        fileFormData.append('oldFileUrl', finalCoverUrl);
                    }

                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: fileFormData
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Erro no upload da nova imagem');
                    }

                    const uploadData = await response.json();
                    if (!uploadData.url) {
                         throw new Error("URL da imagem não retornada após upload.");
                    }
                    finalCoverUrl = uploadData.url; // Update with the new URL
                    console.log("New cover URL:", finalCoverUrl);

                } catch (uploadErr: any) {
                    console.error("Erro no upload da nova capa:", uploadErr);
                    // Return error without stopping the whole update process? Or rethrow?
                    // Rethrowing to stop the update if upload fails.
                     throw new Error(`Erro no upload da nova imagem: ${uploadErr.message}`);
                }
            }

            // Update series data in the database
            const dataToUpdate: Partial<SeriesData> = {
                title,
                description,
                genre: category, // Map category back to genre
                tags,
                series_type: seriesType,
                cover_url: finalCoverUrl,
                is_completed: isCompleted ?? seriesData.is_completed, // Use submitted or original value
                updated_at: new Date().toISOString(),
            };

            console.log("Updating series with data:", dataToUpdate);

            const { error: updateError } = await supabase
                .from('series')
                .update(dataToUpdate)
                .eq('id', seriesId)
                .eq('author_id', user.id); // Ensure user is the author

            if (updateError) throw updateError;

             console.log("Series updated successfully, refreshing router...");
             router.refresh(); // Refresh server components

            // Redirect to the series page after success
             // Consider using the updated title for the slug if necessary
            router.push(`/obra/${seriesId}`); // Redirect using ID is safer

            return {
                success: true,
                message: "Série atualizada com sucesso!"
            };

        } catch (err: any) {
            console.error("Erro ao atualizar série:", err);
            return {
                success: false,
                message: err.message || "Ocorreu um erro ao atualizar a série"
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

     if (!seriesData) {
        return (
             <div className="container mx-auto px-4 py-8 text-center">
                 <p className="text-gray-600">Não foi possível carregar os dados da série.</p>
                 <Link href="/dashboard" className="mt-4 inline-block text-primary hover:underline">
                    Voltar ao Dashboard
                </Link>
            </div>
        );
    }

    return (
        <ContentEditor
            type="series" // Indicate to the editor it's a series
            headerTitle={`Editar Série: ${seriesData.title || 'Sem Título'}`}
            backPath={`/obra/${seriesId}`} // Use ID for reliable back path
            backLabel="Voltar para a Obra"
            onSubmit={handleSeriesUpdate}
            // Pass initialData mapped for the editor
            initialData={{
                 ...seriesData, // Pass existing fields
                 category: seriesData.genre, // Map genre to category
                 isCompleted: seriesData.is_completed, // Ensure completion status is passed
                 tags: seriesData.tags || [], // Ensure tags is an array
                 // ContentEditor doesn't need content for series
                 content: undefined,
                 isDraft: undefined // Series don't have draft status in the same way
             }}
        />
    );
} 