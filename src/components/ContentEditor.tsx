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

// --- Exported Interfaces ---
export interface ContentFormData {
    title: string;
    content: string;
    category?: string;
    description?: string;
    tags?: string[];
    coverFile?: File | null;
    seriesType?: string;
    isDraft: boolean;
    seriesId?: string | null;
    id?: string; // ID of the content being edited
    isCompleted?: boolean; // For series editing
}

export interface ContentSubmitResult {
    success: boolean;
    message: string;
    data?: any; // Optional data returned on success
}

// --- Component Props Interface ---
interface ContentEditorProps {
    type?: "story" | "series" | "chapter";
    title?: string;
    content?: string;
    description?: string;
    category?: string;
    seriesId?: string | null;
    onBack?: () => void;
    onSubmit: (formData: ContentFormData) => Promise<ContentSubmitResult>; // Use defined types
    backPath?: string;
    backLabel?: string;
    headerTitle?: string;
    requireCategory?: boolean;
    initialData?: any | null; // Consider defining a more specific type later
    seriesInfo?: { id: string; title: string | null }; // Add seriesInfo prop
}

export default function ContentEditor({
    type = "story", // "story", "series", "chapter"
    title = "",
    content = "",
    description = "",
    category = "",
    seriesId = null,
    onBack = null,
    onSubmit,
    backPath = "/dashboard",
    backLabel = "Voltar ao Dashboard",
    headerTitle = "Criar Novo Conteúdo",
    requireCategory = true,
    initialData = null,
    seriesInfo // Destructure seriesInfo
}: ContentEditorProps) {
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
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (type !== "series" || !e.target.files) return;

        const file = e.target.files[0];
        if (!file) return;

        // Verificar tipo de arquivo
        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]; // Added webp
        if (!validTypes.includes(file.type)) {
            setError("Tipo de arquivo inválido. Use JPG, PNG, GIF ou WEBP.");
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
        reader.onload = (ev: ProgressEvent<FileReader>) => {
            // Check if result is a string before setting state
            if (typeof ev.target?.result === 'string') {
                setCoverPreview(ev.target.result);
            } else {
                 console.error("FileReader result is not a string:", ev.target?.result);
                 // Handle ArrayBuffer case if needed, or show error
                 setError("Erro ao ler preview da imagem.");
            }
        };
         reader.onerror = (error) => {
            console.error("FileReader error:", error);
            setError("Erro ao carregar preview da imagem.");
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

    // Função principal de envio do formulário (agora privada à submissão do form)
    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>, isDraft = false) => {
        e.preventDefault(); // Prevent default only when called by form onSubmit
        await submitContent(isDraft);
    };

    // Função wrapper para o botão Salvar Rascunho
    const handleSaveDraft = async () => {
        // Não precisa prevenir default aqui, pois é um botão type="button"
        await submitContent(true); // Force isDraft = true
    };

    // Lógica de submissão isolada
    const submitContent = async (isDraft: boolean) => {
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
            const formData: ContentFormData = {
                title: currentTitle,
                content: currentContent,
                category: currentCategory,
                description: currentDescription,
                tags,
                coverFile,
                seriesType: currentSeriesType,
                isDraft,
                seriesId,
                id: initialData?.id,
                isCompleted: initialData?.is_completed,
            };

            const result = await onSubmit(formData);

            if (result && result.success) {
                setSuccess(result.message);
                setFormTouched(false);
            } else if (result) {
                setError(result.message);
            }

        } catch (err: any) {
             console.error("Erro ao submeter conteúdo:", err);
             setError(err.message || "Ocorreu um erro desconhecido ao submeter.");
         } finally {
            setSaving(false);
            setPublishing(false);
        }
    };

    // Manipulador de retorno (usa onBack ou rota padrão)
    const handleBack = (e) => {
        e.preventDefault();
        if (onBack) {
            onBack();
        } else {
            router.push(backPath);
        }
    };

    // Aviso de saída se o formulário foi tocado
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (formTouched && (saving || publishing)) {
                // Permite sair se estiver salvando/publicando
                return;
            }
            if (formTouched && !success) { // Apenas avisa se não houve sucesso
                e.preventDefault();
                e.returnValue = "Você tem alterações não salvas. Deseja realmente sair?";
                return e.returnValue;
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [formTouched, saving, publishing, success]); // Re-anexar se o estado de toque/salvamento mudar

    // Busca detalhes da série se for editor de capítulo
    useEffect(() => {
        const fetchSeriesDetails = async () => {
            if (type === 'chapter' && seriesId) {
                setLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('series')
                        .select('title, id')
                        .eq('id', seriesId)
                        .single();
                    
                    if (error) throw error;
                    setSeries(data); // Armazena detalhes da série
                } catch (err) {
                    console.error("Erro ao buscar detalhes da série:", err);
                    setError("Não foi possível carregar os detalhes da série associada.");
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchSeriesDetails();
    }, [type, seriesId, supabase]);

    // --- Renderização --- 

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-md border border-gray-200">
            {/* Cabeçalho */} 
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div>
                    <button 
                        onClick={handleBack}
                        className="flex items-center text-gray-600 hover:text-primary mb-2 sm:mb-0"
                    >
                        <ArrowLeft size={18} className="mr-1" />
                        {backLabel}
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">{headerTitle}</h1>
                    {type === 'chapter' && series && (
                        <p className="text-sm text-gray-500 mt-1">
                            Capítulo da série: <Link href={`/series/${series.id}`} className="text-primary hover:underline">{series.title}</Link>
                        </p>
                    )}
                </div>
                <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                    {/* Botão Salvar Rascunho */} 
                    <button
                        type="button"
                        onClick={handleSaveDraft} // Chamar handleSaveDraft
                        disabled={saving || publishing}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={16} className="mr-1.5" />
                        {saving ? "Salvando..." : "Salvar Rascunho"}
                    </button>
                    {/* Botão Publicar */} 
                    <button
                        type="submit" // Este botão submete o form, chamando handleFormSubmit(e, false)
                        disabled={saving || publishing}
                        className="flex items-center px-3 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={16} className="mr-1.5" />
                        {publishing ? "Publicando..." : (initialData ? "Atualizar e Publicar" : "Publicar")}
                    </button>
                </div>
            </div>

            {/* Mensagens de Erro/Sucesso */} 
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md flex items-center">
                    <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-md flex items-center">
                    <CheckCircle2 size={18} className="mr-2 flex-shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            {/* Formulário */} 
            <form onSubmit={(e) => handleFormSubmit(e, false)} className="space-y-6">
                {/* Título */} 
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Título {type === "story" ? "da História" : type === "series" ? "da Série" : "do Capítulo"}
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={currentTitle}
                        onChange={(e) => setCurrentTitle(e.target.value)}
                        placeholder={`Digite o título ${type === "story" ? "da sua história" : type === "series" ? "da sua série" : "do capítulo"}...`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        required
                    />
                </div>

                {/* Editor de Conteúdo (para história e capítulo) */} 
                {(type === "story" || type === "chapter") && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo</label>
                        <TipTapEditor
                            value={currentContent}
                            content={currentContent}
                            onChange={setCurrentContent}
                            placeholder={`Comece a escrever ${type === "story" ? "sua história" : "o capítulo"} aqui...`}
                        />
                        <div className="flex justify-end space-x-4 text-xs text-gray-500 mt-2 pr-1">
                            <span><FileText size={12} className="inline mr-1"/>{charCount} Caracteres</span>
                            <span><Book size={12} className="inline mr-1"/>{wordCount} Palavras</span>
                            <span><Clock size={12} className="inline mr-1"/>~{readingTime} min leitura</span>
                        </div>
                    </div>
                )}

                 {/* Descrição (apenas para séries) */} 
                {type === "series" && (
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição / Sinopse
                        </label>
                        <textarea
                            id="description"
                            rows={4}
                            value={currentDescription}
                            onChange={(e) => setCurrentDescription(e.target.value)}
                            placeholder="Descreva sua série, incluindo a sinopse..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary resize-none"
                        />
                    </div>
                )}
                
                {/* Categoria/Gênero e Tipo de Série (condicional) */} 
                {(type === "story" || type === "series") && (
                     <div className={`grid ${type === 'series' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                         {/* Categoria/Gênero */} 
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                {type === "story" ? "Categoria" : "Gênero"}
                            </label>
                            <select
                                id="category"
                                value={currentCategory}
                                onChange={(e) => setCurrentCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white"
                                required={requireCategory}
                            >
                                <option value="" disabled>Selecione {type === "story" ? "uma categoria" : "um gênero"}</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        {/* Tipo de Série (apenas para séries) */} 
                        {type === 'series' && (
                             <div>
                                <label htmlFor="seriesType" className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Série
                                </label>
                                <select
                                    id="seriesType"
                                    value={currentSeriesType}
                                    onChange={(e) => setCurrentSeriesType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white"
                                    required // Tipo de série é geralmente obrigatório
                                >
                                    <option value="" disabled>Selecione o tipo</option>
                                    <option value="novel">Novel</option>
                                    <option value="comic">Quadrinho/Mangá</option>
                                    {/* Adicione mais tipos conforme necessário */}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {/* Tags (apenas para séries) */} 
                {type === "series" && (
                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                            Tags (até 5, pressione Enter para adicionar)
                        </label>
                        <input
                            type="text"
                            id="tags"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                            placeholder="Ex: Ação, Drama, Magia..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary mb-2"
                        />
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="ml-1.5 flex-shrink-0 text-indigo-400 hover:text-indigo-500 focus:outline-none"
                                    >
                                        <span className="sr-only">Remover {tag}</span>
                                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                            <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                                        </svg>
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                 {/* Upload de Capa (apenas para séries) */} 
                {type === "series" && (
                    <div>
                        <label htmlFor="cover" className="block text-sm font-medium text-gray-700 mb-1">
                            Capa da Série (Opcional, JPG/PNG/GIF, max 2MB)
                        </label>
                        <div className="mt-1 flex items-center space-x-4">
                            <div className="flex-shrink-0 h-20 w-16 rounded border border-gray-300 bg-gray-100 flex items-center justify-center overflow-hidden">
                                {coverPreview ? (
                                    <img src={coverPreview} alt="Preview da capa" className="h-full w-full object-cover" />
                                ) : (
                                    <Image size={32} className="text-gray-400" />
                                )}
                            </div>
                            <label htmlFor="cover-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <span>Escolher Arquivo</span>
                                <input id="cover-upload" name="cover-upload" type="file" className="sr-only" onChange={handleCoverChange} accept="image/jpeg, image/png, image/gif" />
                            </label>
                            {coverPreview && coverFile && (
                                <button 
                                    type="button"
                                    onClick={() => { setCoverFile(null); setCoverPreview(initialData?.cover_url || ''); setError(null); }}
                                    className="text-xs text-red-600 hover:text-red-800"
                                >
                                    Remover seleção
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </form>
            
             {/* Estatísticas do Texto (para história e capítulo) */} 
            {(type === "story" || type === "chapter") && (
                <div className="mt-8 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Estatísticas do Texto</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                        <span className="flex items-center"><FileText size={12} className="mr-1" /> {wordCount.toLocaleString('pt-BR')} palavras</span>
                        <span className="flex items-center">{charCount.toLocaleString('pt-BR')} caracteres</span>
                        <span className="flex items-center"><Clock size={12} className="mr-1" /> ~{readingTime} min de leitura</span>
                    </div>
                </div>
            )}
        </div>
    );
} 