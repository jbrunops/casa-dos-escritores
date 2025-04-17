"use client";

import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";
import { generateSlug } from "@/lib/utils";

export default function NewStoryPage() {
    const router = useRouter();
    const supabase = createBrowserClient();
    const handleSubmit = async (formData: { title: string; content: string; category: string; isDraft: boolean }) => {};
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
