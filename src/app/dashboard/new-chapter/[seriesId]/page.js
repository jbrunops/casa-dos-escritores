"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import TipTapEditor from "@/components/TipTapEditor";
import Link from "next/link";
import {
    ArrowLeft,
    Save,
    AlertTriangle,
    CheckCircle2,
    BookOpen,
} from "lucide-react";

// Detecta se estamos em ambiente de desenvolvimento
const isDev = process.env.NODE_ENV === 'development';

export default function NewChapterPage() {
    const router = useRouter();
    const params = useParams();
    const seriesId = params.seriesId;
    const redirectTimeoutRef = useRef(null);
    const mountedRef = useRef(true);
    const isSavingRef = useRef(false);
    
    // Usar useRef para o cliente Supabase para evitar recriá-lo a cada renderização
    const supabaseRef = useRef(null);
    if (!supabaseRef.current) {
        supabaseRef.current = createBrowserClient();
    }

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [chapterNumber, setChapterNumber] = useState(1);
    const [maxChapterNumber, setMaxChapterNumber] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [series, setSeries] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formTouched, setFormTouched] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [readingTime, setReadingTime] = useState(0);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Resetar ref na desmontagem
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (redirectTimeoutRef.current) {
                clearTimeout(redirectTimeoutRef.current);
            }
        };
    }, []);

    // Buscar informações da série e definir número do capítulo
    useEffect(() => {
        async function fetchSeriesInfo() {
            // Se já estamos carregando ou redirecionando, não iniciar nova busca
            if (!mountedRef.current || isRedirecting) return;
            
            try {
                setLoading(true);

                // Verificar se usuário está autenticado
                const {
                    data: { user },
                } = await supabaseRef.current.auth.getUser();
                
                if (!user) {
                    router.push("/login");
                    return;
                }

                // Buscar série
                const { data: seriesData, error: seriesError } = await supabaseRef.current
                    .from("series")
                    .select("*")
                    .eq("id", seriesId)
                    .single();

                if (seriesError) {
                    console.error("Erro ao buscar série:", seriesError);
                    throw new Error(
                        "Não foi possível encontrar a série especificada"
                    );
                }

                if (!seriesData) {
                    throw new Error("Série não encontrada");
                }

                // Verificar se o usuário é o autor da série
                if (seriesData.author_id !== user.id) {
                    router.push("/dashboard");
                    return;
                }

                if (mountedRef.current) {
                    setSeries(seriesData);
                }

                // Buscar maior número de capítulo existente
                const { data: chapters, error: chaptersError } = await supabaseRef.current
                    .from("chapters")
                    .select("chapter_number")
                    .eq("series_id", seriesId)
                    .order("chapter_number", { ascending: false });

                if (chaptersError) {
                    console.error("Erro ao buscar capítulos:", chaptersError);
                }

                const nextChapterNumber =
                    chapters && chapters.length > 0
                        ? chapters[0].chapter_number + 1
                        : 1;

                if (mountedRef.current) {
                    setChapterNumber(nextChapterNumber);
                    setMaxChapterNumber(nextChapterNumber);
                }
            } catch (error) {
                console.error("Erro ao buscar informações da série:", error);
                if (mountedRef.current) {
                    setError("Não foi possível carregar as informações da série");
                }
            } finally {
                if (mountedRef.current) {
                    setLoading(false);
                }
            }
        }

        if (seriesId && !isRedirecting) {
            fetchSeriesInfo();
        }
    }, [seriesId, router, isRedirecting]);

    // Detectar mudanças no formulário
    useEffect(() => {
        if (title || content) {
            setFormTouched(true);
        }
    }, [title, content]);

    // Atualizar estatísticas de texto
    useEffect(() => {
        if (!content) {
            setCharCount(0);
            setWordCount(0);
            setReadingTime(0);
            return;
        }
        
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
    }, [content]);

    // Função para lidar com redirecionamento de forma compatível com dev/prod
    const safeRedirect = (url) => {
        if (!mountedRef.current) return;
        
        setIsRedirecting(true);
        
        if (isDev) {
            // Em desenvolvimento, usar um timeout antes do redirecionamento
            // para evitar problemas de estado e condições de corrida
            console.log('Redirecionando em modo de desenvolvimento...');
            redirectTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current) {
                    try {
                        window.location.href = url; // Forçar redirecionamento completo
                    } catch (err) {
                        console.error('Erro ao redirecionar:', err);
                        setSaving(false);
                        setIsRedirecting(false);
                    }
                }
            }, 1000);
        } else {
            // Em produção, usar o router.push diretamente
            router.push(url);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            setError("Por favor, adicione um título para o capítulo");
            return;
        }

        if (!content.trim()) {
            setError("O conteúdo do capítulo não pode estar vazio");
            return;
        }

        if (saving || isRedirecting || isSavingRef.current) {
            // Evita múltiplos cliques no botão de salvar ou submissões durante redirecionamento
            return;
        }

        // Usar ref para evitar condições de corrida
        isSavingRef.current = true;
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const {
                data: { user },
            } = await supabaseRef.current.auth.getUser();

            if (!user) {
                isSavingRef.current = false;
                setSaving(false);
                throw new Error("Você precisa estar logado");
            }

            // Inserir novo capítulo
            const { data, error } = await supabaseRef.current
                .from("chapters")
                .insert({
                    title,
                    content,
                    chapter_number: chapterNumber,
                    series_id: seriesId,
                    author_id: user.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select();

            if (error) {
                console.error("Erro ao inserir capítulo:", error);
                throw error;
            }

            // Atualizar timestamp da série
            const { error: updateError } = await supabaseRef.current
                .from("series")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", seriesId);

            if (updateError) {
                console.error(
                    "Erro ao atualizar timestamp da série:",
                    updateError
                );
            }

            if (mountedRef.current) {
                setSuccess("Capítulo criado com sucesso!");
                
                // Usar método de redirecionamento seguro
                const redirectUrl = `/series/${seriesId}`;
                safeRedirect(redirectUrl);
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err.message || "Ocorreu um erro ao salvar o capítulo");
                console.error("Erro ao criar capítulo:", err);
                setSaving(false);
                isSavingRef.current = false;
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
                <div className="w-12 h-12 border-4 border-[#484DB5] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600 font-medium">Carregando informações da série...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Novo Capítulo: {series?.title}</h1>
            </div>

            <div className="mb-6">
                <Link href={`/series/${seriesId}`} className="inline-flex items-center text-[#484DB5] hover:text-[#383aa3] transition-colors">
                    <ArrowLeft size={16} className="mr-2" />
                    <span>Voltar para a série</span>
                </Link>
            </div>

            {error && (
                <div className="flex items-center p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center p-4 mb-6 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    <CheckCircle2 size={20} className="mr-2 flex-shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título do Capítulo</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:border-transparent"
                            placeholder="Título do capítulo..."
                            required
                            disabled={saving || isRedirecting}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="chapterNumber" className="block text-sm font-medium text-gray-700">
                            Número do Capítulo
                        </label>
                        <input
                            id="chapterNumber"
                            type="number"
                            value={chapterNumber}
                            onChange={(e) =>
                                setChapterNumber(parseInt(e.target.value) || 1)
                            }
                            min="1"
                            className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#484DB5] focus:border-transparent"
                            disabled={saving || isRedirecting}
                        />
                        <p className="text-xs text-gray-500">
                            Capítulo {chapterNumber} de{" "}
                            {maxChapterNumber === chapterNumber
                                ? "uma nova série"
                                : `uma série com ${
                                      maxChapterNumber - 1
                                  } capítulos`}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">Conteúdo do Capítulo</label>
                    <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                        <TipTapEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Escreva seu capítulo aqui..."
                            disabled={saving || isRedirecting}
                        />
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                        <div>
                            <span>{wordCount} palavras</span>
                        </div>
                        <div>
                            <span>{charCount} caracteres</span>
                        </div>
                        <div>
                            <span>{readingTime} min. de leitura</span>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={
                            saving ||
                            isRedirecting ||
                            !title.trim() ||
                            !content.trim() ||
                            !formTouched
                        }
                        className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white 
                            ${saving || isRedirecting || !title.trim() || !content.trim() || !formTouched
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-[#484DB5] hover:bg-[#383aa3] transition-colors'
                            }`}
                    >
                        {saving || isRedirecting ? (
                            <>
                                <Save
                                    className="mr-2 animate-spin"
                                    size={18}
                                />
                                <span>{isRedirecting ? "Redirecionando..." : "Salvando..."}</span>
                            </>
                        ) : (
                            <>
                                <Save className="mr-2" size={18} />
                                <span>Salvar Capítulo</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
