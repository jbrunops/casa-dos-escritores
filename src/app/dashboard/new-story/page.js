"use client";

import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";
import { generateSlug } from "@/lib/utils";

export default function NewStoryPage() {
    const router = useRouter();
    const supabase = createBrowserClient();

    const handleSubmit = async (formData) => {
        const { title, content, category, isDraft } = formData;
        
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) throw new Error("Você precisa estar logado");

            const { data, error } = await supabase
                .from("stories")
                .insert({
                    title,
                    content,
                    category: category || "Sem categoria",
                    author_id: user.id,
                    is_published: !isDraft,
                })
                .select();

            if (error) throw error;

            // Redirecionar após uma breve pausa
            setTimeout(() => {
                if (isDraft) {
                    router.push(`/dashboard`);
                } else {
                    router.push(`/story/${generateSlug(title, data[0].id)}`);
                }
            }, 1500);

            return {
                success: true,
                message: isDraft
                    ? "História salva como rascunho com sucesso!"
                    : "História publicada com sucesso!"
            };
        } catch (err) {
            console.error("Erro:", err);
            return {
                success: false,
                message: err.message || "Ocorreu um erro ao salvar a história"
            };
        }
    };

    return (
        <ContentEditor
            type="story"
            headerTitle="Criar Novo Conto"
            backPath="/dashboard/new"
            backLabel="Voltar à seleção"
            onSubmit={handleSubmit}
        />
    );
}
