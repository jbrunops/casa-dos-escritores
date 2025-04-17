"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import SeriesActions from "@/components/SeriesActions";
import Comments from "@/components/Comments";
import { Eye, BookOpen, Calendar, User, Edit, Trash2, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { extractIdFromSlug, generateSlug } from "@/lib/utils";

interface Series {
    id: string;
    title: string;
    description: string;
    genre: string;
    tags: string[];
    author_id: string;
    cover_url?: string;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
    first_chapter?: string;
}

interface Chapter {
    id: string;
    title: string;
    chapter_number: number;
    content: string;
    created_at: string;
    updated_at: string;
    series_id: string;
}

export default function SeriesPage() {
    const params = useParams();
    const slug = params.id;
    const id = extractIdFromSlug(slug) || slug;
    const [series, setSeries] = useState<Series | null>(null);
    const [author, setAuthor] = useState<{ username: string } | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isAuthor, setIsAuthor] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const supabase = createBrowserClient();

    useEffect(() => {
        async function loadSeriesData() {
            setLoading(true);
            setError(null);
            try {
                // Buscar detalhes da série
                const { data: seriesData, error: seriesError } = await supabase
                    .from("series")
                    .select("*")
                    .eq("id", id)
                    .single();
                if (seriesError || !seriesData) throw new Error("Série não encontrada");
                setSeries(seriesData);
                // Buscar o autor
                const { data: authorData } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("id", seriesData.author_id)
                    .single();
                setAuthor(authorData);
                // Buscar capítulos
                const { data: chaptersData } = await supabase
                    .from("chapters")
                    .select("*")
                    .eq("series_id", id)
                    .order("chapter_number", { ascending: true });
                setChapters(chaptersData || []);
                // ID do primeiro capítulo
                const firstChapterId = chaptersData && chaptersData.length > 0 ? chaptersData[0].id : undefined;
                setSeries({ ...seriesData, first_chapter: firstChapterId });
                // Verificar se o usuário atual é o autor
                const { data: { session } } = await supabase.auth.getSession();
                const userId = session?.user?.id;
                setIsAuthor(userId === seriesData.author_id);
                setCurrentUserId(userId);
                // Atualizar contador de visualizações
                try {
                    await fetch(`/api/series/view?id=${id}`, { method: 'POST' });
                } catch {}
            } catch (err: any) {
                setError(err.message || "Erro ao carregar série");
            } finally {
                setLoading(false);
            }
        }
        if (id) loadSeriesData();
    }, [id, supabase]);

    if (loading) return <div className="flex items-center gap-2 text-gray-600"><span className="animate-spin">⏳</span> Carregando série...</div>;
    if (error) return <div className="text-red-500 font-semibold">{error}</div>;
    if (!series) return null;

    return (
        <div className="series-page max-w-3xl mx-auto p-4">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-bold mb-1">{series.title}</h1>
                    <div className="text-gray-500 text-sm mb-2">
                        <span><User size={16} className="inline mr-1" />{author?.username || "Autor desconhecido"}</span>
                        <span className="mx-2">•</span>
                        <span><Calendar size={16} className="inline mr-1" />{new Date(series.created_at).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <span><Eye size={16} className="inline mr-1" />Visualizações</span>
                    </div>
                </div>
                {isAuthor && (
                    <SeriesActions series={series} isAuthor={isAuthor} />
                )}
            </div>
            <div className="mb-6 text-gray-700 whitespace-pre-line">{series.description}</div>
            <div className="mb-6">
                <h2 className="font-semibold text-lg mb-2 flex items-center"><BookOpen size={18} className="mr-2" />Capítulos</h2>
                {chapters.length === 0 ? (
                    <div className="text-gray-500">Nenhum capítulo publicado ainda.</div>
                ) : (
                    <ul className="space-y-2">
                        {chapters.map(chapter => (
                            <li key={chapter.id} className="flex items-center gap-2">
                                <Link href={`/chapter/${chapter.id}`} className="text-[#484DB5] hover:underline">
                                    Capítulo {chapter.chapter_number}: {chapter.title}
                                </Link>
                                <span className="text-xs text-gray-400">{new Date(chapter.created_at).toLocaleDateString()}</span>
                                {isAuthor && (
                                    <Link href={`/dashboard/edit-chapter/${chapter.id}`} className="ml-2 text-xs text-blue-500 hover:underline"><Edit size={14} className="inline" /> Editar</Link>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
                {isAuthor && (
                    <Link href={`/dashboard/new-chapter/${series.id}`} className="mt-4 inline-flex items-center px-4 py-2 bg-[#484DB5] text-white rounded hover:bg-opacity-90">
                        <Plus size={16} className="mr-2" /> Novo Capítulo
                    </Link>
                )}
            </div>
            <Comments seriesId={series.id} currentUserId={currentUserId} />
        </div>
    );
}
