"use client";

import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import ContentEditor from "@/components/ContentEditor";

export default function NewSeriesPage() {
    const router = useRouter();
    const supabase = createBrowserClient();
    const handleSubmit = async (formData: { title: string; description: string; category: string; tags: string[]; coverFile?: File }) => {};
    return (
        <ContentEditor
            type="series"
            headerTitle="Criar Nova Série"
            backPath="/dashboard"
            backLabel="Voltar ao dashboard"
            onSubmit={handleSubmit}
        />
    );
}
