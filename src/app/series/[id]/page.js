"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import SeriesActions from "@/components/SeriesActions";
import Comments from "@/components/Comments";
import { Eye, BookOpen, Calendar, User, Edit, Trash2 } from "lucide-react";
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

    const handleDeleteChapter = async (chapterId) => {
        if (!confirm("Tem certeza que deseja excluir este capítulo?")) return;

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

    if (loading) {
        return (
            <div className="content-wrapper">
                <div className="loading-container">
                    <div className="loader-large"></div>
                    <p>Carregando série...</p>
                </div>
            </div>
        );
    }

    if (error || !series) {
        return (
            <div className="content-wrapper">
                <div className="message-banner error">
                    {error || "Série não encontrada."}
                </div>
                <div className="text-center mt-4">
                    <Link href="/series" className="btn primary">
                        Voltar para todas as séries
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="content-wrapper">
            <div className="series-detail-container">
                {/* Header com informações da série */}
                <div className="series-detail-header">
                    <div className="series-detail-cover">
                        {series.cover_url ? (
                            <img
                                src={series.cover_url}
                                alt={series.title}
                                className="series-detail-cover-image"
                            />
                        ) : (
                            <div className="series-cover-placeholder">
                                {series.title.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="series-detail-info">
                        <h1 className="series-detail-title">{series.title}</h1>

                        {/* Metadados da série */}
                        <div className="series-detail-meta">
                            <div className="series-detail-meta-item">
                                <User size={16} />
                                <span>
                                    Por{" "}
                                    <Link
                                        href={`/profile/${encodeURIComponent(
                                            author?.username || "usuário"
                                        )}`}
                                        className="author-link"
                                    >
                                        {author?.username || "Usuário"}
                                    </Link>
                                </span>
                            </div>

                            <div className="series-detail-meta-item">
                                <Calendar size={16} />
                                <span>{formatDate(series.created_at)}</span>
                            </div>

                            <div className="series-detail-meta-item">
                                <BookOpen size={16} />
                                <span>{chapters?.length || 0} capítulos</span>
                            </div>
                        </div>

                        {/* Descrição */}
                        {series.description && (
                            <div className="series-detail-description">
                                <p>{series.description}</p>
                            </div>
                        )}

                        {/* Tags e gênero */}
                        <div className="series-detail-tags-container">
                            {series.genre && (
                                <span className="series-detail-tag genre-tag">
                                    {series.genre}
                                </span>
                            )}

                            {series.tags && series.tags.length > 0 &&
                                series.tags.map((tag) => (
                                    <span key={tag} className="series-detail-tag">
                                        {tag}
                                    </span>
                                ))
                            }
                        </div>

                        {/* Botões de ações */}
                        <SeriesActions series={series} isAuthor={isAuthor} />

                        {/* Ações da série */}
                        {series.first_chapter ? (
                            <div className="series-primary-actions">
                                <Link
                                    href={`/chapter/${generateSlug(
                                        chapters[0].title,
                                        series.first_chapter
                                    )}`}
                                    className="btn primary"
                                >
                                    <BookOpen size={18} />
                                    <span>Ler Primeiro Capítulo</span>
                                </Link>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Seção de capítulos */}
                <div className="series-chapters">
                    <h2 className="series-chapters-title">
                        Capítulos ({chapters.length})
                    </h2>

                    {chapters.length === 0 ? (
                        <div className="empty-chapters-message">
                            <p>Nenhum capítulo disponível nesta série ainda.</p>
                            {isAuthor && (
                                <Link
                                    href={`/dashboard/new-chapter/${series.id}`}
                                    className="btn primary"
                                >
                                    <Edit size={16} />
                                    <span>Escrever Primeiro Capítulo</span>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="chapter-list">
                            {chapters.map((chapter, index) => (
                                <div
                                    key={chapter.id}
                                    className="chapter-item"
                                >
                                    <div className="chapter-content">
                                        <span className="chapter-number">
                                            Capítulo {chapter.chapter_number}
                                        </span>
                                        <h3 className="chapter-title">
                                            <Link
                                                href={`/chapter/${generateSlug(chapter.title, chapter.id)}`}
                                                className="chapter-link"
                                            >
                                                {chapter.title}
                                            </Link>
                                        </h3>
                                        <div className="chapter-meta">
                                            <span className="chapter-date">
                                                {formatDate(chapter.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {isAuthor && (
                                        <div className="chapter-actions">
                                            <Link
                                                href={`/dashboard/edit-chapter/${chapter.id}`}
                                                className="chapter-action-btn edit"
                                                title="Editar Capítulo"
                                            >
                                                <Edit size={16} />
                                            </Link>
                                            <button
                                                onClick={() =>
                                                    handleDeleteChapter(chapter.id)
                                                }
                                                className="chapter-action-btn delete"
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
                <div className="series-comments-section">
                    <Comments 
                        contentId={id} 
                        contentType="series" 
                        userId={currentUserId}
                    />
                </div>
            </div>
        </div>
    );
}
