"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createBrowserClient, resetSupabaseClient } from "@/lib/supabase-browser";
import { BookOpen, Calendar, User, Edit, Trash2, Plus, MessageCircle, Clock, Eye, Tag, Home, AlertCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { extractIdFromSlug, generateSlug } from "@/lib/utils";
import Comments from "@/components/Comments";

export default function SeriesPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.id;
    const id = extractIdFromSlug(slug) || slug;
    
    // Estado principal
    const [series, setSeries] = useState(null);
    const [author, setAuthor] = useState(null);
    const [chapters, setChapters] = useState([]);
    
    // Estado de UI
    const [isAuthor, setIsAuthor] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    
    // Estado de conexão
    const [connectionState, setConnectionState] = useState('connecting');
    const [loadingAttempts, setLoadingAttempts] = useState(0);
    
    // Função para tentar reconectar
    const handleRetryConnection = () => {
        setConnectionState('connecting');
        resetSupabaseClient();
        setLoadingAttempts(prev => prev + 1);
        setLoading(true);
        setError(null);
    };

    // Efeito principal de carregamento
    useEffect(() => {
        console.log(`🔄 Tentativa #${loadingAttempts + 1} de carregar série ID: ${id}`);
        
        // Sistema de timeout progressivo
        const timeoutDuration = Math.min(5000, 2000 + (loadingAttempts * 1000));
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.log(`⏱️ Timeout após ${timeoutDuration}ms`);
                setConnectionState('error');
            }
        }, timeoutDuration);
        
        async function loadData() {
            // Inicializa ou obtém cliente Supabase
            const supabase = createBrowserClient();
            
            if (!supabase) {
                console.error("❌ Cliente Supabase indisponível");
                setConnectionState('error');
                setLoading(false);
                setError("Erro de conexão com o servidor. Por favor, tente novamente mais tarde.");
                return;
            }
            
            try {
                // Carrega sessão primeiro (crucial para RLS)
                const { data: sessionData } = await supabase.auth.getSession();
                const userId = sessionData?.session?.user?.id;
                setCurrentUserId(userId);
                
                // Abordagem paralela para maximizar velocidade de carregamento
                await Promise.allSettled([
                    // 1. Carrega a série (prioridade máxima)
                    (async () => {
                        try {
                            console.log("📚 Carregando dados da série");
                            const { data, error } = await supabase
                                .from("series")
                                .select("*")
                                .eq("id", id)
                                .single();
                                
                            if (error) {
                                console.error("❌ Erro ao carregar série:", error);
                                throw error;
                            }
                            
                            if (!data) {
                                console.error("❌ Série não encontrada");
                                throw new Error("Série não encontrada");
                            }
                            
                            console.log("✅ Série carregada:", data.title);
                            setSeries(data);
                            setIsAuthor(userId === data.author_id);
                            setConnectionState('connected');
                            
                            // Agora que temos a série, carrega o autor
                            try {
                                const { data: authorData } = await supabase
                                    .from("profiles")
                                    .select("username")
                                    .eq("id", data.author_id)
                                    .single();
                                    
                                setAuthor(authorData || { username: "Autor desconhecido" });
                            } catch (authorError) {
                                console.warn("⚠️ Erro ao carregar autor:", authorError);
                                setAuthor({ username: "Autor desconhecido" });
                            }
                            
                        } catch (seriesError) {
                            setConnectionState('error');
                            setError("Não foi possível carregar a série. Verifique sua conexão ou tente novamente mais tarde.");
                        }
                    })(),
                    
                    // 2. Carrega capítulos (segunda prioridade)
                    (async () => {
                        try {
                            console.log("📑 Carregando capítulos");
                            const { data, error } = await supabase
                                .from("chapters")
                                .select("id, title, chapter_number, created_at, view_count")
                                .eq("series_id", id)
                                .order("chapter_number", { ascending: true });
                                
                            if (error) {
                                console.error("❌ Erro ao carregar capítulos:", error);
                                throw error;
                            }
                            
                            console.log(`✅ ${data?.length || 0} capítulos carregados`);
                            setChapters(data || []);
                        } catch (chaptersError) {
                            console.warn("⚠️ Erro ao carregar capítulos:", chaptersError);
                            setChapters([]);
                        }
                    })()
                ]);
                
                // Se chegou aqui, finaliza o carregamento
                setLoading(false);
                
            } catch (err) {
                console.error("❌ Erro geral:", err);
                setConnectionState('error');
                setError("Ocorreu um erro ao carregar os dados. Por favor, tente novamente.");
                setLoading(false);
            }
        }
        
        loadData();
        
        return () => clearTimeout(timeoutId);
    }, [id, loadingAttempts]);

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("pt-BR");
        } catch (e) {
            return "Data indisponível";
        }
    };

    const handleDeleteSeries = async () => {
        if (!confirm(`Tem certeza que deseja excluir a série "${series.title}"? Todos os capítulos também serão excluídos.`)) {
            return;
        }

        setDeleting(true);
        const supabase = createBrowserClient();

        if (!supabase) {
            alert("Não foi possível conectar ao banco de dados. Tente novamente mais tarde.");
            setDeleting(false);
            return;
        }

        try {
            // Excluir todos os capítulos associados primeiro
            const { error: chaptersError } = await supabase
                .from("chapters")
                .delete()
                .eq("series_id", id);

            if (chaptersError) {
                console.error("Erro ao excluir capítulos:", chaptersError);
            }

            // Excluir a série
            const { error: seriesError } = await supabase
                .from("series")
                .delete()
                .eq("id", id);

            if (seriesError) throw seriesError;

            // Redirecionar para o dashboard após sucesso
            router.push("/dashboard");
        } catch (err) {
            console.error("Erro ao excluir série:", err);
            alert("Não foi possível excluir a série. Por favor, tente novamente.");
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteChapter = async (chapterId) => {
        if (!confirm("Tem certeza que deseja excluir este capítulo?")) return;
        
        const supabase = createBrowserClient();
        if (!supabase) {
            alert("Não foi possível conectar ao banco de dados. Tente novamente mais tarde.");
            return;
        }

        try {
            const { error } = await supabase
                .from("chapters")
                .delete()
                .eq("id", chapterId);

            if (error) throw error;

            // Atualizar a lista de capítulos localmente
            setChapters(chapters.filter((chapter) => chapter.id !== chapterId));
        } catch (err) {
            console.error("Erro ao excluir capítulo:", err);
            alert("Erro ao excluir capítulo. Por favor, tente novamente.");
        }
    };

    // Função para voltar à página anterior de forma segura
    const handleGoBack = () => {
        try {
            router.back();
        } catch (e) {
            router.push('/series');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#484DB5] rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Carregando série...</p>
                </div>
            </div>
        );
    }

    // Se temos um erro grave (sem série carregada)
    if (error && !series) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
                <div className="text-center">
                    <button 
                        onClick={handleGoBack} 
                        className="inline-flex items-center px-4 py-2 bg-[#484DB5] text-white rounded-md hover:bg-[#3a3e9f] transition-colors mr-4"
                    >
                        <Home size={16} className="mr-2" />
                        Voltar
                    </button>
                    <button 
                        onClick={handleRetryConnection} 
                        className="inline-flex items-center px-4 py-2 bg-white border border-[#484DB5] text-[#484DB5] rounded-md hover:bg-[#f5f5ff] transition-colors"
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    // Aguardar até que tenhamos os dados da série (evita a página de diagnóstico)
    if (!series) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#484DB5] rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Carregando série...</p>
                </div>
            </div>
        );
    }

    // Renderização principal - apenas quando todos os dados estiverem carregados
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-5xl mx-auto">
                {/* Header com informações da série */}
                <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-sm border border-[#E5E7EB] overflow-hidden mb-8">
                    <div className="md:w-1/3 lg:w-1/4 p-4">
                        {series.cover_url ? (
                            <img
                                src={series.cover_url}
                                alt={series.title}
                                className="w-full h-auto object-contain rounded-md"
                            />
                        ) : (
                            <div className="h-full min-h-[300px] w-full rounded-md flex items-center justify-center bg-gradient-to-br from-[#f5f5ff] to-[#e6e7ff]">
                                <span className="text-6xl font-bold text-[#484DB5]">
                                    {series.title.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="md:w-2/3 lg:w-3/4 p-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{series.title}</h1>
                        
                        {/* Gênero destacado */}
                        {series.genre && (
                            <div className="series-category mb-4">
                                <Tag size={14} className="mr-1" />
                                {series.genre}
                            </div>
                        )}

                        {/* Metadados da série */}
                        <div className="flex flex-wrap gap-4 mb-4">
                            <div className="content-meta-item">
                                <User size={16} className="content-meta-icon" />
                                <span>
                                    Por{" "}
                                    <Link
                                        href={`/profile/${encodeURIComponent(
                                            author?.username || "usuário"
                                        )}`}
                                        className="text-[#484DB5] hover:text-[#3a3e9f]"
                                    >
                                        {author?.username || "Usuário"}
                                    </Link>
                                </span>
                            </div>

                            <div className="content-meta-item">
                                <Calendar size={16} className="content-meta-icon" />
                                <span>{formatDate(series.created_at)}</span>
                            </div>

                            <div className="content-meta-item">
                                <BookOpen size={16} className="content-meta-icon" />
                                <span>{chapters?.length || 0} capítulos</span>
                            </div>
                            
                            <div className="content-meta-item">
                                <Eye size={16} className="content-meta-icon" />
                                <span>{series.view_count || 0} visualizações</span>
                            </div>
                            
                            {series.is_completed !== undefined && (
                                <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#484DB5] text-white">
                                    {series.is_completed ? "Completa" : "Em andamento"}
                                </div>
                            )}
                        </div>

                        {/* Descrição */}
                        {series.description && (
                            <div className="mb-6">
                                <p className="text-gray-700">{series.description}</p>
                            </div>
                        )}

                        {/* Tags */}
                        {series.tags && series.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {series.tags.map((tag, index) => (
                                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f5f5ff] text-[#484DB5]">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Botões de ação */}
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {chapters.length > 0 && (
                                <Link
                                    href={`/chapter/${generateSlug(
                                        chapters[0].title,
                                        chapters[0].id
                                    )}`}
                                    className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-[#484DB5] text-white rounded-md hover:bg-[#3a3e9f] transition-colors"
                                >
                                    <BookOpen size={16} className="mr-1 sm:mr-2" />
                                    <span>Ler Série</span>
                                </Link>
                            )}

                            {isAuthor && (
                                <>
                                    <Link
                                        href={`/dashboard/edit-series/${series.id}`}
                                        className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-[#484DB5] text-[#484DB5] rounded-md hover:bg-[#f5f5ff] transition-colors"
                                    >
                                        <Edit size={16} className="mr-1 sm:mr-2" />
                                        <span>Editar</span>
                                    </Link>

                                    <button
                                        onClick={handleDeleteSeries}
                                        disabled={deleting}
                                        className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 size={16} className="mr-1 sm:mr-2" />
                                        <span>{deleting ? "Excluindo..." : "Excluir"}</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Seção de capítulos */}
                <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] overflow-hidden mb-8">
                    <div className="flex justify-between items-center p-4 border-b border-[#E5E7EB] bg-gray-50">
                        <h2 className="text-xl font-semibold text-gray-800">Capítulos</h2>
                        
                        {isAuthor && (
                            <Link
                                href={`/dashboard/new-chapter/${series.id}`}
                                className="inline-flex items-center px-3 py-1.5 bg-[#484DB5] text-white text-sm rounded-md hover:bg-[#3a3e9f] transition-colors"
                            >
                                <Plus size={16} className="mr-1" />
                                <span>Adicionar</span>
                            </Link>
                        )}
                    </div>

                    {chapters.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>Nenhum capítulo disponível nesta série ainda.</p>
                        </div>
                    ) : (
                        <div className="p-4">
                            {chapters.map((chapter) => (
                                <div
                                    key={chapter.id}
                                    className="chapter-list-item p-4"
                                >
                                    <div className="flex items-start">
                                        <span className="chapter-list-number mr-3">
                                            {chapter.chapter_number}
                                        </span>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-gray-800 mb-1">
                                                <Link
                                                    href={`/chapter/${generateSlug(chapter.title, chapter.id)}`}
                                                    className="hover:text-[#484DB5] transition-colors"
                                                >
                                                    {chapter.title}
                                                </Link>
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <Calendar size={14} className="mr-1 text-[#484DB5]" />
                                                    {formatDate(chapter.created_at)}
                                                </span>
                                                {chapter.view_count > 0 && (
                                                    <span className="flex items-center">
                                                        <Eye size={14} className="mr-1 text-[#484DB5]" />
                                                        {chapter.view_count} visualizações
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {isAuthor && (
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/dashboard/edit-chapter/${chapter.id}`}
                                                    className="inline-flex items-center justify-center w-8 h-8 bg-[#f5f5ff] text-[#484DB5] rounded-full hover:bg-[#e6e7ff]"
                                                    title="Editar Capítulo"
                                                >
                                                    <Edit size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteChapter(chapter.id)}
                                                    className="inline-flex items-center justify-center w-8 h-8 bg-red-50 text-red-500 rounded-full hover:bg-red-100"
                                                    title="Excluir Capítulo"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] overflow-hidden">
                    <div className="p-4 border-b border-[#E5E7EB] bg-gray-50">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                            <MessageCircle size={20} className="mr-2 text-[#484DB5]" />
                            Comentários
                        </h2>
                    </div>
                    <div className="p-4">
                        {currentUserId ? (
                            <Comments 
                                contentId={id} 
                                contentType="series" 
                                userId={currentUserId}
                            />
                        ) : (
                            <p className="text-gray-500 text-center py-4">
                                Faça login para ver e adicionar comentários.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
