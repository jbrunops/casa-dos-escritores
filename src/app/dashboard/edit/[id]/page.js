// src/app/dashboard/edit/[id]/page.js
"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

export default function EditStoryPage() {
    const params = useParams();
    const id = params.id;

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
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
    });
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [readingTime, setReadingTime] = useState(0);
    const [lastSaved, setLastSaved] = useState("");

    const router = useRouter();
    const supabase = createBrowserClient();

    // Lista de categorias disponíveis
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

    useEffect(() => {
        async function fetchStory() {
            try {
                // Verificar se o usuário está autenticado
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
                    router.push("/login");
                    return;
                }

                // Buscar a história
                const { data: story, error } = await supabase
                    .from("stories")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;

                // Verificar se o usuário é o autor da história
                if (story.author_id !== user.id) {
                    router.push("/dashboard");
                    return;
                }

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

                // Formatar data da última atualização sem segundos
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

                // Calcular estatísticas de texto
                if (story.content) {
                    // Remover tags HTML para contagem precisa
                    const plainText = story.content.replace(/<[^>]*>/g, "");
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
                }

                setLoading(false);
            } catch (err) {
                console.error("Erro ao buscar história:", err);
                setError(
                    "Não foi possível carregar esta história. Por favor, tente novamente."
                );
                setLoading(false);
            }
        }

        fetchStory();
    }, [id, router]);

    // Detectar alterações no formulário
    useEffect(() => {
        const hasChanges =
            title !== originalData.title ||
            content !== originalData.content ||
            category !== originalData.category ||
            isPublished !== originalIsPublished;

        setFormChanged(hasChanges);

        // Atualizar estatísticas de texto quando o conteúdo muda
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
        }
    }, [
        title,
        content,
        category,
        isPublished,
        originalData,
        originalIsPublished,
    ]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            setError("Por favor, adicione um título para sua história");
            return;
        }

        if (isPublished && !content.trim()) {
            setError(
                "O conteúdo da história não pode estar vazio para publicação"
            );
            return;
        }

        if (isPublished && !category) {
            setError("Por favor, selecione uma categoria para publicação");
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const { error } = await supabase
                .from("stories")
                .update({
                    title,
                    content,
                    category: category || "Sem categoria",
                    is_published: isPublished,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id);

            if (error) throw error;

            // Atualizar estado original e timestamp
            setOriginalData({
                title,
                content,
                category: category || "",
            });
            setOriginalIsPublished(isPublished);

            // Atualizar o timestamp de última edição sem segundos
            const now = new Date();
            const formattedDate = now.toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
            setLastSaved(formattedDate);

            setFormChanged(false);
            setSuccess("História salva com sucesso!");

            // Limpar mensagem de sucesso após alguns segundos
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        } catch (err) {
            setError("Erro ao salvar alterações. Por favor, tente novamente.");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handlePublishToggle = () => {
        setIsPublished(!isPublished);
    };

    const openDeleteModal = () => {
        setDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setDeleteModal(false);
    };

    const handleDeleteStory = async () => {
        setDeleting(true);
        try {
            const { error } = await supabase
                .from("stories")
                .delete()
                .eq("id", id);

            if (error) throw error;

            closeDeleteModal();
            router.push("/dashboard");
        } catch (err) {
            setError(
                "Não foi possível excluir a história. Por favor, tente novamente."
            );
            console.error(err);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader-large"></div>
                <p>Carregando história...</p>
            </div>
        );
    }

    return (
        <div className="story-editor-container">
            <div className="story-editor-header">
                <h1>Editar História</h1>
                <div className="story-editor-subtitle">
                    Última atualização: {lastSaved}
                </div>
            </div>

            <div className="back-dashboard">
                <Link href="/dashboard" className="back-link">
                    <ArrowLeft size={16} />
                    <span>Voltar ao Dashboard</span>
                </Link>
            </div>

            <div className="story-status-area">
                <div className="story-status-indicator">
                    <span className="story-status-label">Status:</span>
                    <span
                        className={`story-status-badge ${
                            isPublished ? "published" : "draft"
                        }`}
                    >
                        {isPublished ? "Publicado" : "Rascunho"}
                    </span>
                </div>
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
                        <label htmlFor="title">Título da História</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="story-input"
                            placeholder="Um título cativante para sua história..."
                            required
                        />
                    </div>

                    <div className="story-form-group">
                        <label htmlFor="category">Categoria</label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
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

                <div className="story-form-group">
                    <label htmlFor="content">Conteúdo</label>
                    <div className="story-editor-wrapper">
                        <TipTapEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Comece a escrever sua história aqui... Deixe sua imaginação fluir!"
                        />
                    </div>
                    <div className="story-editor-stats">
                        <div className="story-stat">
                            <FileText size={16} />
                            <span>{wordCount} palavras</span>
                        </div>
                        <div className="story-stat">
                            <BookOpen size={16} />
                            <span>{charCount} caracteres</span>
                        </div>
                        <div className="story-stat">
                            <Clock size={16} />
                            <span>{readingTime} min. de leitura</span>
                        </div>
                    </div>
                </div>

                <div className="story-actions-mobile">
                    <Link
                        href={`/story/${id}`}
                        className="story-btn story-btn-view"
                        target="_blank"
                    >
                        <Eye className="story-btn-icon" size={18} />
                        <span>Visualizar</span>
                    </Link>
                    <button
                        type="button"
                        onClick={openDeleteModal}
                        className="story-btn story-btn-delete"
                    >
                        <Trash2 className="story-btn-icon" size={18} />
                        <span>Excluir</span>
                    </button>
                    <button
                        type="button"
                        onClick={handlePublishToggle}
                        className={`story-btn ${
                            isPublished
                                ? "story-btn-unpublish"
                                : "story-btn-publish"
                        }`}
                    >
                        <Send className="story-btn-icon" size={18} />
                        <span>
                            {isPublished ? "Colocar em Rascunho" : "Publicar"}
                        </span>
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !title.trim() || !formChanged}
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
                                <span>Salvar Alterações</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Modal de confirmação de exclusão */}
            <DeleteModal
                isOpen={deleteModal}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteStory}
                title={title}
            />
        </div>
    );
}
