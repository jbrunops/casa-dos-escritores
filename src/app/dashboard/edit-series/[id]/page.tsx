"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import ContentEditor from "@/components/ContentEditor";
import { ArrowLeft, Save, AlertTriangle, CheckCircle2, Image, X } from "lucide-react";

interface Series {
    id: string;
    title: string;
    description: string;
    genre: string;
    tags: string[];
    cover_url?: string;
    is_completed: boolean;
    author_id: string;
}

export default function EditSeriesPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [genre, setGenre] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState("");
    const [originalCoverUrl, setOriginalCoverUrl] = useState("");
    const [isCompleted, setIsCompleted] = useState(false);
    const [originalIsCompleted, setOriginalIsCompleted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createBrowserClient();
    const genres = ["Fantasia", "Romance", "Terror", "LGBTQ+", "Humor", "Poesia", "Ficção Científica", "Brasileiro", "Outros"];
    useEffect(() => {
        async function fetchSeries() {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { router.push("/login"); return; }
                const { data: series, error } = await supabase
                    .from("series").select("*").eq("id", id).single();
                if (error || !series) { setError("Série não encontrada"); return; }
                if (series.author_id !== user.id) { router.push("/dashboard"); return; }
                setTitle(series.title || "");
                setDescription(series.description || "");
                setGenre(series.genre || "");
                setTags(series.tags || []);
                setIsCompleted(series.is_completed || false);
                setOriginalIsCompleted(series.is_completed || false);
                if (series.cover_url) { setOriginalCoverUrl(series.cover_url); setCoverPreview(series.cover_url); }
            } catch { setError("Não foi possível carregar a série"); } finally { setLoading(false); }
        }
        if (id) fetchSeries();
    }, [id, router, supabase]);
    // ... (demais handlers e lógica de envio/refatoração)
    return (
        <div className="edit-series-page">
            <h1 className="text-2xl font-bold mb-4">Editar Série</h1>
            {loading ? (<div>Carregando...</div>) : error ? (<div className="text-red-500">{error}</div>) : (
                <ContentEditor
                    type="series"
                    headerTitle={`Editar Série: ${title}`}
                    backPath="/dashboard"
                    backLabel="Voltar ao dashboard"
                    title={title}
                    content={description}
                    genre={genre}
                    tags={tags}
                    coverUrl={coverPreview}
                    isCompleted={isCompleted}
                    onSubmit={() => {}}
                />
            )}
        </div>
    );
}
