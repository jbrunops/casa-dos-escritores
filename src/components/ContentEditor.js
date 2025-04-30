"use client";

import { useState, useEffect, useRef } from "react";
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
    Book,
    Image,
    UploadCloud,
    Loader2
} from "lucide-react";
import { defaultCategories } from "@/lib/categories";

export default function ContentEditor({
    type = "story", // "story", "series", "chapter"
    title = "",
    content = "",
    description = "",
    category = "",
    seriesId = null,
    onBack = null,
    onSubmit = null,
    backPath = "/dashboard",
    backLabel = "Voltar ao Dashboard",
    headerTitle = "Criar Novo Conteúdo",
    requireCategory = true,
    existingId = null, // ID da história/série/capítulo existente em modo de edição
    coverUrl = "" // URL da capa existente para séries em modo de edição
}) {
    // Estados comuns
    const [currentTitle, setCurrentTitle] = useState(title);
    const [currentContent, setCurrentContent] = useState(content);
    const [currentCategory, setCurrentCategory] = useState(category);
    const [currentDescription, setCurrentDescription] = useState(description);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formTouched, setFormTouched] = useState(false);
    
    // Estatísticas do texto
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [readingTime, setReadingTime] = useState(0);
    
    // Estados específicos para séries
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(coverUrl);
    
    // Estados específicos para capítulos
    const [chapterNumber, setChapterNumber] = useState(1);
    const [loadingChapterNumber, setLoadingChapterNumber] = useState(false);
    const [series, setSeries] = useState(null);
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const supabase = createBrowserClient();

    // Usa a lista importada de categorias
    const categories = defaultCategories;

    // Determinar se estamos em modo de edição baseado na presença de um ID existente
    const isEditingModeRef = useRef(!!existingId);

    // Detectar mudanças no formulário
    useEffect(() => {
        if (type === "story" || type === "chapter") {
            if (currentTitle || currentContent || currentCategory) {
                setFormTouched(true);
            }
        } else if (type === "series") {
            if (currentTitle || currentDescription || currentCategory || tags.length > 0 || coverFile) {
                setFormTouched(true);
            }
        }
    }, [currentTitle, currentContent, currentCategory, currentDescription, tags, coverFile, type]);

    // Atualizar estatísticas de texto
    useEffect(() => {
        if (currentContent) {
            // Remover tags HTML para contagem precisa
            const plainText = currentContent.replace(/<[^>]*>/g, "");
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
    }, [currentContent]);

    // Buscar o próximo número do capítulo quando for criar um novo capítulo
    useEffect(() => {
        const fetchNextChapterNumber = async () => {
            if (type === 'chapter' && seriesId && !isEditingModeRef.current) { // Apenas para criação
                setLoadingChapterNumber(true);
                try {
                    const { data: lastChapter, error } = await supabase
                        .from('chapters')
                        .select('chapter_number')
                        .eq('series_id', seriesId)
                        .order('chapter_number', { ascending: false })
                        .limit(1)
                        .single();

                    if (error && error.code !== 'PGRST116') { // Ignora erro 'No rows found'
                        throw error;
                    }

                    const nextNumber = lastChapter ? lastChapter.chapter_number + 1 : 1;
                    setChapterNumber(nextNumber);

                } catch (err) {
                    console.error("Erro ao buscar próximo número do capítulo:", err);
                    setError("Não foi possível determinar o número do próximo capítulo.");
                    // Manter 1 como fallback ou considerar outra estratégia
                } finally {
                    setLoadingChapterNumber(false);
                }
            }
        };

        fetchNextChapterNumber();
    }, [type, seriesId, supabase, isEditingModeRef]);

    // Carregar dados existentes ao inicializar em modo de edição
    useEffect(() => {
        const fetchExistingData = async () => {
            if (existingId && isEditingModeRef.current) {
                setLoading(true);
                try {
                    let data;
                    
                    if (type === "series") {
                        // Buscar dados da série existente
                        const { data: seriesData, error } = await supabase
                            .from("series")
                            .select("*")
                            .eq("id", existingId)
                            .single();
                        
                        if (error) throw error;
                        data = seriesData;
                        
                        // Preencher os campos do formulário
                        setCurrentTitle(data.title || "");
                        setCurrentDescription(data.description || "");
                        setCurrentCategory(data.genre || "");
                        setTags(data.tags || []);
                        
                        // Configurar preview da capa se existir
                        if (data.cover_url) {
                            setCoverPreview(data.cover_url);
                        }
                    }
                    else if (type === "story") {
                        // Buscar dados da história existente
                        const { data: storyData, error } = await supabase
                            .from("stories")
                            .select("*")
                            .eq("id", existingId)
                            .single();
                        
                        if (error) throw error;
                        data = storyData;
                        
                        // Preencher os campos do formulário
                        setCurrentTitle(data.title || "");
                        setCurrentContent(data.content || "");
                        setCurrentCategory(data.category || "");
                    }
                    else if (type === "chapter") {
                        // Buscar dados do capítulo existente
                        const { data: chapterData, error } = await supabase
                            .from("chapters")
                            .select("*")
                            .eq("id", existingId)
                            .single();
                        
                        if (error) throw error;
                        data = chapterData;
                        
                        // Preencher os campos do formulário
                        setCurrentTitle(data.title || "");
                        setCurrentContent(data.content || "");
                        setChapterNumber(data.chapter_number || 1);
                    }
                    
                    // Resetar o estado de "formulário tocado" após carregamento
                    setFormTouched(false);
                } catch (err) {
                    console.error("Erro ao carregar dados existentes:", err);
                    setError("Não foi possível carregar os dados existentes. Por favor, tente novamente.");
                } finally {
                    setLoading(false);
                }
            }
        };
        
        fetchExistingData();
    }, [existingId, type, supabase]);

    // Manipuladores de eventos específicos para séries
    const handleCoverChange = (e) => {
        if (type !== "series") return;
        
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
        if (type !== "series") return;
        
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
        if (type !== "series") return;
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    // Função para validar o formulário
    const validateForm = () => {
        if (!currentTitle.trim()) {
            setError(`Por favor, adicione um título para ${type === "story" ? "sua história" : type === "series" ? "sua série" : "o capítulo"}`);
            return false;
        }

        if ((type === "story" || type === "chapter") && !currentContent.trim()) {
            setError(`O conteúdo ${type === "story" ? "da história" : "do capítulo"} não pode estar vazio`);
            return false;
        }

        if (requireCategory && !currentCategory && (type === "story" || type === "series")) {
            setError(`Por favor, selecione uma categoria para ${type === "story" ? "a história" : "a série"}`);
            return false;
        }

        return true;
    };

    // Função principal de envio do formulário
    const handleSubmit = async (e, isDraft = false) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setError(null);
        setSuccess(null);

        if (isDraft) {
            setSaving(true);
        } else {
            setPublishing(true);
        }

        try {
            // Se um callback de envio personalizado foi fornecido, use-o
            if (onSubmit) {
                await onSubmit({
                    title: currentTitle,
                    content: currentContent,
                    category: currentCategory,
                    description: currentDescription,
                    tags,
                    coverFile,
                    chapterNumber,
                    isDraft,
                    seriesId,
                    id: existingId, // Passar o ID existente para o callback saber que é uma edição
                    isEditing: isEditingModeRef.current
                });
                return;
            }

            // Implementação padrão se nenhum callback for fornecido
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) throw new Error("Você precisa estar logado");

            // Lógica baseada no tipo de conteúdo
            if (type === "story") {
                if (isEditingModeRef.current) {
                    // Atualizar história existente
                    const { error } = await supabase
                        .from("stories")
                        .update({
                            title: currentTitle,
                            content: currentContent,
                            category: currentCategory || "Sem categoria",
                            updated_at: new Date().toISOString(),
                            is_published: !isDraft,
                        })
                        .eq("id", existingId);

                    if (error) throw error;

                    setSuccess("História atualizada com sucesso!");

                    // Redirecionar após uma breve pausa
                    setTimeout(() => {
                        if (isDraft) {
                            router.push(`/dashboard`);
                        } else {
                            router.push(`/story/${existingId}`);
                        }
                    }, 1500);
                } else {
                    // Criar nova história
                    const { data, error } = await supabase
                        .from("stories")
                        .insert({
                            title: currentTitle,
                            content: currentContent,
                            category: currentCategory || "Sem categoria",
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
                            router.push(`/story/${data[0].id}`);
                        }
                    }, 1500);
                }
            }
            else if (type === "series") {
                // Upload da capa, se fornecida
                let newCoverUrl = coverUrl; // Manter a URL existente por padrão
                
                if (coverFile) {
                    try {
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
                        newCoverUrl = data.url;
                        
                        if (!newCoverUrl) {
                            throw new Error("Não foi possível obter URL da imagem");
                        }
                    } catch (uploadErr) {
                        console.error("Erro no upload da capa:", uploadErr);
                        setError(`Erro no upload da imagem: ${uploadErr.message}`);
                        setSaving(false);
                        setPublishing(false);
                        return;
                    }
                }

                if (isEditingModeRef.current) {
                    // Atualizar série existente
                    const { error } = await supabase
                        .from("series")
                        .update({
                            title: currentTitle,
                            description: currentDescription,
                            genre: currentCategory,
                            tags,
                            cover_url: newCoverUrl,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", existingId);

                    if (error) throw error;

                    setSuccess("Série atualizada com sucesso!");

                    // Redirecionar após breve pausa
                    setTimeout(() => {
                        router.push(`/series/${existingId}`);
                    }, 1500);
                } else {
                    // Criar série nova
                    const { data, error } = await supabase
                        .from("series")
                        .insert({
                            title: currentTitle,
                            description: currentDescription,
                            genre: currentCategory,
                            tags,
                            author_id: user.id,
                            cover_url: newCoverUrl,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        })
                        .select();

                    if (error) throw error;

                    setSuccess("Série criada com sucesso!");

                    // Redirecionar após breve pausa
                    setTimeout(() => {
                        router.push(`/dashboard/new-chapter/${data[0].id}`);
                    }, 1500);
                }
            }
            else if (type === "chapter") {
                if (isEditingModeRef.current) {
                    // Atualizar capítulo existente
                    const { error } = await supabase
                        .from("chapters")
                        .update({
                            title: currentTitle,
                            content: currentContent,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", existingId);

                    if (error) throw error;

                    // Atualizar timestamp da série
                    const { error: updateError } = await supabase
                        .from("series")
                        .update({ updated_at: new Date().toISOString() })
                        .eq("id", seriesId);

                    if (updateError) {
                        console.error("Erro ao atualizar timestamp da série:", updateError);
                    }

                    setSuccess("Capítulo atualizado com sucesso!");

                    // Redirecionar após uma breve pausa
                    setTimeout(() => {
                        router.push(`/series/${seriesId}`);
                    }, 1500);
                } else {
                    // Inserir novo capítulo
                    const { data, error } = await supabase
                        .from("chapters")
                        .insert({
                            title: currentTitle,
                            content: currentContent,
                            chapter_number: chapterNumber,
                            series_id: seriesId,
                            author_id: user.id,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        })
                        .select();

                    if (error) throw error;

                    // Atualizar timestamp da série
                    const { error: updateError } = await supabase
                        .from("series")
                        .update({ updated_at: new Date().toISOString() })
                        .eq("id", seriesId);

                    if (updateError) {
                        console.error("Erro ao atualizar timestamp da série:", updateError);
                    }

                    setSuccess("Capítulo criado com sucesso!");

                    // Redirecionar após uma breve pausa
                    setTimeout(() => {
                        router.push(`/series/${seriesId}`);
                    }, 1500);
                }
            }
        } catch (err) {
            setError(err.message || `Ocorreu um erro ao ${isEditingModeRef.current ? 'atualizar' : 'salvar'} ${type === "story" ? "a história" : type === "series" ? "a série" : "o capítulo"}`);
            console.error("Erro:", err);
        } finally {
            setPublishing(false);
            setSaving(false);
        }
    };

    // Determina o texto do botão principal baseado no modo e tipo
    const getSubmitButtonText = () => {
        if (isEditingModeRef.current) {
            return type === 'chapter' ? 'Atualizar Capítulo' : type === 'series' ? 'Atualizar Série' : 'Atualizar História';
        } else {
            return type === 'chapter' ? 'Publicar Capítulo' : type === 'series' ? 'Publicar Série' : 'Publicar História';
        }
    };
    
    // Determina o ícone do botão principal
    const getSubmitButtonIcon = () => {
        return isEditingModeRef.current ? <Save size={16} className="mr-2" /> : <Send size={16} className="mr-2" />;
    };

    // Renderização do formulário baseada no tipo
    return (
        <div className="max-w-[75rem] mx-auto px-4 sm:px-6 md:px-0 py-8">
            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 size={40} className="animate-spin text-[#484DB5]" />
                    <span className="ml-2 text-lg text-gray-600">Carregando...</span>
                </div>
            ) : (
                <>
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">{headerTitle}</h1>
                    </div>

                    <div className="mb-6">
                        <Link 
                            href={backPath} 
                            className="inline-flex items-center text-[#484DB5] hover:text-opacity-80 transition-all duration-200"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            <span>{backLabel}</span>
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

                    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                        {/* Seção de título e categoria/gênero - comum a todos os tipos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                    {type === "story" ? "Título da História" : type === "series" ? "Título da Série" : "Título do Capítulo"}*
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    value={currentTitle}
                                    onChange={(e) => setCurrentTitle(e.target.value)}
                                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                                    placeholder={`Um título cativante para ${type === "story" ? "sua história" : type === "series" ? "sua série" : "seu capítulo"}...`}
                                    required
                                />
                            </div>

                            {(type === "story" || type === "series") && (
                                <div className="space-y-2">
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                        {type === "story" ? "Categoria" : "Gênero"}
                                        {requireCategory && "*"}
                                    </label>
                                    <select
                                        id="category"
                                        value={currentCategory}
                                        onChange={(e) => setCurrentCategory(e.target.value)}
                                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                                        required={requireCategory}
                                    >
                                        <option value="">Selecione uma {type === "story" ? "categoria" : "gênero"}</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Número do Capítulo (Apenas para tipo 'chapter') */}
                            {type === "chapter" && (
                               <div className="space-y-2">
                                    <label htmlFor="chapterNumber" className="block text-sm font-medium text-gray-700">
                                        Número do Capítulo*
                                    </label>
                                    {
                                        // Se estiver criando (não editando) e carregando o número
                                        !isEditingModeRef.current && loadingChapterNumber ? (
                                            <div className="flex items-center text-gray-500 h-10 px-3 border border-[#E5E7EB] rounded-md bg-gray-100">
                                                <Loader2 className="animate-spin mr-2" size={16} />
                                                Buscando próximo número...
                                            </div>
                                        ) : (
                                            // Se estiver criando (e já carregou) ou editando
                                            <input
                                                id="chapterNumber"
                                                type="number"
                                                min="1"
                                                value={chapterNumber} // Usa o estado chapterNumber
                                                // Se estiver criando, é readOnly. Se editando, também (gerenciado automaticamente)
                                                readOnly
                                                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200 bg-gray-100 cursor-not-allowed"
                                                required
                                            />
                                        )
                                    }
                                    <p className="text-xs text-gray-500">
                                        {isEditingModeRef.current
                                            ? "O número do capítulo não pode ser alterado."
                                            : "Este número é determinado automaticamente com base nos capítulos existentes."}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Campos específicos para séries */}
                        {type === "series" && (
                            <>
                                <div className="space-y-2">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                        Descrição da Série
                                    </label>
                                    <textarea
                                        id="description"
                                        value={currentDescription}
                                        onChange={(e) => setCurrentDescription(e.target.value)}
                                        className="w-full h-32 px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                                        placeholder="Descreva sua série em alguns parágrafos..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tags (até 5)
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#484DB5]/10 text-[#484DB5]"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="ml-2 text-[#484DB5] hover:text-opacity-70"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                                        placeholder="Digite uma tag e pressione Enter"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Digite uma tag e pressione Enter para adicionar. Máximo de 5 tags.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Imagem de Capa
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <div className="relative w-40 h-40 border-2 border-dashed border-[#E5E7EB] rounded-lg flex flex-col items-center justify-center overflow-hidden">
                                            {coverPreview ? (
                                                <img
                                                    src={coverPreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="text-center p-4 flex flex-col items-center">
                                                    <Image
                                                        size={32}
                                                        className="text-gray-400 mb-2"
                                                    />
                                                    <span className="text-sm text-gray-500">
                                                        Prévia da imagem
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                id="cover"
                                                accept="image/jpeg,image/png,image/gif"
                                                onChange={handleCoverChange}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="cover"
                                                className="h-10 px-4 inline-flex items-center cursor-pointer bg-white border border-[#E5E7EB] rounded-md text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
                                            >
                                                Selecionar imagem
                                            </label>
                                            <p className="text-xs text-gray-500 mt-2">
                                                JPG, PNG ou GIF. Tamanho máximo de 2MB.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Editor de conteúdo - apenas para histórias e capítulos */}
                        {(type === "story" || type === "chapter") && (
                            <div className="space-y-2">
                                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                                    Conteúdo*
                                </label>
                                <div className="border border-[#E5E7EB] rounded-md overflow-hidden">
                                    <TipTapEditor
                                        value={currentContent}
                                        onChange={setCurrentContent}
                                        placeholder={`Comece a escrever ${type === "story" ? "sua história" : "seu capítulo"} aqui... Deixe sua imaginação fluir!`}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <FileText size={16} className="mr-1" />
                                        <span>{wordCount} palavras</span>
                                    </div>
                                    <div className="flex items-center">
                                        <BookOpen size={16} className="mr-1" />
                                        <span>{charCount} caracteres</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock size={16} className="mr-1" />
                                        <span>{readingTime} min. de leitura</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Botões de ação - comum a todos os tipos */}
                        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-[#E5E7EB]">
                            {/* Botão de salvar como rascunho - apenas para histórias */}
                            {type === "story" && (
                                <button
                                    type="button"
                                    onClick={(e) => handleSubmit(e, true)}
                                    disabled={saving || !currentTitle.trim() || !formTouched}
                                    className="h-10 px-4 flex items-center justify-center border border-[#E5E7EB] rounded-md text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-t-[#484DB5] border-r-[#E5E7EB] border-b-[#E5E7EB] border-l-[#E5E7EB] rounded-full animate-spin mr-2"></div>
                                    ) : (
                                        <Save size={18} className="mr-2" />
                                    )}
                                    <span>Salvar como rascunho</span>
                                </button>
                            )}

                            {/* Botão de publicar/criar */}
                            <button
                                type="submit"
                                disabled={
                                    publishing || 
                                    !currentTitle.trim() || 
                                    !formTouched || 
                                    (requireCategory && !currentCategory && (type === "story" || type === "series")) ||
                                    ((type === "story" || type === "chapter") && !currentContent.trim())
                                }
                                className="h-10 px-4 flex items-center justify-center bg-[#484DB5] text-white rounded-md hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {publishing ? (
                                    <div className="w-5 h-5 border-2 border-t-white border-r-[#484DB5] border-b-[#484DB5] border-l-[#484DB5] rounded-full animate-spin mr-2"></div>
                                ) : (
                                    <span className="flex items-center">
                                        {getSubmitButtonIcon()}
                                        {getSubmitButtonText()}
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
} 