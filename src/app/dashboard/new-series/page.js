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
        <div className="max-w-[75rem] mx-auto px-6 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Criar Nova Série</h1>
            </div>

            <div className="mb-6">
                <Link href="/dashboard" className="inline-flex items-center text-[#484DB5] hover:text-opacity-80 transition-all duration-200">
                    <ArrowLeft size={16} className="mr-2" />
                    <span>Voltar ao Dashboard</span>
                </Link>
            </div>

            {error && (
                <div className="flex items-center p-4 mb-6 bg-red-50 text-red-700 rounded-md">
                    <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center p-4 mb-6 bg-green-50 text-green-700 rounded-md">
                    <CheckCircle2 size={20} className="mr-2 flex-shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título da Série*</label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full h-10 px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                                placeholder="Um título cativante para sua série..."
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Sinopse</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                                placeholder="Descreva sua série em algumas linhas..."
                                rows={5}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="genre" className="block text-sm font-medium text-gray-700">Gênero</label>
                                <select
                                    id="genre"
                                    value={genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    className="w-full h-10 px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200 bg-white"
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

                            <div className="space-y-2">
                                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (max. 5)</label>
                                <input
                                    id="tags"
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) =>
                                        setTagInput(e.target.value)
                                    }
                                    onKeyDown={handleAddTag}
                                    className="w-full h-10 px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                                    placeholder="Digite e pressione Enter..."
                                    disabled={tags.length >= 5}
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    Adicione tags para ajudar leitores a
                                    encontrar sua série
                                </div>
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {tags.map((tag, index) => (
                                            <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#484DB5] bg-opacity-10 text-[#484DB5]">
                                                {tag}
                                                <button
                                                    type="button"
                                                    className="ml-1.5 text-[#484DB5] hover:text-opacity-70 transition-colors duration-200"
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

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Capa da Série</label>
                            <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg overflow-hidden">
                                {coverPreview ? (
                                    <div className="relative">
                                        <div className="aspect-[2/3] w-48 mx-auto overflow-hidden rounded-md">
                                            <img
                                                src={coverPreview}
                                                alt="Preview da capa"
                                                className="w-full h-full object-cover"
                                                key={coverPreview}
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300">
                                            <div className="flex space-x-2">
                                                <button
                                                    type="button"
                                                    className="px-3 py-1.5 bg-white text-gray-700 rounded hover:bg-gray-100 transition-colors duration-200"
                                                    onClick={() => document.getElementById('coverFileInput').click()}
                                                >
                                                    Trocar imagem
                                                </button>
                                                <button
                                                    type="button"
                                                    className="px-3 py-1.5 bg-white text-red-600 rounded hover:bg-gray-100 transition-colors duration-200"
                                                    onClick={() => {
                                                        setCoverFile(null);
                                                        setCoverPreview("");
                                                    }}
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        </div>
                                        <input
                                            id="coverFileInput"
                                            type="file"
                                            accept="image/jpeg, image/png, image/gif"
                                            onChange={handleCoverChange}
                                            className="hidden"
                                        />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="aspect-[2/3] w-48 mx-auto flex flex-col items-center justify-center py-12 cursor-pointer border border-[#E5E7EB] border-dashed rounded-md">
                                            <Image size={48} className="text-gray-400 mb-4" />
                                            <span className="text-sm text-gray-500 text-center">
                                                Clique para enviar uma imagem
                                                <br />
                                                <span className="text-xs">JPG, PNG ou GIF • Máx 2MB</span>
                                            </span>
                                        </div>
                                        <input
                                            type="file"
                                            id="cover"
                                            accept="image/jpeg, image/png, image/gif"
                                            onChange={handleCoverChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Arquivos JPG, PNG ou GIF de até 2MB. Proporção
                                ideal: 2:3 (como capas de livros)
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-[#E5E7EB]">
                    <button
                        type="submit"
                        disabled={saving || !title.trim() || !formTouched}
                        className="h-10 px-6 flex items-center justify-center bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#484DB5] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Save
                                    className="mr-2 animate-spin"
                                    size={18}
                                />
                                <span>Criando série...</span>
                            </>
                        ) : (
                            <>
                                <Save className="mr-2" size={18} />
                                <span>Criar Série e Adicionar Capítulos</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
