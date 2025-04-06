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
            const { data: { user } } = await supabase.auth.getUser();

            console.log("Usuário autenticado:", user);

            if (!user) throw new Error("Você precisa estar logado");

            // Upload da capa, se fornecida
            let coverUrl = null;
            if (coverFile) {
                try {
                    console.log("Iniciando upload da imagem");
                    
                    // Criar um FormData para enviar o arquivo
                    const formData = new FormData();
                    formData.append('file', coverFile);
                    formData.append('userId', user.id);
                    
                    // Usar fetch para enviar o arquivo para a API
                    const uploadResponse = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    // Log detalhado do resultado
                    console.log("Status da resposta:", uploadResponse.status);
                    
                    if (!uploadResponse.ok) {
                        // Tentar extrair mensagem de erro da resposta
                        let errorMessage = "Erro no upload da imagem";
                        try {
                            const errorData = await uploadResponse.json();
                            errorMessage = errorData.error || errorMessage;
                        } catch (e) {
                            console.error("Erro ao processar resposta de erro:", e);
                        }
                        throw new Error(errorMessage);
                    }
                    
                    // Processar resposta de sucesso
                    const uploadData = await uploadResponse.json();
                    coverUrl = uploadData.url;
                    
                    console.log("URL da imagem:", coverUrl);
                    
                    if (!coverUrl) {
                        throw new Error("Não foi possível obter URL da imagem");
                    }
                    
                    console.log("Upload de imagem bem-sucedido");
                } catch (uploadErr) {
                    console.error("Erro detalhado no upload da capa:", uploadErr);
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
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Criar Nova Série</h1>
            </div>

            <div className="mb-6">
                <Link href="/dashboard" className="inline-flex items-center text-[#484DB5] hover:text-[#3a3e9f]">
                    <ArrowLeft size={16} className="mr-2" />
                    <span>Voltar ao Dashboard</span>
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6 flex items-center">
                    <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative mb-6 flex items-center">
                    <CheckCircle2 size={20} className="mr-2 flex-shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] overflow-hidden">
                <div className="grid md:grid-cols-2 gap-8 p-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Título da Série*
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#484DB5] focus:border-[#484DB5]"
                                placeholder="Um título cativante para sua série..."
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Sinopse
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#484DB5] focus:border-[#484DB5]"
                                placeholder="Descreva sua série em algumas linhas..."
                                rows={5}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="genre" className="block text-sm font-medium text-gray-700">
                                    Gênero
                                </label>
                                <select
                                    id="genre"
                                    value={genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#484DB5] focus:border-[#484DB5]"
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
                                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                                    Tags (max. 5)
                                </label>
                                <input
                                    id="tags"
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) =>
                                        setTagInput(e.target.value)
                                    }
                                    onKeyDown={handleAddTag}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#484DB5] focus:border-[#484DB5]"
                                    placeholder="Digite e pressione Enter..."
                                    disabled={tags.length >= 5}
                                />
                                <p className="text-xs text-gray-500">
                                    Adicione tags para ajudar leitores a
                                    encontrar sua série
                                </p>
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {tags.map((tag, index) => (
                                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f5f5ff] text-[#484DB5]">
                                                {tag}
                                                <button
                                                    type="button"
                                                    className="ml-1.5 text-[#484DB5] hover:text-[#3a3e9f]"
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

                    <div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Capa da Série
                            </label>
                            <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg overflow-hidden">
                                {coverPreview ? (
                                    <div className="relative">
                                        <img
                                            src={coverPreview}
                                            alt="Preview da capa"
                                            className="w-full h-auto object-contain"
                                            key={coverPreview}
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-3 flex justify-between">
                                            <button
                                                type="button"
                                                className="px-3 py-1 bg-white text-gray-800 text-sm rounded hover:bg-gray-100"
                                                onClick={() => document.getElementById('coverFileInput').click()}
                                            >
                                                Trocar imagem
                                            </button>
                                            <button
                                                type="button"
                                                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
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
                                            className="hidden"
                                        />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="p-8 text-center cursor-pointer" onClick={() => document.getElementById('cover').click()}>
                                            <Image className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="mt-2 text-sm text-gray-600">
                                                <span className="font-medium text-[#484DB5] hover:text-[#3a3e9f]">
                                                    Clique para enviar uma imagem
                                                </span>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    JPG, PNG ou GIF • Máx 2MB
                                                </p>
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            id="cover"
                                            accept="image/jpeg, image/png, image/gif"
                                            onChange={handleCoverChange}
                                            className="hidden"
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">
                                Arquivos JPG, PNG ou GIF de até 2MB. Proporção
                                ideal: 2:3 (como capas de livros)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-[#E5E7EB] text-right">
                    <button
                        type="submit"
                        disabled={saving || !title.trim() || !formTouched}
                        className={`inline-flex items-center px-4 py-2 rounded-md text-white ${
                            saving || !title.trim() || !formTouched
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-[#484DB5] hover:bg-[#3a3e9f]"
                        } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#484DB5]`}
                    >
                        {saving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Criando série...</span>
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                <span>Criar Série e Adicionar Capítulos</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
