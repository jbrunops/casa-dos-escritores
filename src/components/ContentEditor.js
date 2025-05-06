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
    Loader2,
    Trash2
} from "lucide-react";
import { defaultCategories } from "@/lib/categories";
import DeleteModal from "@/components/DeleteModal";
import useTextStats from "@/hooks/useTextStats";

// Importar os novos editores especializados
import StoryEditor from "./editors/StoryEditor";
import SeriesEditor from "./editors/SeriesEditor";
import ChapterEditor from "./editors/ChapterEditor";

export default function ContentEditor(props) {
    const {
        type = "story",
        title = "",
        content = "",
        description = "",
        category = "",
        seriesId = null,
        onBack = null,
        onSubmit = null,
        backPath = "/dashboard",
        backLabel = "Voltar ao Dashboard",
        headerTitle: initialHeaderTitle = "Criar Novo Conteúdo",
        requireCategory = true,
        existingId = null,
        coverUrl = ""
    } = props;

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

    // Estados para o Modal de Exclusão
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const router = useRouter();
    const supabase = createBrowserClient();
    const categories = defaultCategories;
    const isEditingModeRef = useRef(!!existingId);

    // Adaptação do headerTitle caso não seja fornecido pelos editores especializados
    const headerTitle = props.headerTitle || initialHeaderTitle;

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

    const getPublishButtonText = () => {
        if (isEditingModeRef.current) {
            return type === 'chapter' ? 'Atualizar Capítulo' : type === 'series' ? 'Atualizar Série' : 'Atualizar História';
        } else {
            return type === 'chapter' ? 'Publicar Capítulo' : type === 'series' ? 'Publicar Série' : 'Publicar História';
        }
    };

    const getPublishButtonIcon = () => {
        return isEditingModeRef.current ? <Save size={16} className="mr-2" /> : <Send size={16} className="mr-2" />;
    };
    
    // Nova função para lidar com a exclusão
    const handleDelete = async () => {
        if (!existingId) return;

        setIsDeleting(true);
        setError(null); // Limpar erros anteriores

        const tableName = type === "story" ? "stories" : type === "chapter" ? "chapters" : null;
        if (!tableName) {
            setError("Tipo de conteúdo inválido para exclusão.");
            setIsDeleting(false);
            setShowDeleteModal(false);
            return;
        }

        try {
            const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .eq("id", existingId);

            if (deleteError) throw deleteError;

            setSuccess(`${type === "story" ? "História" : "Capítulo"} excluíd${type === "story" ? "a" : "o"} com sucesso!`);
            // Aguardar um pouco para o usuário ver a mensagem de sucesso antes de redirecionar
            setTimeout(() => {
                // Se for capítulo e tivermos seriesId, tentar voltar para a página da série
                if (type === "chapter" && series?.id) { // 'series' é o estado que guarda dados da série do capítulo
                    router.push(`/series/${series.id}`); // Idealmente usar slug da série se disponível
                } else {
                    router.push(backPath); // Usar o backPath genérico
                }
            }, 1500);

        } catch (err) {
            console.error(`Erro ao excluir ${type}:`, err);
            setError(`Não foi possível excluir. ${err.message}`);
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // Renderização do formulário baseada no tipo
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
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

                    {/* Lógica de Dispatch para o editor correto */}
                    {(() => {
                        // Props que serão passadas para todos os editores
                        const commonEditorProps = {
                            ...props, // Passa todas as props originais do ContentEditor
                            // Estados e setters principais que ainda residem em ContentEditor
                            // (estes serão gradualmente movidos para os editores ou hooks)
                            currentTitle, setCurrentTitle,
                            currentContent, setCurrentContent,
                            currentCategory, setCurrentCategory,
                            currentDescription, setCurrentDescription,
                            tags, setTags,
                            tagInput, setTagInput,
                            coverFile, setCoverFile,
                            coverPreview, setCoverPreview,
                            chapterNumber, setChapterNumber, // chapterNumber já é estado
                            loadingChapterNumber,
                            seriesData: series, // Estado 'series' de ContentEditor
                            saving, setSaving,           // Adicionado
                            publishing, setPublishing, // Adicionado
                            error, setError,             // Adicionado
                            success, setSuccess,           // Adicionado
                            formTouched, setFormTouched,     // Adicionado
                            wordCount, charCount, readingTime,
                            handleSubmit, // Função de submit (ainda em ContentEditor)
                            handleDelete, // Função de delete (ainda em ContentEditor)
                            showDeleteModal, setShowDeleteModal,
                            isDeleting, setIsDeleting,
                            isEditingMode: isEditingModeRef.current,
                            // Funções de manipulação específicas (ainda em ContentEditor, serão movidas)
                            handleAddTag, handleRemoveTag, handleCoverChange,
                            // Funções de UI (ainda em ContentEditor, serão movidas ou os editores terão as suas)
                            getSubmitButtonText, getSubmitButtonIcon, 
                            getPublishButtonText, getPublishButtonIcon,
                            // Outros estados e refs
                            categories, // Lista de categorias
                            supabase, // Instância do Supabase
                            router, // Instância do Router
                            validateForm, // Função de validação (será movida)
                            isEditingModeRef // Ref para modo de edição
                        };

                        switch (type) {
                            case "story":
                                return <StoryEditor {...commonEditorProps} />;
                            case "series":
                                return <SeriesEditor {...commonEditorProps} />;
                            case "chapter":
                                return <ChapterEditor {...commonEditorProps} seriesId={seriesId} />; // Garante que seriesId seja passado
                            default:
                                console.warn("ContentEditor: Tipo de conteúdo desconhecido -", type);
                                return <div>Tipo de editor desconhecido.</div>;
                        }
                    })()}
                </>
            )}
            
            {/* Modal de Exclusão (controlado por ContentEditor por enquanto) */}
            {isEditingModeRef.current && (type === "story" || type === "chapter") && (
                <DeleteModal
                    isOpen={showDeleteModal}
                    title={`Excluir ${type === "story" ? "História" : "Capítulo"}`}
                    message={`Tem certeza de que deseja excluir est${type === "story" ? "a história" : "e capítulo"}? Esta ação não pode ser desfeita.`}
                    confirmLabel="Excluir"
                    cancelLabel="Cancelar"
                    isDeleting={isDeleting}
                    onCancel={() => setShowDeleteModal(false)}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
} 