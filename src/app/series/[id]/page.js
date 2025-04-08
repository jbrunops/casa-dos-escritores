"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { BookOpen, Calendar, User, Edit, Trash2, Plus, MessageCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { extractIdFromSlug, generateSlug } from "@/lib/utils";
import Comments from "@/components/Comments";

export default function SeriesPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.id;
    const id = extractIdFromSlug(slug) || slug;
    const [series, setSeries] = useState(null);
    const [author, setAuthor] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [isAuthor, setIsAuthor] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const supabase = createBrowserClient();

    // Usar useCallback para a função de carregamento para garantir que ela não cause loops infinitos
    const loadSeriesData = useCallback(async () => {
        if (!id) return;
        
        setLoading(true);
        setError(null);

        try {
            // Buscar detalhes da série
            const { data: seriesData, error: seriesError } = await supabase
                .from("series")
                .select("*")
                .eq("id", id)
                .single();

            if (seriesError) {
                console.error(`Erro ao buscar série com ID '${id}':`, seriesError);
                throw seriesError;
            }

            if (!seriesData) {
                console.error(`Série não encontrada para o ID: '${id}'`);
                throw new Error("Série não encontrada");
            }

            setSeries(seriesData);

            // Buscar o autor separadamente
            const { data: authorData } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", seriesData.author_id)
                .single();

            setAuthor(authorData);

            // Buscar capítulos
            const { data: chaptersData } = await supabase
                .from("chapters")
                .select("*")
                .eq("series_id", id)
                .order("chapter_number", { ascending: true });

            setChapters(chaptersData || []);

            // Verificar se o usuário atual é o autor
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            setIsAuthor(userId === seriesData.author_id);
            
            // Guarde o userId para usar em outros componentes
            setCurrentUserId(userId);

            // Atualizar contador de visualizações
            try {
                await fetch(`/api/series/view?id=${id}`, {
                    method: 'POST',
                });
            } catch (viewError) {
                console.error("Erro ao atualizar visualizações:", viewError);
            }
        } catch (err) {
            console.error("Erro ao carregar dados da série:", err);
            setError(err.message || "Erro ao carregar a série");
        } finally {
            setLoading(false);
        }
    }, [id, supabase]);

    useEffect(() => {
        loadSeriesData();
    }, [loadSeriesData]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR");
    };

    const handleDeleteSeries = async () => {
        if (!confirm(`Tem certeza que deseja excluir a série "${series.title}"? Todos os capítulos também serão excluídos.`)) {
            return;
        }

        setDeleting(true);

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

            // Redirecionar para o dashboard após sucesso usando o router
            router.push('/dashboard');
        } catch (err) {
            console.error("Erro ao excluir série:", err);
            alert("Não foi possível excluir a série. Por favor, tente novamente.");
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteChapter = async (chapterId) => {
        if (!confirm("Tem certeza que deseja excluir este capítulo?")) return;

        try {
            // Desabilitar o estado de carregamento para evitar problemas de navegação
            setLoading(true);
            
            const { error } = await supabase
                .from("chapters")
                .delete()
                .eq("id", chapterId);

            if (error) throw error;

            // Atualizar o timestamp da série para refletir a mudança
            try {
                await supabase
                    .from("series")
                    .update({ updated_at: new Date().toISOString() })
                    .eq("id", id);
            } catch (updateError) {
                console.error("Erro ao atualizar timestamp da série:", updateError);
                // Continuamos mesmo com erro aqui, pois a exclusão já foi feita
            }
            
            // Mensagem de sucesso
            alert("Capítulo excluído com sucesso!");
            
            // Recarregar a página para evitar problemas de estado
            await loadSeriesData();
        } catch (err) {
            console.error("Erro ao excluir capítulo:", err);
            alert("Erro ao excluir capítulo. Por favor, tente novamente.");
        } finally {
            setLoading(false);
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

    if (error || !series) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error || "Série não encontrada."}
                </div>
                <div className="text-center">
                    <Link href="/series" className="inline-flex items-center px-4 py-2 bg-[#484DB5] text-white rounded-md hover:bg-[#3a3e9f] transition-colors">
                        Voltar para todas as séries
                    </Link>
                </div>
            </div>
        );
    }

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
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[#f5f5ff] text-[#484DB5] mb-4">
                                {series.genre}
                            </div>
                        )}

                        {/* Metadados da série */}
                        <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                            <div className="flex items-center">
                                <User size={16} className="mr-1" />
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

                            <div className="flex items-center">
                                <Calendar size={16} className="mr-1" />
                                <span>{formatDate(series.created_at)}</span>
                            </div>

                            <div className="flex items-center">
                                <BookOpen size={16} className="mr-1" />
                                <span>{chapters?.length || 0} capítulos</span>
                            </div>
                            
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#484DB5] text-white">
                                {series.is_completed ? "Completa" : "Em andamento"}
                            </div>
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
                                {series.tags.map((tag) => (
                                    <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f5f5ff] text-[#484DB5]">
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
                        <div className="divide-y divide-[#E5E7EB]">
                            {chapters.map((chapter) => (
                                <div
                                    key={chapter.id}
                                    className="flex justify-between p-4 hover:bg-gray-50"
                                >
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-[#484DB5]">
                                            Capítulo {chapter.chapter_number}
                                        </span>
                                        <h3 className="text-lg font-medium text-gray-800 mb-1">
                                            <Link
                                                href={`/chapter/${generateSlug(chapter.title, chapter.id)}`}
                                                className="hover:text-[#484DB5] transition-colors"
                                            >
                                                {chapter.title}
                                            </Link>
                                        </h3>
                                        <div className="text-sm text-gray-500">
                                            {formatDate(chapter.created_at)}
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
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Seção de comentários */}
                <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] overflow-hidden">
                    <div className="p-4 border-b border-[#E5E7EB] bg-gray-50">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                            <MessageCircle size={20} className="mr-2 text-[#484DB5]" />
                            Comentários
                        </h2>
                    </div>
                    <div className="p-4">
                        <Comments 
                            contentId={id} 
                            contentType="series" 
                            userId={currentUserId}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
