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
            <div className="loading-container">
                <div className="loader-large"></div>
                <p>Carregando informações da série...</p>
            </div>
        );
    }

    return (
        <div className="chapter-editor-container">
            <div className="story-editor-header">
                <h1>Novo Capítulo: {series?.title}</h1>
            </div>

            <div className="back-dashboard">
                <Link href={`/series/${seriesId}`} className="back-link">
                    <ArrowLeft size={16} />
                    <span>Voltar para a série</span>
                </Link>
            </div>

            {error && (
                <div className="story-message error">
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="story-message success">
                    <CheckCircle2 size={20} />
                    <span>{success}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="story-editor-form">
                <div className="story-form-grid">
                    <div className="story-form-group">
                        <label htmlFor="title">Título do Capítulo</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="story-input"
                            placeholder="Título do capítulo..."
                            required
                        />
                    </div>

                    <div className="story-form-group">
                        <label htmlFor="chapterNumber">
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
                            className="story-input chapter-number-select"
                        />
                        <p className="form-hint">
                            Capítulo {chapterNumber} de{" "}
                            {maxChapterNumber === chapterNumber
                                ? "uma nova série"
                                : `uma série com ${
                                      maxChapterNumber - 1
                                  } capítulos`}
                        </p>
                    </div>
                </div>

                <div className="story-form-group">
                    <label htmlFor="content">Conteúdo do Capítulo</label>
                    <div className="story-editor-wrapper">
                        <TipTapEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Escreva seu capítulo aqui..."
                        />
                    </div>
                    <div className="story-editor-stats">
                        <div className="story-stat">
                            <span>{wordCount} palavras</span>
                        </div>
                        <div className="story-stat">
                            <span>{charCount} caracteres</span>
                        </div>
                        <div className="story-stat">
                            <span>{readingTime} min. de leitura</span>
                        </div>
                    </div>
                </div>

                <div className="story-actions">
                    <button
                        type="submit"
                        disabled={
                            saving ||
                            !title.trim() ||
                            !content.trim() ||
                            !formTouched
                        }
                        className="story-btn story-btn-primary"
                    >
                        {saving ? (
                            <>
                                <Save
                                    className="story-btn-icon btn-spinner"
                                    size={18}
                                />
                                <span>Salvando...</span>
                            </>
                        ) : (
                            <>
                                <Save className="story-btn-icon" size={18} />
                                <span>Salvar Capítulo</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
