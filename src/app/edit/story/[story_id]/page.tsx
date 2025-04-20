'use client';

import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor, { ContentFormData, ContentSubmitResult } from "@/components/ContentEditor"; // Import types
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Loader } from 'lucide-react'; // Import Loader
import { generateSlug } from '@/lib/utils'; // Import utility

// --- Interfaces ---
interface StoryData {
    id: string;
    title: string | null;
    content: string | null;
    created_at: string;
    updated_at: string;
    is_published: boolean;
    author_id: string;
    category: string | null;
    view_count: number;
    // Add other fields if needed
}

export default function EditStoryPage() {
    const router = useRouter();
    const params = useParams();
    const supabase = createBrowserClient();
    const [user, setUser] = useState<User | null>(null);
    const [storyData, setStoryData] = useState<StoryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const storyId = params.story_id as string; // Assert type

    // Fetch user and story data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
            if (userError || !currentUser) {
                setError("Usuário não autenticado.");
                router.push(`/login?redirect=/edit/story/${storyId}`);
                setIsLoading(false);
                return;
            }
            setUser(currentUser);

            if (!storyId) {
                setError("ID da história inválido.");
                setIsLoading(false);
                return;
            }

            try {
                const { data, error: storyError } = await supabase
                    .from('stories')
                    .select('*, author_id') // Select all fields needed for the editor
                    .eq('id', storyId)
                    .single<StoryData>(); // Specify return type

                if (storyError) throw storyError;
                if (!data) throw new Error("História não encontrada.");
                if (data.author_id !== currentUser.id) {
                     setError("Você não tem permissão para editar esta história.");
                     router.push('/dashboard'); // Redirect if not authorized
                } else {
                    setStoryData(data);
                }
            } catch (err: any) {
                console.error("Erro ao buscar dados da história:", err);
                setError(err.message || "Erro ao buscar dados da história.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [supabase, router, storyId]);

    const handleStoryUpdate = async (formData: ContentFormData): Promise<ContentSubmitResult> => {
        if (!user || !storyData) {
            return { success: false, message: "Dados não carregados ou permissão negada." };
        }

        const { title, content, category, isDraft } = formData;

        // Basic validation
         if (!title?.trim()) {
            return { success: false, message: "O título da história não pode ficar em branco." };
        }
         if (!content?.trim()) {
            return { success: false, message: "O conteúdo da história não pode ficar em branco." };
        }
         if (!category) {
            return { success: false, message: "Por favor, selecione uma categoria." };
        }

        try {
             const dataToUpdate: Partial<StoryData> = {
                title,
                content,
                category: category || "Outros", // Default category if somehow empty
                is_published: !isDraft,
                updated_at: new Date().toISOString(),
            };

            const { error: updateError } = await supabase
                .from('stories')
                .update(dataToUpdate)
                .eq('id', storyId)
                .eq('author_id', user.id); // Ensure user is the author

            if (updateError) throw updateError;

            router.refresh(); // Refresh server components

            // Redirect after a short delay to allow user to see success message (optional)
            // Using router.push directly might feel more responsive
            const redirectPath = isDraft ? '/dashboard' : `/story/${storyId}`; // Redirect to story page using ID
            // Consider generating slug if needed, but ID is safer for redirection
            // const redirectPath = isDraft ? '/dashboard' : `/story/${generateSlug(title, storyId)}`;
            router.push(redirectPath);

            return {
                success: true,
                message: isDraft ? "Rascunho atualizado com sucesso!" : "História atualizada com sucesso!"
            };

        } catch (err: any) {
            console.error("Erro ao atualizar história:", err);
            return {
                success: false,
                message: err.message || "Ocorreu um erro ao atualizar a história"
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

    if (!storyData) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                 <p className="text-gray-600">Não foi possível carregar os dados da história.</p>
                 <Link href="/dashboard" className="mt-4 inline-block text-primary hover:underline">
                    Voltar ao Dashboard
                </Link>
            </div>
        );
    }

    return (
        <ContentEditor
            type="story"
            headerTitle={`Editar História: ${storyData.title || 'Sem Título'}`}
            backPath={`/story/${storyId}`} // Go back to the story page by ID
            backLabel="Voltar para a História"
            onSubmit={handleStoryUpdate}
            initialData={{
                ...storyData,
                isDraft: !storyData.is_published // Map is_published to isDraft for the editor
                // Ensure other fields match ContentFormData if necessary
            }}
            requireCategory={true}
        />
    );
} 