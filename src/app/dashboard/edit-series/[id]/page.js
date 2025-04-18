"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { ArrowLeft, Save, AlertTriangle, CheckCircle2, Image, X } from "lucide-react";

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
            <div className="max-w-[75rem] mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-t-[#484DB5] border-r-[#E5E7EB] border-b-[#E5E7EB] border-l-[#E5E7EB] rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-700">Carregando série...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[75rem] mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Editar Série</h1>
            </div>

            <div className="mb-6">
                <Link href={`/series/${id}`} className="inline-flex items-center text-gray-700 hover:text-[#484DB5] transition-colors duration-200">
                    <ArrowLeft size={16} className="mr-1" />
                    <span>Voltar para a série</span>
                </Link>
            </div>

            {error && (
                <div className="flex items-center p-4 mb-6 bg-red-50 text-red-700 rounded-md border border-red-200">
                    <AlertTriangle size={20} className="mr-2" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center p-4 mb-6 bg-green-50 text-green-700 rounded-md border border-green-200">
                    <CheckCircle2 size={20} className="mr-2" />
                    <span>{success}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título da Série</label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#484DB5] focus:border-transparent outline-none transition-all duration-200"
                                placeholder="Um título cativante para sua série..."
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#484DB5] focus:border-transparent outline-none transition-all duration-200 resize-y"
                                placeholder="Do que se trata a sua série? Descreva para atrair leitores..."
                                rows={4}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="genre" className="block text-sm font-medium text-gray-700">Gênero</label>
                                <select
                                    id="genre"
                                    value={genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    className="w-full p-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#484DB5] focus:border-transparent outline-none transition-all duration-200 bg-white"
                                >
                                    <option value="">Selecione um gênero</option>
                                    {genres.map((g) => (
                                        <option key={g} value={g}>
                                            {g}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="isCompleted" className="block text-sm font-medium text-gray-700">Status da Série</label>
                                <div className="flex items-center h-10 space-x-2">
                                    <input
                                        type="checkbox"
                                        id="isCompleted"
                                        checked={isCompleted}
                                        onChange={(e) => setIsCompleted(e.target.checked)}
                                        className="w-4 h-4 text-[#484DB5] border-[#E5E7EB] rounded focus:ring-[#484DB5]"
                                    />
                                    <label htmlFor="isCompleted" className="text-gray-700">
                                        Marcar como concluída
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {isCompleted
                                        ? "Sua série será marcada como finalizada"
                                        : "Sua série aparecerá como 'Em andamento'"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                                Tags (Até 5 - pressione Enter para adicionar)
                            </label>
                            <input
                                id="tags"
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                className="w-full p-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#484DB5] focus:border-transparent outline-none transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                                placeholder="Adicione tags relevantes..."
                                disabled={tags.length >= 5}
                            />
                            {tags.length >= 5 && (
                                <p className="text-xs text-gray-500">
                                    Você atingiu o limite de 5 tags
                                </p>
                            )}

                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.map((tag) => (
                                        <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                            {tag}
                                            <button
                                                type="button"
                                                className="ml-1 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                                onClick={() => handleRemoveTag(tag)}
                                                aria-label="Remover tag"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Capa da Série</label>
                            <div className="border border-[#E5E7EB] rounded-md overflow-hidden">
                                {coverPreview ? (
                                    <div className="relative">
                                        <div className="aspect-[2/3] flex items-center justify-center bg-gray-50">
                                            <img
                                                src={coverPreview}
                                                alt="Preview da capa"
                                                className="h-full w-auto object-contain"
                                                key={coverPreview}
                                            />
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-3 flex justify-center gap-2">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center h-10 px-4 bg-white text-gray-800 rounded-md hover:bg-gray-100 transition-all duration-200"
                                                onClick={() => document.getElementById('coverFileInput').click()}
                                            >
                                                Trocar imagem
                                            </button>
                                            {coverFile && (
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center justify-center h-10 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200"
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
                                            className="hidden"
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="aspect-[2/3] flex flex-col items-center justify-center bg-gray-50 text-gray-500">
                                            <Image size={48} className="mb-2 opacity-30" />
                                            <span className="text-center px-4">
                                                Clique para enviar uma imagem
                                                <br />
                                                <span className="text-xs mt-1 block">JPG, PNG ou GIF • Máx 2MB</span>
                                            </span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/jpeg, image/png, image/gif"
                                            onChange={handleCoverChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">
                                Uma boa capa ajuda a atrair mais leitores.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-[#E5E7EB] flex justify-end">
                    <button
                        type="submit"
                        disabled={saving || !formChanged}
                        className="inline-flex items-center justify-center h-10 px-6 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <span className="flex items-center">
                                <div className="w-4 h-4 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mr-2"></div>
                                Salvando...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <Save size={16} className="mr-2" />
                                Salvar Alterações
                            </span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
} 