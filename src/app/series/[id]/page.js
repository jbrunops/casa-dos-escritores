"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import SeriesActions from "@/components/SeriesActions";
import Comments from "@/components/Comments";
import DeleteModal from "@/components/DeleteModal";
import { Eye, BookOpen, Calendar, User, Edit, Trash2, Plus, CheckCircle2, AlertTriangle } from "lucide-react";
import { useParams } from "next/navigation";
import { extractIdFromSlug, generateSlug } from "@/lib/utils";

export default function SeriesPage() {
    // Usar useParams diretamente
    const params = useParams();
    const slug = params.id;
    const id = extractIdFromSlug(slug) || slug;
    const [series, setSeries] = useState(null);
    const [author, setAuthor] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [isAuthor, setIsAuthor] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    // Estados para o modal de exclusão
    const [deleteModal, setDeleteModal] = useState({
        open: false,
        id: null,
        title: "",
        type: "chapter"
    });
    const [deleting, setDeleting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const supabase = createBrowserClient();

    useEffect(() => {
        async function loadSeriesData() {
            console.log("----- DIAGNÓSTICO DE SÉRIE -----");
            console.log("Slug recebido da URL:", slug);
            console.log("ID extraído para consulta:", id);
            console.log("Tipo do ID:", typeof id);
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

                console.log("Série encontrada com sucesso:", seriesData.id, seriesData.title);
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
                
                // Encontrar o ID do primeiro capítulo para o botão "Ler Primeiro Capítulo"
                const firstChapterId = chaptersData && chaptersData.length > 0 
                    ? chaptersData[0].id
                    : null;
                
                // Adicionar o ID do primeiro capítulo ao objeto da série
                setSeries({
                    ...seriesData,
                    first_chapter: firstChapterId
                });

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
                    // Use API route instead of direct supabase call to avoid cookie issues
                    await fetch(`/api/series/view?id=${id}`, {
                        method: 'POST',
                    });
                } catch (viewError) {
                    console.error(
                        "Erro ao atualizar visualizações:",
                        viewError
                    );
                }
            } catch (err) {
                console.error("Erro ao carregar dados da série:", err);
                setError(err.message || "Erro ao carregar a série");
            } finally {
                setLoading(false);
            }
        }

        loadSeriesData();
    }, [id, supabase]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR");
    };

    // Abrir o modal de confirmação de exclusão
    const openDeleteModal = (id, title) => {
        setErrorMessage(""); // Limpa erro anterior
        setSuccessMessage(""); // Limpa sucesso anterior
        setDeleteModal({ open: true, id, title, type: "chapter" });
    };

    // Fechar o modal de confirmação de exclusão
    const closeDeleteModal = () => {
        setDeleteModal({ open: false, id: null, title: "", type: "chapter" });
    };

    // Função executada ao confirmar a exclusão no modal
    const handleConfirmDelete = async () => {
        if (!deleteModal.id) {
            setErrorMessage("Erro interno: ID do capítulo não encontrado.");
            return;
        }

        setDeleting(true);
        setErrorMessage("");
        setSuccessMessage("");
        const chapterIdToDelete = deleteModal.id;

        try {
            // ----- Verificação de Autoria (Manter a lógica, remover logs) ----- 
            const { data: { user } } = await supabase.auth.getUser();
            const currentUserId = user?.id;

            if (!currentUserId) {
                throw new Error("Usuário não autenticado.");
            }

            const { data: chapterData, error: fetchError } = await supabase
                .from('chapters')
                .select('author_id')
                .eq('id', chapterIdToDelete)
                .single();
            
            if (fetchError) {
                 throw new Error(`Erro ao buscar dados do capítulo: ${fetchError.message}`);
            }
            if (!chapterData) {
                 throw new Error(`Capítulo com ID ${chapterIdToDelete} não encontrado.`);
            }
            
            const chapterAuthorId = chapterData.author_id;

            if (currentUserId !== chapterAuthorId) {
                 throw new Error("Você não tem permissão para excluir este capítulo.");
            }
            // ----- FIM Verificação -----

            const { error: deleteError } = await supabase
                .from("chapters")
                .delete()
                .eq("id", chapterIdToDelete);

            if (deleteError) {
                if (deleteError.code === '23503') {
                    throw new Error("Não é possível excluir o capítulo pois existem comentários associados.");
                }
                if (deleteError.code === '42501') {
                     throw new Error("Permissão negada pela política de segurança.");
                }
                throw new Error(deleteError.message || "Erro desconhecido do Supabase ao excluir.");
            }

            setChapters(chapters.filter((chapter) => chapter.id !== chapterIdToDelete));
            setSuccessMessage("Capítulo excluído com sucesso!");
            closeDeleteModal();

            setTimeout(() => setSuccessMessage(""), 3000);

        } catch (err) {
            console.error("Erro ao excluir capítulo:", err);
            setErrorMessage(`Erro ao excluir capítulo: ${err.message}`);
             setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-t-[#484DB5] border-r-[#E5E7EB] border-b-[#E5E7EB] border-l-[#E5E7EB] rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-700">Carregando série...</p>
                </div>
            </div>
        );
    }

    if (error || !series) {
        return (
            <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                    {error || "Série não encontrada."}
                </div>
                <div className="text-center mt-4">
                    <Link href="/series" className="inline-flex items-center justify-center h-10 px-4 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-all duration-200">
                        Voltar para todas as séries
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
            {/* Mensagens de Feedback */} 
            {successMessage && (
                <div className="flex items-center p-4 mb-4 bg-green-50 text-green-700 rounded-md border border-green-200">
                    <CheckCircle2 size={20} className="mr-2 flex-shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}
            {errorMessage && (
                <div className="flex items-center p-4 mb-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                    <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}
            {/* Header com informações da série */}
            <div className="flex flex-col md:flex-row p-6 gap-6 border border-[#E5E7EB] mb-6">
                <div className="w-full md:w-1/3 lg:w-1/4">
                    {series.cover_url ? (
                        <img
                            src={series.cover_url}
                            alt={series.title}
                            className="w-full h-auto object-cover rounded-md"
                        />
                    ) : (
                        <div className="w-full aspect-[2/3] bg-gray-200 flex items-center justify-center rounded-md text-4xl font-bold text-gray-500">
                            {series.title.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="w-full md:w-2/3 lg:w-3/4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{series.title}</h1>

                    {/* Metadados da série */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                            <User size={16} className="text-gray-500" />
                            <span>
                                Por{" "}
                                <Link
                                    href={`/profile/${encodeURIComponent(
                                        author?.username || "usuário"
                                    )}`}
                                    className="text-[#484DB5] hover:text-[#5c61ca] transition-colors duration-200"
                                >
                                    {author?.username || "Usuário"}
                                </Link>
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <Calendar size={16} className="text-gray-500" />
                            <span>{formatDate(series.created_at)}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <BookOpen size={16} className="text-gray-500" />
                            <span>{chapters?.length || 0} capítulos</span>
                        </div>
                        
                        {series.genre && (
                            <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-[#484DB5] text-white text-xs rounded-full">
                                    {series.genre}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Descrição */}
                    {series.description && (
                        <div className="mb-4 prose prose-sm max-w-none text-gray-700">
                            <p>{series.description}</p>
                        </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {series.tags && series.tags.length > 0 &&
                            series.tags.map((tag) => (
                                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-[#E5E7EB]">
                                    {tag}
                                </span>
                            ))
                        }
                    </div>

                    {/* Botões de ações */}
                    <SeriesActions series={series} isAuthor={isAuthor} />
                </div>
            </div>

            {/* Seção de capítulos */}
            <div className="p-6 border border-[#E5E7EB] mb-6">
                <div className="flex flex-row justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        Capítulos ({chapters.length})
                    </h2>
                    
                    {/* Botão "Adicionar Capítulo" - apenas ícone no mobile */}
                    {isAuthor && (
                        <Link
                            href={`/dashboard/new-chapter/${series.id}`}
                            className="inline-flex items-center justify-center h-10 px-4 sm:px-4 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-all duration-300 ease-in-out"
                        >
                            <Plus size={16} className="sm:mr-2" />
                            <span className="hidden sm:inline">Adicionar Capítulo</span>
                        </Link>
                    )}
                </div>

                {chapters.length === 0 ? (
                    <div className="bg-gray-50 p-6 rounded-md text-center">
                        <p className="text-gray-600 mb-4">Nenhum capítulo disponível nesta série ainda.</p>
                        {isAuthor && (
                            <Link
                                href={`/dashboard/new-chapter/${series.id}`}
                                className="inline-flex items-center justify-center h-10 px-4 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-all duration-200"
                            >
                                <Edit size={16} className="mr-2" />
                                <span>Escrever Primeiro Capítulo</span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-[#E5E7EB]">
                        {chapters.map((chapter, index) => (
                            <div
                                key={chapter.id}
                                className="flex justify-between items-center py-4 hover:bg-gray-50 transition-all duration-300"
                            >
                                <Link
                                    href={`/chapter/${generateSlug(chapter.title, chapter.id)}`}
                                    className="flex-1 text-gray-900 hover:text-[#484DB5] transition-colors duration-300"
                                >
                                    <span className="text-sm font-medium text-gray-500 block">
                                        Capítulo {chapter.chapter_number}
                                    </span>
                                    <h3 className="text-lg font-medium">
                                        {chapter.title}
                                    </h3>
                                    <div className="mt-1 text-sm text-gray-500">
                                        <span>
                                            {formatDate(chapter.created_at)}
                                        </span>
                                    </div>
                                </Link>

                                <div className="flex gap-2">
                                    <Link
                                        href={`/chapter/${generateSlug(chapter.title, chapter.id)}`}
                                        className="flex items-center justify-center h-10 w-10 text-gray-600 hover:text-[#484DB5] rounded-md border border-[#E5E7EB] hover:border-[#484DB5] transition-all duration-300 hover:-translate-y-1"
                                        title="Ver Capítulo"
                                    >
                                        <Eye size={16} />
                                    </Link>

                                    {isAuthor && (
                                        <>
                                            <Link
                                                href={`/dashboard/edit-chapter/${chapter.id}`}
                                                className="flex items-center justify-center h-10 w-10 text-gray-600 hover:text-[#484DB5] rounded-md border border-[#E5E7EB] hover:border-[#484DB5] transition-all duration-300 hover:-translate-y-1"
                                                title="Editar Capítulo"
                                            >
                                                <Edit size={16} />
                                            </Link>
                                            <button
                                                onClick={() =>
                                                    openDeleteModal(chapter.id, chapter.title)
                                                }
                                                className="flex items-center justify-center h-10 w-10 text-gray-600 hover:text-red-600 rounded-md border border-[#E5E7EB] hover:border-red-300 transition-all duration-300 hover:-translate-y-1"
                                                title="Excluir Capítulo"
                                                disabled={deleting}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Modal de exclusão */} 
            {deleteModal.open && (
                <DeleteModal
                    isOpen={deleteModal.open}
                    onClose={closeDeleteModal}
                    onConfirm={handleConfirmDelete}
                    title="Excluir Capítulo"
                    message={`Tem certeza que deseja excluir o capítulo "${deleteModal.title || 'este capítulo'}"? Comentários associados também podem ser afetados. Esta ação não pode ser desfeita.`}
                    isLoading={deleting}
                />
            )}
        </div>
    );
}
