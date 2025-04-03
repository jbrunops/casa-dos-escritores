"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { ArrowLeft, Save, AlertTriangle, CheckCircle2, Image } from "lucide-react";

export default function NewSeriesPage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [genre, setGenre] = useState("");
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formTouched, setFormTouched] = useState(false);

    const router = useRouter();
    const supabase = createBrowserClient();

    // Lista de gêneros disponíveis
    const genres = [
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
        if (title || description || genre || tags.length > 0 || coverFile) {
            setFormTouched(true);
        }
    }, [title, description, genre, tags, coverFile]);

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Verificar tipo de arquivo
        const validTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!validTypes.includes(file.type)) {
            setError("Tipo de arquivo inválido. Use JPG, PNG ou GIF.");
            return;
        }

        // Verificar tamanho do arquivo (limite de 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError("A imagem deve ter no máximo 2MB.");
            return;
        }

        setCoverFile(file);
        setError(null);

        // Criar preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setCoverPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleAddTag = (e) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            if (tags.length >= 5) {
                setError("Máximo de 5 tags permitido");
                return;
            }
            const newTag = tagInput.trim();
            if (!tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            setError("Por favor, adicione um título para sua série");
            return;
        }

        console.log("Iniciando criação de série", {
            title,
            description,
            genre,
            tags,
        });

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            console.log("Usuário autenticado:", user);

            if (!user) throw new Error("Você precisa estar logado");

            // Upload da capa, se fornecida
            let coverUrl = null;
            if (coverFile) {
                try {
                    // Usar o service client para ignorar RLS
                    // Vamos fazer upload via API route em vez do cliente do browser
                    const formData = new FormData();
                    formData.append('file', coverFile);
                    formData.append('userId', user.id);
                    
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Erro no upload da imagem');
                    }
                    
                    const data = await response.json();
                    coverUrl = data.url;
                    
                    if (!coverUrl) {
                        throw new Error("Não foi possível obter URL da imagem");
                    }
                    
                    console.log("Upload de imagem bem-sucedido:", coverUrl);
                } catch (uploadErr) {
                    console.error("Erro no upload da capa:", uploadErr);
                    setError(`Erro no upload da imagem: ${uploadErr.message}`);
                    setSaving(false);
                    return;
                }
            }

            console.log("Dados a inserir:", {
                title,
                description,
                genre,
                tags,
                author_id: user.id,
                cover_url: coverUrl,
            });

            // Criar série
            const { data, error } = await supabase
                .from("series")
                .insert({
                    title,
                    description,
                    genre,
                    tags,
                    author_id: user.id,
                    cover_url: coverUrl,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select();

            console.log("Resposta da criação:", { data, error });

            if (error) throw error;

            // Verificar se temos dados de retorno
            if (!data || data.length === 0) {
                throw new Error(
                    "Série criada, mas não foi possível obter seu ID"
                );
            }

            const seriesId = data[0].id;
            console.log("ID da série criada:", seriesId);

            setSuccess("Série criada com sucesso!");

            // Redirecionar após breve pausa
            setTimeout(() => {
                router.push(`/dashboard/new-chapter/${seriesId}`);
            }, 1500);
        } catch (err) {
            setError(err.message || "Ocorreu um erro ao criar a série");
            console.error("Erro na criação da série:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="series-editor-container">
            <div className="series-editor-header">
                <h1>Criar Nova Série</h1>
            </div>

            <div className="back-dashboard">
                <Link href="/dashboard" className="back-link">
                    <ArrowLeft size={16} />
                    <span>Voltar ao Dashboard</span>
                </Link>
            </div>

            {error && (
                <div className="series-message error">
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="series-message success">
                    <CheckCircle2 size={20} />
                    <span>{success}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="series-editor-form">
                <div className="series-form-grid">
                    <div className="series-form-column">
                        <div className="series-form-group">
                            <label htmlFor="title">Título da Série*</label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="series-input"
                                placeholder="Um título cativante para sua série..."
                                required
                            />
                        </div>

                        <div className="series-form-group">
                            <label htmlFor="description">Sinopse</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="series-textarea"
                                placeholder="Descreva sua série em algumas linhas..."
                                rows={5}
                            />
                        </div>

                        <div className="series-form-row">
                            <div className="series-form-group">
                                <label htmlFor="genre">Gênero</label>
                                <select
                                    id="genre"
                                    value={genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    className="series-select"
                                >
                                    <option value="">
                                        Selecione um gênero
                                    </option>
                                    {genres.map((g) => (
                                        <option key={g} value={g}>
                                            {g}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="series-form-group">
                                <label htmlFor="tags">Tags (max. 5)</label>
                                <input
                                    id="tags"
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) =>
                                        setTagInput(e.target.value)
                                    }
                                    onKeyDown={handleAddTag}
                                    className="series-input"
                                    placeholder="Digite e pressione Enter..."
                                    disabled={tags.length >= 5}
                                />
                                <div className="form-hint">
                                    Adicione tags para ajudar leitores a
                                    encontrar sua série
                                </div>
                                {tags.length > 0 && (
                                    <div className="tags-container">
                                        {tags.map((tag, index) => (
                                            <span key={index} className="tag">
                                                {tag}
                                                <button
                                                    type="button"
                                                    className="tag-remove"
                                                    onClick={() =>
                                                        handleRemoveTag(tag)
                                                    }
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="series-form-column">
                        <div className="series-form-group">
                            <label>Capa da Série</label>
                            <div className="cover-upload-container">
                                {coverPreview ? (
                                    <div className="cover-preview-container">
                                        <img
                                            src={coverPreview}
                                            alt="Preview da capa"
                                            className="cover-preview"
                                            key={coverPreview}
                                        />
                                        <div className="cover-actions">
                                            <button
                                                type="button"
                                                className="cover-change-btn"
                                                onClick={() => document.getElementById('coverFileInput').click()}
                                            >
                                                Trocar imagem
                                            </button>
                                            <button
                                                type="button"
                                                className="cover-remove-btn"
                                                onClick={() => {
                                                    setCoverFile(null);
                                                    setCoverPreview("");
                                                }}
                                            >
                                                Remover
                                            </button>
                                        </div>
                                        <input
                                            id="coverFileInput"
                                            type="file"
                                            accept="image/jpeg, image/png, image/gif"
                                            onChange={handleCoverChange}
                                            className="cover-input hidden"
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                ) : (
                                    <div className="cover-upload">
                                        <div className="cover-placeholder">
                                            <Image size={48} opacity={0.3} />
                                            <span>
                                                Clique para enviar uma imagem
                                                <br />
                                                <small>JPG, PNG ou GIF • Máx 2MB</small>
                                            </span>
                                        </div>
                                        <input
                                            type="file"
                                            id="cover"
                                            accept="image/jpeg, image/png, image/gif"
                                            onChange={handleCoverChange}
                                            className="cover-input"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="form-hint">
                                Arquivos JPG, PNG ou GIF de até 2MB. Proporção
                                ideal: 2:3 (como capas de livros)
                            </div>
                        </div>
                    </div>
                </div>

                <div className="series-actions">
                    <button
                        type="submit"
                        disabled={saving || !title.trim() || !formTouched}
                        className="series-btn series-btn-primary"
                    >
                        {saving ? (
                            <>
                                <Save
                                    className="series-btn-icon btn-spinner"
                                    size={18}
                                />
                                <span>Criando série...</span>
                            </>
                        ) : (
                            <>
                                <Save className="series-btn-icon" size={18} />
                                <span>Criar Série e Adicionar Capítulos</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
