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
    Book,
    Image
} from "lucide-react";

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
    initialData = null
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
    const [coverPreview, setCoverPreview] = useState("");
    const [currentSeriesType, setCurrentSeriesType] = useState('');
    
    // Estados específicos para capítulos
    const [chapterNumber, setChapterNumber] = useState(1);
    const [series, setSeries] = useState(null);
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const supabase = createBrowserClient();

    // >>> ADICIONAR useEffect para popular estados com initialData <<<
    useEffect(() => {
        if (initialData) {
            console.log("[ContentEditor] Recebido initialData:", initialData);
            setCurrentTitle(initialData.title || '');
            setCurrentContent(initialData.content || '');
            setCurrentDescription(initialData.description || '');
            setCurrentCategory(initialData.category || initialData.genre || ''); // Usa category ou genre
            setTags(initialData.tags || []);
            setCoverPreview(initialData.cover_url || '');
            setCurrentSeriesType(initialData.series_type || '');
            // Definir chapterNumber se for edição de capítulo (embora campo tenha sido removido da UI)
            if (type === 'chapter') {
                setChapterNumber(initialData.chapter_number || 1);
            }
            // Resetar formTouched ao carregar dados iniciais para evitar aviso de saída prematuro
            setFormTouched(false); 
        }
    }, [initialData, type]); // Depende de initialData e type

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
        "Anime",
        "Outros",
    ];

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
                // Passando um objeto com os dados relevantes para a função pai
                const result = await onSubmit({
                    title: currentTitle,
                    content: currentContent,
                    category: currentCategory,
                    description: currentDescription,
                    tags,
                    coverFile,
                    seriesType: currentSeriesType,
                    isDraft,
                    seriesId,
                    // Passa o ID do conteúdo sendo editado, se disponível em initialData
                    id: initialData?.id,
                    // Passa o estado de completude se for edição de série
                    isCompleted: initialData?.is_completed 
                });
                 // Tratar resultado do onSubmit personalizado (opcional, depende da implementação pai)
                if (result && result.success) {
                    setSuccess(result.message);
                } else if (result && !result.success) {
                    setError(result.message || 'Ocorreu um erro no processo.');
                }
                // Não retornar aqui ainda, o finally precisa executar
            } else {
                 // --- REMOVER CÓDIGO MORTO (Lógica de handleSubmit padrão) --- 
                 console.warn("[ContentEditor] onSubmit não foi fornecido. Nenhuma ação padrão será executada.");
                 // A lógica padrão que interagia com Supabase foi REMOVIDA daqui.
            }
        } catch (err) {
            setError(err.message || `Ocorreu um erro ao processar a submissão`);
            console.error("Erro no handleSubmit do ContentEditor:", err);
        } finally {
            setPublishing(false);
            setSaving(false);
        }
    };

    // Renderização do formulário baseada no tipo
    return (
        <div className="max-w-[75rem] mx-auto px-4 sm:px-6 md:px-0 py-8">
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
                </div>

                {/* Campos específicos para séries */}
                {type === "series" && (
                    <>
                        <div className="space-y-2">
                            <label htmlFor="seriesType" className="block text-sm font-medium text-gray-700">
                                Tipo de Obra*
                            </label>
                            <select
                                id="seriesType"
                                value={currentSeriesType}
                                onChange={(e) => setCurrentSeriesType(e.target.value)}
                                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:ring-opacity-50 transition-all duration-200"
                                required
                            >
                                <option value="">Selecione o tipo</option>
                                <option value="livro">Livro</option>
                                <option value="novela">Novela</option>
                                <option value="serie">Série</option> { /* Ou 'Série de TV', etc */}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Como você classifica esta obra em capítulos?
                            </p>
                        </div>

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
                            <Send size={18} className="mr-2" />
                        )}
                        <span>
                            {type === "story" 
                                ? "Publicar História" 
                                : type === "series" 
                                    ? "Criar Série" 
                                    : "Criar Capítulo"}
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
} 