"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import TipTapEditor from "@/components/TipTapEditor";
import Link from "next/link";
import {
    ArrowLeft,
    Save,
    AlertTriangle,
    CheckCircle2,
    BookOpen,
} from "lucide-react";

export default function NewChapterPage() {
    const router = useRouter();
    const params = useParams();
    const seriesId = params.seriesId;

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [chapterNumber, setChapterNumber] = useState(1);
    const [maxChapterNumber, setMaxChapterNumber] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [series, setSeries] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formTouched, setFormTouched] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [readingTime, setReadingTime] = useState(0);

    const supabase = createBrowserClient();

    // Buscar informações da série e definir número do capítulo
    useEffect(() => {
        async function fetchSeriesInfo() {
            try {
                setLoading(true);

                // Verificar se usuário está autenticado
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }

                // Buscar série
                const { data: seriesData, error: seriesError } = await supabase
                    .from("series")
                    .select("*")
                    .eq("id", seriesId)
                    .single();

                if (seriesError) {
                    console.error("Erro ao buscar série:", seriesError);
                    throw new Error(
                        "Não foi possível encontrar a série especificada"
                    );
                }

                if (!seriesData) {
                    throw new Error("Série não encontrada");
                }

                // Verificar se o usuário é o autor da série
                if (seriesData.author_id !== user.id) {
                    router.push("/dashboard");
                    return;
                }

                setSeries(seriesData);

                // Buscar maior número de capítulo existente
                const { data: chapters, error: chaptersError } = await supabase
                    .from("chapters")
                    .select("chapter_number")
                    .eq("series_id", seriesId)
                    .order("chapter_number", { ascending: false });

                if (chaptersError) {
                    console.error("Erro ao buscar capítulos:", chaptersError);
                }

                const nextChapterNumber =
                    chapters && chapters.length > 0
                        ? chapters[0].chapter_number + 1
                        : 1;

                setChapterNumber(nextChapterNumber);
                setMaxChapterNumber(nextChapterNumber);
            } catch (error) {
                console.error("Erro ao buscar informações da série:", error);
                setError("Não foi possível carregar as informações da série");
            } finally {
                setLoading(false);
            }
        }

        if (seriesId) {
            fetchSeriesInfo();
        }
    }, [seriesId, router, supabase]);

    // Detectar mudanças no formulário
    useEffect(() => {
        if (title || content) {
            setFormTouched(true);
        }
    }, [title, content]);

    // Atualizar estatísticas de texto
    useEffect(() => {
        if (content) {
            // Remover tags HTML para contagem precisa
            const plainText = content.replace(/<[^>]*>/g, "");
            // Contagem de caracteres
            setCharCount(plainText.length);

            // Contagem de palavras
            const words = plainText
                .split(/\s+/)
                .filter((word) => word.length > 0);
            setWordCount(words.length);

            // Tempo de leitura (200 palavras por minuto em média)
            const minutes = Math.max(1, Math.ceil(words.length / 200));
            setReadingTime(minutes);
        } else {
            setCharCount(0);
            setWordCount(0);
            setReadingTime(0);
        }
    }, [content]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            setError("Por favor, adicione um título para o capítulo");
            return;
        }

        if (!content.trim()) {
            setError("O conteúdo do capítulo não pode estar vazio");
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) throw new Error("Você precisa estar logado");

            // Inserir novo capítulo
            const { data, error } = await supabase
                .from("chapters")
                .insert({
                    title,
                    content,
                    chapter_number: chapterNumber,
                    series_id: seriesId,
                    author_id: user.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select();

            if (error) {
                console.error("Erro ao inserir capítulo:", error);
                throw error;
            }

            // Atualizar timestamp da série
            const { error: updateError } = await supabase
                .from("series")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", seriesId);

            if (updateError) {
                console.error(
                    "Erro ao atualizar timestamp da série:",
                    updateError
                );
            }

            setSuccess("Capítulo criado com sucesso!");

            // Redirecionar após uma breve pausa
            setTimeout(() => {
                router.push(`/series/${seriesId}`);
            }, 1500);
        } catch (err) {
            setError(err.message || "Ocorreu um erro ao salvar o capítulo");
            console.error("Erro ao criar capítulo:", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
                <div className="w-12 h-12 border-4 border-t-[#484DB5] border-r-[#E5E7EB] border-b-[#E5E7EB] border-l-[#E5E7EB] rounded-full animate-spin mb-4"></div>
                <p className="text-gray-700 font-medium">Carregando informações da série...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[75rem] mx-auto px-4 py-8">
            <div className="border-b border-[#E5E7EB] pb-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Novo Capítulo: {series?.title}</h1>
            </div>

            <div className="mb-6">
                <Link href={`/series/${seriesId}`} className="inline-flex items-center text-[#484DB5] hover:text-[#363a96] transition-colors">
                    <ArrowLeft size={16} className="mr-2" />
                    <span>Voltar para a série</span>
                </Link>
            </div>

            {error && (
                <div className="flex items-center bg-red-100 text-red-700 p-4 rounded-lg mb-6">
                    <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center bg-green-100 text-green-700 p-4 rounded-lg mb-6">
                    <CheckCircle2 size={20} className="mr-2 flex-shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título do Capítulo</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full h-10 px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:border-transparent transition-all"
                            placeholder="Título do capítulo..."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="chapterNumber" className="block text-sm font-medium text-gray-700">
                            Número do Capítulo
                        </label>
                        <input
                            id="chapterNumber"
                            type="number"
                            value={chapterNumber}
                            onChange={(e) =>
                                setChapterNumber(parseInt(e.target.value) || 1)
                            }
                            min="1"
                            className="w-full h-10 px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:border-transparent transition-all"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Capítulo {chapterNumber} de{" "}
                            {maxChapterNumber === chapterNumber
                                ? "uma nova série"
                                : `uma série com ${
                                      maxChapterNumber - 1
                                  } capítulos`}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">Conteúdo do Capítulo</label>
                    <div className="border border-[#E5E7EB] rounded-md overflow-hidden">
                        <TipTapEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Escreva seu capítulo aqui..."
                        />
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                            <span>{wordCount} palavras</span>
                        </div>
                        <div className="flex items-center">
                            <span>{charCount} caracteres</span>
                        </div>
                        <div className="flex items-center">
                            <BookOpen size={16} className="mr-1" />
                            <span>{readingTime} min. de leitura</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={
                            saving ||
                            !title.trim() ||
                            !content.trim() ||
                            !formTouched
                        }
                        className="inline-flex items-center h-10 px-6 py-2 bg-[#484DB5] text-white rounded-md hover:bg-[#3b40a0] focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mr-2"></div>
                                <span>Salvando...</span>
                            </>
                        ) : (
                            <>
                                <Save className="mr-2" size={18} />
                                <span>Salvar Capítulo</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
