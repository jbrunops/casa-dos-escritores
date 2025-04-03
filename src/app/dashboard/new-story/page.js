"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import TipTapEditor from "@/components/TipTapEditor";
import Link from "next/link";
import {
    ArrowLeft,
    Save,
    Send,
    AlertTriangle,
    CheckCircle2,
    FileText,
    Clock,
    BookOpen,
} from "lucide-react";
import { generateSlug } from "@/lib/utils";

export default function NewStoryPage() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [publishing, setPublishing] = useState(false);
    const [savingAsDraft, setSavingAsDraft] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formTouched, setFormTouched] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [readingTime, setReadingTime] = useState(0);

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

    // Detectar mudanças no formulário
    useEffect(() => {
        if (title || content || category) {
            setFormTouched(true);
        }
    }, [title, content, category]);

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

    const handleSubmit = async (e, isDraft = false) => {
        e.preventDefault();

        if (!title.trim()) {
            setError("Por favor, adicione um título para sua história");
            return;
        }

        if (!isDraft && !content.trim()) {
            setError(
                "O conteúdo da história não pode estar vazio para publicação"
            );
            return;
        }

        if (!isDraft && !category) {
            setError("Por favor, selecione uma categoria para publicação");
            return;
        }

        setError(null);
        setSuccess(null);

        if (isDraft) {
            setSavingAsDraft(true);
        } else {
            setPublishing(true);
        }

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

            setSuccess(
                isDraft
                    ? "História salva como rascunho com sucesso!"
                    : "História publicada com sucesso!"
            );

            // Redirecionar após uma breve pausa
            setTimeout(() => {
                if (isDraft) {
                    router.push(`/dashboard`);
                } else {
                    router.push(`/story/${generateSlug(title, data[0].id)}`);
                }
            }, 1000);
        } catch (err) {
            setError(err.message || "Ocorreu um erro ao salvar a história");
            console.error("Erro:", err);
        } finally {
            setPublishing(false);
            setSavingAsDraft(false);
        }
    };

    return (
        <div className="story-editor-container">
            <div className="story-editor-header">
                <h1>Criar Novo Conto</h1>
            </div>

            <div className="back-dashboard">
                <Link href="/dashboard/new" className="back-link">
                    <ArrowLeft size={16} />
                    <span>Voltar à seleção</span>
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

            <form
                onSubmit={(e) => handleSubmit(e, false)}
                className="story-editor-form"
            >
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

                <div className="story-actions">
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        disabled={
                            savingAsDraft || !title.trim() || !formTouched
                        }
                        className="story-btn story-btn-secondary"
                    >
                        {savingAsDraft ? (
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
                                <span>Salvar como Rascunho</span>
                            </>
                        )}
                    </button>
                    <button
                        type="submit"
                        disabled={
                            publishing ||
                            !title.trim() ||
                            !content.trim() ||
                            !category ||
                            !formTouched
                        }
                        className="story-btn story-btn-publish"
                    >
                        {publishing ? (
                            <>
                                <Send
                                    className="story-btn-icon btn-spinner"
                                    size={18}
                                />
                                <span>Publicando...</span>
                            </>
                        ) : (
                            <>
                                <Send className="story-btn-icon" size={18} />
                                <span>Publicar História</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
