"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { ArrowLeft, Save, AlertTriangle, CheckCircle2, Image } from "lucide-react";

export default function EditSeriesPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [genre, setGenre] = useState("");
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState("");
    const [originalCoverUrl, setOriginalCoverUrl] = useState("");
    const [isCompleted, setIsCompleted] = useState(false);
    const [originalIsCompleted, setOriginalIsCompleted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formChanged, setFormChanged] = useState(false);
    const [originalData, setOriginalData] = useState({
        title: "",
        description: "",
        genre: "",
        tags: [],
    });

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

    useEffect(() => {
        async function fetchSeries() {
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

                // Buscar a série
                const { data: series, error } = await supabase
                    .from("series")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) {
                    console.error("Erro ao buscar série:", error);
                    throw error;
                }

                if (!series) {
                    throw new Error("Série não encontrada");
                }

                // Verificar se o usuário é o autor da série
                if (series.author_id !== user.id) {
                    router.push("/dashboard");
                    return;
                }

                // Preencher os campos do formulário
                setTitle(series.title || "");
                setDescription(series.description || "");
                setGenre(series.genre || "");
                setTags(series.tags || []);
                setIsCompleted(series.is_completed || false);
                setOriginalIsCompleted(series.is_completed || false);
                
                if (series.cover_url) {
                    setOriginalCoverUrl(series.cover_url);
                    setCoverPreview(series.cover_url);
                }

                setOriginalData({
                    title: series.title || "",
                    description: series.description || "",
                    genre: series.genre || "",
                    tags: series.tags || [],
                });

                setLoading(false);
            } catch (err) {
                console.error("Erro ao buscar série:", err);
                setError("Não foi possível carregar esta série. Por favor, tente novamente.");
                setLoading(false);
            }
        }

        fetchSeries();
    }, [id, router, supabase]);

    // Detectar alterações no formulário
    useEffect(() => {
        const hasTagsChanged = 
            JSON.stringify(tags.sort()) !== JSON.stringify(originalData.tags.sort());
            
        const hasChanges =
            title !== originalData.title ||
            description !== originalData.description ||
            genre !== originalData.genre ||
            hasTagsChanged ||
            isCompleted !== originalIsCompleted ||
            coverFile !== null;

        setFormChanged(hasChanges);
    }, [
        title,
        description,
        genre,
        tags,
        isCompleted,
        coverFile,
        originalData,
        originalIsCompleted
    ]);

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

    const handleRemoveCover = () => {
        setCoverFile(null);
        setCoverPreview(originalCoverUrl);
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

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) throw new Error("Você precisa estar logado");

            // Upload da capa, se fornecida
            let coverUrl = originalCoverUrl;
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

            // Atualizar série
            const { error } = await supabase
                .from("series")
                .update({
                    title,
                    description,
                    genre,
                    tags,
                    is_completed: isCompleted,
                    cover_url: coverUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id);

            if (error) throw error;

            // Atualizar dados originais para controle de mudanças
            setOriginalData({
                title,
                description,
                genre,
                tags: [...tags],
            });
            setOriginalIsCompleted(isCompleted);
            setOriginalCoverUrl(coverUrl);
            setCoverFile(null);
            
            setFormChanged(false);
            setSuccess("Série atualizada com sucesso!");

            // Redirecionar após alguns segundos
            setTimeout(() => {
                router.push(`/series/${id}`);
            }, 1500);

        } catch (err) {
            setError(err.message || "Ocorreu um erro ao atualizar a série");
            console.error("Erro na atualização da série:", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader-large"></div>
                <p>Carregando série...</p>
            </div>
        );
    }

    return (
        <div className="series-editor-container">
            <div className="series-editor-header">
                <h1>Editar Série</h1>
            </div>

            <div className="back-dashboard">
                <Link href={`/series/${id}`} className="back-link">
                    <ArrowLeft size={16} />
                    <span>Voltar para a série</span>
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
                            <label htmlFor="title">Título da Série</label>
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
                            <label htmlFor="description">Descrição</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="series-textarea"
                                placeholder="Do que se trata a sua série? Descreva para atrair leitores..."
                                rows={4}
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
                                    <option value="">Selecione um gênero</option>
                                    {genres.map((g) => (
                                        <option key={g} value={g}>
                                            {g}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="series-form-group">
                                <label htmlFor="isCompleted">Status da Série</label>
                                <div className="finale-checkbox">
                                    <input
                                        type="checkbox"
                                        id="isCompleted"
                                        checked={isCompleted}
                                        onChange={(e) => setIsCompleted(e.target.checked)}
                                    />
                                    <label htmlFor="isCompleted">
                                        Marcar como concluída
                                    </label>
                                </div>
                                <p className="form-hint">
                                    {isCompleted
                                        ? "Sua série será marcada como finalizada"
                                        : "Sua série aparecerá como 'Em andamento'"}
                                </p>
                            </div>
                        </div>

                        <div className="series-form-group">
                            <label htmlFor="tags">
                                Tags (Até 5 - pressione Enter para adicionar)
                            </label>
                            <input
                                id="tags"
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                className="series-input"
                                placeholder="Adicione tags relevantes..."
                                disabled={tags.length >= 5}
                            />
                            {tags.length >= 5 && (
                                <p className="form-hint">
                                    Você atingiu o limite de 5 tags
                                </p>
                            )}

                            {tags.length > 0 && (
                                <div className="tags-container">
                                    {tags.map((tag) => (
                                        <span key={tag} className="tag">
                                            {tag}
                                            <button
                                                type="button"
                                                className="tag-remove"
                                                onClick={() => handleRemoveTag(tag)}
                                                aria-label="Remover tag"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
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
                                            {coverFile && (
                                                <button
                                                    type="button"
                                                    className="cover-remove-btn"
                                                    onClick={handleRemoveCover}
                                                >
                                                    Cancelar
                                                </button>
                                            )}
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
                                            accept="image/jpeg, image/png, image/gif"
                                            onChange={handleCoverChange}
                                            className="cover-input"
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="form-hint">
                                Uma boa capa ajuda a atrair mais leitores.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="series-actions">
                    <button
                        type="submit"
                        disabled={saving || !formChanged}
                        className="series-btn series-btn-primary"
                    >
                        {saving ? (
                            <span>Salvando...</span>
                        ) : (
                            <span>Salvar Alterações</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
} 