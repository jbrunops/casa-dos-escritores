// src/app/dashboard/edit/[id]/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import TipTapEditor from "@/components/TipTapEditor";
import Link from "next/link";
import DeleteModal from "@/components/DeleteModal";
import {
    ArrowLeft,
    Save,
    Eye,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    Send,
    FileText,
    Clock,
    BookOpen,
    RefreshCw,
} from "lucide-react";
import { generateSlug } from "@/lib/utils";

export default function EditContentPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [contentType, setContentType] = useState(""); // "story" ou "chapter"
    const [category, setCategory] = useState("");
    const [chapterNumber, setChapterNumber] = useState(1);
    const [maxChapterNumber, setMaxChapterNumber] = useState(1);
    const [seriesId, setSeriesId] = useState(null);
    const [series, setSeries] = useState(null);
    const [isPublished, setIsPublished] = useState(false);
    const [originalIsPublished, setOriginalIsPublished] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [formChanged, setFormChanged] = useState(false);
    const [originalData, setOriginalData] = useState({
        title: "",
        content: "",
        category: "",
        chapter_number: 1,
    });
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [readingTime, setReadingTime] = useState(0);
    const [lastSaved, setLastSaved] = useState("");

    const supabase = createBrowserClient();

    // Lista de categorias disponíveis para histórias
    const categories = [
        "Fantasia",
        "Romance",
        "Terror",
        "LGBTQ+",
        "Humor",
        "Poesia",
        "Ficção Científica",
        "Brasileiro",
        "Outros",
    ];

    // Função que detecta o tipo de conteúdo e carrega os dados apropriados
    const fetchContent = useCallback(async () => {
        try {
            setLoading(true);
            
            // Verificar se o usuário está autenticado
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            // Tentar buscar como história primeiro
            const { data: story, error: storyError } = await supabase
                .from("stories")
                .select("*")
                .eq("id", id)
                .single();

            if (!storyError && story) {
                setContentType("story");
                
                // Carregar dados da história
                setTitle(story.title);
                setContent(story.content);
                setCategory(story.category || "");
                setIsPublished(story.is_published);
                setOriginalIsPublished(story.is_published);
                setOriginalData({
                    title: story.title,
                    content: story.content,
                    category: story.category || "",
                });

                // Formatar data da última atualização
                const updatedDate = new Date(
                    story.updated_at || story.created_at
                );
                const formattedDate = updatedDate.toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                });
                setLastSaved(formattedDate);

                // Verificar se o usuário é o autor da história
                if (story.author_id !== user.id) {
                    router.push("/dashboard");
                    return;
                }
            } else {
                // Se não for história, tenta buscar como capítulo
                const { data: chapter, error: chapterError } = await supabase
                    .from("chapters")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (!chapterError && chapter) {
                    setContentType("chapter");
                    
                    // Carregar dados do capítulo
                    setTitle(chapter.title);
                    setContent(chapter.content);
                    setChapterNumber(chapter.chapter_number);
                    setSeriesId(chapter.series_id);
                    setOriginalData({
                        title: chapter.title,
                        content: chapter.content,
                        chapter_number: chapter.chapter_number,
                    });

                    // Formatar data da última atualização
                    const updatedDate = new Date(
                        chapter.updated_at || chapter.created_at
                    );
                    const formattedDate = updatedDate.toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    });
                    setLastSaved(formattedDate);

                    // Verificar se o usuário é o autor do capítulo
                    if (chapter.author_id !== user.id) {
                        router.push("/dashboard");
                        return;
                    }

                    // Buscar informações da série
                    const { data: seriesData, error: seriesError } = await supabase
                        .from("series")
                        .select("*")
                        .eq("id", chapter.series_id)
                        .single();

                    if (!seriesError && seriesData) {
                        setSeries(seriesData);
                    } else {
                        console.error("Erro ao buscar série:", seriesError);
                    }

                    // Buscar maior número de capítulo existente
                    const { data: chapters, error: chaptersError } = await supabase
                        .from("chapters")
                        .select("chapter_number")
                        .eq("series_id", chapter.series_id)
                        .order("chapter_number", { ascending: false });

                    if (!chaptersError && chapters) {
                        setMaxChapterNumber(
                            chapters.length > 0
                                ? Math.max(...chapters.map(c => c.chapter_number))
                                : 1
                        );
                    } else {
                        console.error("Erro ao buscar capítulos:", chaptersError);
                    }
                } else {
                    // Se não for nem história nem capítulo, retornar erro
                    throw new Error("Conteúdo não encontrado");
                }
            }

            // Calcular estatísticas de texto
            if (content) {
                updateTextStats(content);
            }

            setLoading(false);
        } catch (err) {
            console.error("Erro ao buscar conteúdo:", err);
            setError("Não foi possível carregar este conteúdo. Por favor, tente novamente.");
            setLoading(false);
        }
    }, [id, router, supabase]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    // Função para atualizar estatísticas de texto
    const updateTextStats = (textContent) => {
        if (!textContent) {
            setCharCount(0);
            setWordCount(0);
            setReadingTime(0);
            return;
        }

        // Remover tags HTML para contagem precisa
        const plainText = textContent.replace(/<[^>]*>/g, "");
        
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
    };

    // Detectar alterações no formulário
    useEffect(() => {
        if (contentType === "story") {
            const hasChanges =
                title !== originalData.title ||
                content !== originalData.content ||
                category !== originalData.category ||
                isPublished !== originalIsPublished;

            setFormChanged(hasChanges);
        } else if (contentType === "chapter") {
            const hasChanges =
                title !== originalData.title ||
                content !== originalData.content ||
                chapterNumber !== originalData.chapter_number;

            setFormChanged(hasChanges);
        }

        // Atualizar estatísticas de texto
        updateTextStats(content);
    }, [
        title,
        content,
        category,
        isPublished,
        chapterNumber,
        originalData,
        originalIsPublished,
        contentType,
    ]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            setError(`Por favor, adicione um título para ${contentType === "story" ? "sua história" : "o capítulo"}`);
            return;
        }

        if (isPublished && !content.trim() && contentType === "story") {
            setError("O conteúdo da história não pode estar vazio para publicação");
            return;
        }

        if (!content.trim() && contentType === "chapter") {
            setError("O conteúdo do capítulo não pode estar vazio");
            return;
        }

        if (isPublished && !category && contentType === "story") {
            setError("Por favor, selecione uma categoria para publicação");
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

            if (contentType === "story") {
                // Atualizar história
                const { error } = await supabase
                    .from("stories")
                    .update({
                        title,
                        content,
                        category,
                        is_published: isPublished,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", id);

                if (error) throw error;

                // Atualizar dados originais para controle de mudanças
                setOriginalData({
                    title,
                    content,
                    category,
                });
                setOriginalIsPublished(isPublished);
                setFormChanged(false);

                setSuccess("História atualizada com sucesso!");
            } else if (contentType === "chapter") {
                // --- START VALIDATION FOR CHAPTER NUMBER ---
                if (chapterNumber !== originalData.chapter_number) {
                    // Check if the new chapter number already exists in the same series
                    const { data: existingChapter, error: checkError } = await supabase
                        .from("chapters")
                        .select("id")
                        .eq("series_id", seriesId) // Ensure check is within the same series
                        .eq("chapter_number", chapterNumber)
                        .neq("id", id) // Exclude the current chapter being edited
                        .limit(1)
                        .single(); // We only need to know if one exists

                    if (checkError && checkError.code !== 'PGRST116') { // Ignore 'PGRST116' (No rows found)
                        console.error("Erro ao verificar número do capítulo existente:", checkError);
                        throw new Error("Erro ao validar o número do capítulo. Tente novamente.");
                    }

                    if (existingChapter) {
                        throw new Error(`O número de capítulo ${chapterNumber} já está em uso nesta série.`);
                    }
                }
                // --- END VALIDATION FOR CHAPTER NUMBER ---

                // Atualizar capítulo
                const { error } = await supabase
                    .from("chapters")
                    .update({
                        title,
                        content,
                        chapter_number: chapterNumber,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", id);

                if (error) throw error;

                // Atualizar timestamp da série
                if (seriesId) {
                    const { error: updateSeriesError } = await supabase
                        .from("series")
                        .update({ updated_at: new Date().toISOString() })
                        .eq("id", seriesId);

                    if (updateSeriesError) {
                        console.error("Erro ao atualizar timestamp da série:", updateSeriesError);
                    }
                }

                // Atualizar dados originais para controle de mudanças
                setOriginalData({
                    title,
                    content,
                    chapter_number: chapterNumber,
                });
                setFormChanged(false);

                setSuccess("Capítulo atualizado com sucesso!");
            }

            // Atualizar última data de salvamento
            const now = new Date();
            const formattedDate = now.toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
            setLastSaved(formattedDate);

        } catch (err) {
            console.error("Erro ao salvar:", err);
            setError("Não foi possível salvar as alterações");
        } finally {
            setSaving(false);
        }
    };

    const openDeleteModal = () => {
        setDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setDeleteModal(false);
    };

    const handleDelete = async () => {
        setDeleting(true);
        setError(null);

        try {
            if (contentType === "story") {
                // Excluir história
                const { error } = await supabase
                    .from("stories")
                    .delete()
                    .eq("id", id);

                if (error) throw error;

                // Redirecionar para o dashboard
                closeDeleteModal();
                router.push("/dashboard");
            } else if (contentType === "chapter") {
                // Excluir capítulo
                const { error } = await supabase
                    .from("chapters")
                    .delete()
                    .eq("id", id);

                if (error) throw error;

                // Redirecionar para a página da série
                closeDeleteModal();
                router.push(`/series/${seriesId}`);
            }
        } catch (err) {
            console.error(`Erro ao excluir ${contentType}:`, err);
            setError(`Não foi possível excluir ${contentType === "story" ? "a história" : "o capítulo"}`);
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className={contentType === "chapter" ? "chapter-editor-container" : "story-editor-container"}>
                <div className="back-dashboard">
                    <Link href="/dashboard" className="back-link">
                        <ArrowLeft size={16} />
                        Voltar para o dashboard
                    </Link>
                </div>
                <div className="loading-container">
                    <div className="loader-large"></div>
                    <p>Carregando conteúdo...</p>
                </div>
            </div>
        );
    }

    if (contentType === "story") {
        return (
            <div className="story-editor-container">
                <div className="back-dashboard">
                    <Link href="/dashboard" className="back-link">
                        <ArrowLeft size={16} />
                        Voltar para o dashboard
                    </Link>
                </div>

                {success && (
                    <div className="story-message success">
                        <CheckCircle2 size={18} />
                        {success}
                    </div>
                )}

                {error && (
                    <div className="story-message error">
                        <AlertTriangle size={18} />
                        {error}
                    </div>
                )}

                <div className="story-editor-header">
                    <h1>Editar História</h1>
                    <div className="story-editor-subtitle">
                        Última atualização: {lastSaved}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="story-editor-form">
                    <div className="story-form-grid">
                        <div className="story-form-group">
                            <label htmlFor="title">Título da História</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    setFormChanged(true);
                                }}
                                className="story-input"
                                placeholder="Digite o título da história"
                                required
                            />
                        </div>

                        <div className="story-form-group">
                            <label htmlFor="category">Categoria</label>
                            <select
                                id="category"
                                name="category"
                                value={category}
                                onChange={(e) => {
                                    setCategory(e.target.value);
                                    setFormChanged(true);
                                }}
                                className="story-select"
                                required={isPublished}
                            >
                                <option value="">Selecione uma categoria</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="story-editor-wrapper">
                        <TipTapEditor
                            content={content}
                            onChange={(html) => {
                                setContent(html);
                                setFormChanged(true);
                                
                                // Calcular estatísticas
                                const text = html.replace(/<[^>]*>/g, "");
                                const words = text.trim().split(/\s+/).length;
                                const chars = text.length;
                                const readTime = Math.max(1, Math.round(words / 200));
                                
                                setWordCount(words);
                                setCharCount(chars);
                                setReadingTime(readTime);
                            }}
                        />

                        <div className="story-editor-stats">
                            <div className="story-stat">
                                <FileText size={14} /> {wordCount} palavras
                            </div>
                            <div className="story-stat">
                                <Clock size={14} /> {readingTime} min leitura
                            </div>
                        </div>
                    </div>

                    <div className="story-publish-options">
                        <label className="story-checkbox-label">
                            <input
                                type="checkbox"
                                checked={isPublished}
                                onChange={(e) => {
                                    setIsPublished(e.target.checked);
                                    setFormChanged(true);
                                }}
                            />
                            <span>Publicar história</span>
                        </label>
                        <p className="story-publish-hint">
                            {isPublished
                                ? "Sua história será visível para todos os usuários"
                                : "Sua história ficará salva como rascunho e visível apenas para você"}
                        </p>
                    </div>

                    <div className="story-actions">
                        <button
                            type="button"
                            onClick={() => setDeleteModal(true)}
                            className="story-btn story-btn-danger"
                        >
                            <Trash2 size={16} />
                            Excluir História
                        </button>

                        <Link
                            href={`/story/${generateSlug(title, id)}`}
                            className="story-btn story-btn-secondary"
                            target="_blank"
                        >
                            <Eye size={16} />
                            Visualizar
                        </Link>

                        <button
                            type="submit"
                            className="story-btn story-btn-primary"
                            disabled={saving || !formChanged}
                        >
                            {saving ? (
                                <>
                                    <span className="btn-spinner">
                                        <RefreshCw size={16} />
                                    </span>
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <DeleteModal
                    isOpen={deleteModal}
                    title="Excluir História"
                    message="Tem certeza de que deseja excluir esta história? Esta ação não pode ser desfeita."
                    confirmLabel="Excluir"
                    cancelLabel="Cancelar"
                    isDeleting={deleting}
                    onCancel={() => setDeleteModal(false)}
                    onConfirm={handleDelete}
                />
            </div>
        );
    } else {
        return (
            <div className="chapter-editor-container">
                <div className="back-dashboard">
                    <Link href="/dashboard" className="back-link">
                        <ArrowLeft size={16} />
                        Voltar para o dashboard
                    </Link>
                </div>

                {success && (
                    <div className="story-message success">
                        <CheckCircle2 size={18} />
                        {success}
                    </div>
                )}

                {error && (
                    <div className="story-message error">
                        <AlertTriangle size={18} />
                        {error}
                    </div>
                )}

                <div className="chapter-editor-header">
                    <h1>Editar Capítulo</h1>
                    <div className="chapter-editor-subtitle">
                        Última atualização: {lastSaved}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="story-editor-form">
                    <div className="chapter-form-group">
                        <label htmlFor="title">Título do Capítulo</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setFormChanged(true);
                            }}
                            className="chapter-input"
                            placeholder="Digite o título do capítulo"
                            required
                        />
                    </div>

                    <div className="chapter-form-group">
                        <label htmlFor="chapterNumber">Número do Capítulo</label>
                        <input
                            type="number"
                            id="chapterNumber"
                            name="chapterNumber"
                            value={chapterNumber}
                            onChange={(e) => {
                                setChapterNumber(parseInt(e.target.value) || 1);
                                setFormChanged(true);
                            }}
                            min="1"
                            max={maxChapterNumber + 1}
                            className="chapter-input"
                        />
                    </div>

                    <div className="chapter-editor-wrapper">
                        <TipTapEditor
                            content={content}
                            onChange={(html) => {
                                setContent(html);
                                setFormChanged(true);
                                
                                // Calcular estatísticas
                                const text = html.replace(/<[^>]*>/g, "");
                                const words = text.trim().split(/\s+/).length;
                                const chars = text.length;
                                const readTime = Math.max(1, Math.round(words / 200));
                                
                                setWordCount(words);
                                setCharCount(chars);
                                setReadingTime(readTime);
                            }}
                        />

                        <div className="chapter-editor-stats">
                            <div className="story-stat">
                                <FileText size={14} /> {wordCount} palavras
                            </div>
                            <div className="story-stat">
                                <Clock size={14} /> {readingTime} min leitura
                            </div>
                        </div>
                    </div>

                    <div className="chapter-actions">
                        {series && (
                            <Link
                                href={`/series/${series.id}`}
                                className="chapter-btn chapter-btn-secondary"
                            >
                                <BookOpen size={16} />
                                Ver Série
                            </Link>
                        )}

                        <button
                            type="button"
                            onClick={() => setDeleteModal(true)}
                            className="chapter-btn chapter-btn-delete"
                        >
                            <Trash2 size={16} />
                            Excluir Capítulo
                        </button>

                        <Link
                            href={`/chapter/${id}`}
                            className="chapter-btn chapter-btn-secondary"
                        >
                            <Eye size={16} />
                            Visualizar
                        </Link>

                        <button
                            type="submit"
                            className="chapter-btn chapter-btn-primary"
                            disabled={saving || !formChanged}
                        >
                            {saving ? (
                                <>
                                    <span className="btn-spinner">
                                        <RefreshCw size={16} />
                                    </span>
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <DeleteModal
                    isOpen={deleteModal}
                    title="Excluir Capítulo"
                    message="Tem certeza de que deseja excluir este capítulo? Esta ação não pode ser desfeita."
                    confirmLabel="Excluir"
                    cancelLabel="Cancelar"
                    isDeleting={deleting}
                    onCancel={() => setDeleteModal(false)}
                    onConfirm={handleDelete}
                />
            </div>
        );
    }
}
