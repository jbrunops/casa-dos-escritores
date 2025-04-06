"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import DeleteModal from "@/components/DeleteModal";
import {
    PlusCircle,
    Trash2,
    Edit3,
    Eye,
    RefreshCw,
    BookOpen,
    MessageSquare,
    Layers,
    Plus,
} from "lucide-react";
import { generateSlug } from "@/lib/utils";

export default function DashboardPage() {
    const [series, setSeries] = useState([]);
    const [loadingSeries, setLoadingSeries] = useState(true);
    const [seriesTab, setSeriesTab] = useState("all");
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({
        open: false,
        storyId: null,
        title: "",
    });
    const [deleting, setDeleting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [stats, setStats] = useState({
        totalStories: 0,
        publishedStories: 0,
        totalViews: 0,
        totalComments: 0,
    });
    const [activeTab, setActiveTab] = useState("all");
    const [loadingStories, setLoadingStories] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);

    const router = useRouter();
    const supabase = createBrowserClient();

    useEffect(() => {
        async function fetchData() {
            try {
                // Verificar se o usuário está autenticado
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session || !session.user) {
                    router.push("/login");
                    return;
                }

                setUser(session.user);

                // Buscar perfil do usuário
                try {
                    const { data: profileData, error: profileError } =
                        await supabase
                            .from("profiles")
                            .select("*")
                            .eq("id", session.user.id)
                            .single();

                    if (profileError) {
                        console.error("Erro ao buscar perfil:", profileError);
                    } else {
                        setProfile(profileData || {});
                    }
                } catch (profileError) {
                    console.error("Exceção ao buscar perfil:", profileError);
                }

                // Buscar histórias do usuário
                try {
                    await fetchUserStories(session.user.id);
                } catch (storiesError) {
                    console.error("Exceção ao buscar histórias:", storiesError);
                }

                try {
                    await fetchUserSeries(session.user.id);
                } catch (seriesError) {
                    console.error("Exceção ao buscar séries:", seriesError);
                }

                // Buscar estatísticas
                try {
                    await fetchUserStats(session.user.id);
                } catch (statsError) {
                    console.error(
                        "Exceção ao buscar estatísticas:",
                        statsError
                    );
                }
            } catch (error) {
                console.error("Erro ao carregar dashboard:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    async function fetchUserStories(userId) {
        try {
            setLoadingStories(true);

            const { data, error } = await supabase
                .from("stories")
                .select(
                    `
                    id, 
                    title, 
                    created_at, 
                    updated_at,
                    is_published, 
                    category,
                    view_count
                    `
                )
                .eq("author_id", userId)
                .order("created_at", { ascending: false });

            if (error) {
                throw error;
            }

            // Para cada história, buscar contagem de comentários
            const storiesWithComments = await Promise.all(
                (data || []).map(async (story) => {
                    try {
                        const { count, error: countError } = await supabase
                            .from("comments")
                            .select("id", { count: "exact" })
                            .eq("story_id", story.id);

                        if (countError) {
                            return {
                                ...story,
                                comment_count: 0,
                            };
                        }

                        return {
                            ...story,
                            comment_count: count || 0,
                        };
                    } catch (err) {
                        return {
                            ...story,
                            comment_count: 0,
                        };
                    }
                })
            );

            setStories(storiesWithComments || []);
        } catch (error) {
            console.error("Erro ao buscar histórias:", error);
            setStories([]);
        } finally {
            setLoadingStories(false);
        }
    }

    // Este é o trecho que precisa ser localizado e atualizado no arquivo src/app/dashboard/page.js
    // Procure pela função que busca séries e sua contagem de capítulos

    async function fetchUserSeries(userId) {
        try {
            setLoadingSeries(true);

            const { data, error } = await supabase
                .from("series")
                .select(
                    `
                id,
                title,
                created_at,
                updated_at,
                is_completed,
                genre,
                view_count
            `
                )
                .eq("author_id", userId)
                .order("created_at", { ascending: false });

            if (error) {
                throw error;
            }

            // Para cada série, buscar contagem de capítulos
            const seriesWithChapters = await Promise.all(
                (data || []).map(async (serie) => {
                    try {
                        const { count, error: countError } = await supabase
                            .from("chapters") // AQUI: Alterado de "stories" para "chapters"
                            .select("id", { count: "exact" })
                            .eq("series_id", serie.id);

                        if (countError) {
                            return {
                                ...serie,
                                chapter_count: 0,
                            };
                        }

                        return {
                            ...serie,
                            chapter_count: count || 0,
                        };
                    } catch (err) {
                        return {
                            ...serie,
                            chapter_count: 0,
                        };
                    }
                })
            );

            setSeries(seriesWithChapters || []);
        } catch (error) {
            console.error("Erro ao buscar séries:", error);
            setSeries([]);
        } finally {
            setLoadingSeries(false);
        }
    }

    async function fetchUserStats(userId) {
        try {
            setLoadingStats(true);

            // Buscar todas as histórias do usuário
            const { data: allStories, error: storiesError } = await supabase
                .from("stories")
                .select("id, is_published, view_count")
                .eq("author_id", userId);

            if (storiesError) {
                throw storiesError;
            }

            // Calcular estatísticas básicas
            const totalStories = allStories?.length || 0;
            const publishedStories =
                allStories?.filter((s) => s.is_published).length || 0;
            const totalViews =
                allStories?.reduce(
                    (sum, story) => sum + (parseInt(story.view_count) || 0),
                    0
                ) || 0;

            // Buscar todos os comentários para as histórias do usuário
            let totalComments = 0;
            if (allStories && allStories.length > 0) {
                const storyIds = allStories.map((story) => story.id);

                // Fazer uma única consulta ao invés de várias
                if (storyIds.length > 0) {
                    const { count, error: commentsError } = await supabase
                        .from("comments")
                        .select("id", { count: "exact" })
                        .in("story_id", storyIds);

                    if (!commentsError) {
                        totalComments = count || 0;
                    }
                }
            }

            setStats({
                totalStories,
                publishedStories,
                totalViews,
                totalComments,
            });
        } catch (error) {
            console.error("Erro ao buscar estatísticas:", error);
        } finally {
            setLoadingStats(false);
        }
    }

    const refreshData = async () => {
        if (!user) return;

        try {
            await fetchUserStories(user.id);
            await fetchUserStats(user.id);
        } catch (error) {
            console.error("Erro ao atualizar dados:", error);
        }
    };

    const openDeleteModal = (id, title, type = "story") => {
        setDeleteModal({
            open: true,
            id,
            title,
            type, // tipo pode ser "story" ou "series"
        });
    };

    const closeDeleteModal = () => {
        setDeleteModal({
            open: false,
            storyId: null,
            title: "",
        });
    };

    // Renomeie para handleDelete
    const handleDelete = async () => {
        if (!deleteModal.id) return;

        setDeleting(true);

        try {
            if (deleteModal.type === "series") {
                // Primeiro, excluir todos os capítulos associados
                await supabase
                    .from("stories")
                    .delete()
                    .eq("series_id", deleteModal.id);

                // Então excluir a série
                const { error } = await supabase
                    .from("series")
                    .delete()
                    .eq("id", deleteModal.id);

                if (error) throw error;

                // Atualizar a lista de séries
                setSeries(
                    series.filter((serie) => serie.id !== deleteModal.id)
                );
            } else {
                // Código existente para excluir histórias
                const { error } = await supabase
                    .from("stories")
                    .delete()
                    .eq("id", deleteModal.id);

                if (error) throw error;

                // Atualizar a lista de histórias
                setStories(
                    stories.filter((story) => story.id !== deleteModal.id)
                );
            }

            setSuccessMessage(
                `${deleteModal.type === "series" ? "Série" : "História"} "${
                    deleteModal.title
                }" foi excluída com sucesso.`
            );

            // Atualizar estatísticas
            if (user && user.id) {
                await fetchUserStats(user.id);
            }

            // Esconder a mensagem de sucesso após 5 segundos
            setTimeout(() => {
                setSuccessMessage("");
            }, 5000);
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert(
                `Não foi possível excluir ${
                    deleteModal.type === "series" ? "a série" : "a história"
                }. Por favor, tente novamente.`
            );
        } finally {
            setDeleting(false);
            closeDeleteModal();
        }
    };

    const filteredStories = stories.filter((story) => {
        if (activeTab === "all") return true;
        if (activeTab === "published") return story.is_published;
        if (activeTab === "drafts") return !story.is_published;
        return true;
    });

    // Formatador de data
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loader-large"></div>
                <p>Carregando seu painel...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h1>Meu Dashboard</h1>
                    <p>Bem-vindo, {profile?.username || "Escritor"}</p>
                </div>
            </div>

            {successMessage && (
                <div className="success-message">{successMessage}</div>
            )}

            <div className="stats-section">
                <div className="stat-card">
                    <div className="stat-content">
                        <span className="stat-value">{stats.totalStories}</span>
                        <span className="stat-label">Total de Histórias</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <span className="stat-value">
                            {stats.publishedStories}
                        </span>
                        <span className="stat-label">Publicadas</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <span className="stat-value">{stats.totalViews}</span>
                        <span className="stat-label">Visualizações</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <span className="stat-value">
                            {stats.totalComments}
                        </span>
                        <span className="stat-label">Comentários</span>
                    </div>
                </div>
            </div>

            <div className="stories-section">
                <div className="stories-header">
                    <h2>Minhas Histórias</h2>

                    <div className="actions-section">
                        <button
                            onClick={refreshData}
                            className="refresh-button"
                            aria-label="Atualizar dados"
                        >
                            <RefreshCw size={20} />
                        </button>

                        <Link href="/dashboard/new" className="new-story-button">
                            <PlusCircle size={20} />
                            <span>Nova História</span>
                        </Link>
                    </div>
                </div>
                
                <div className="stories-tabs">
                    <button
                        className={`tab-btn ${
                            activeTab === "all" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("all")}
                    >
                        Todas
                    </button>
                    <button
                        className={`tab-btn ${
                            activeTab === "published" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("published")}
                    >
                        Publicadas
                    </button>
                    <button
                        className={`tab-btn ${
                            activeTab === "drafts" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("drafts")}
                    >
                        Rascunhos
                    </button>
                </div>

                {loadingStories ? (
                    <div className="stories-loading">
                        <div className="loader-large"></div>
                        <p>Carregando histórias...</p>
                    </div>
                ) : filteredStories.length === 0 ? (
                    <div className="empty-stories">
                        <p>
                            {activeTab === "all"
                                ? "Você ainda não criou nenhuma história."
                                : activeTab === "published"
                                ? "Você ainda não publicou nenhuma história."
                                : stories.some(story => story.is_published)
                                ? "Você não tem nenhum rascunho."
                                : "Você ainda não criou nenhuma história."}
                        </p>
                        <Link href="/dashboard/new" className="create-first">
                            {activeTab === "drafts" && stories.some(story => story.is_published)
                                ? "Criar uma nova história"
                                : "Criar minha primeira história"}
                        </Link>
                    </div>
                ) : (
                    <div className="stories-list-dashboard">
                        {filteredStories.map((story) => (
                            <div key={story.id} className="story-item">
                                <div className="story-main">
                                    <h3 className="story-title">
                                        {story.title}
                                    </h3>

                                    <div className="story-details">
                                        <span className="story-category">
                                            {story.category || "Sem categoria"}
                                        </span>

                                        <span
                                            className={`story-status ${
                                                story.is_published
                                                    ? "published"
                                                    : "draft"
                                            }`}
                                        >
                                            {story.is_published
                                                ? "Publicado"
                                                : "Rascunho"}
                                        </span>
                                    </div>

                                    <div className="story-meta">
                                        <div className="story-stats">
                                            <span className="stat-item">
                                                <Eye size={14} />
                                                <span>
                                                    {story.view_count || 0}
                                                </span>
                                            </span>
                                            <span className="stat-item">
                                                <MessageSquare size={14} />
                                                <span>
                                                    {story.comment_count || 0}
                                                </span>
                                            </span>
                                            <span className="stat-item">
                                                <BookOpen size={14} />
                                                <span>
                                                    {formatDate(
                                                        story.created_at
                                                    )}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="story-actions">
                                    <Link
                                        href={`/story/${generateSlug(story.title, story.id)}`}
                                        className="action-btn view-btn"
                                        title="Visualizar"
                                    >
                                        <Eye size={18} />
                                    </Link>

                                    <Link
                                        href={`/dashboard/edit/${story.id}`}
                                        className="action-btn edit-btn"
                                        title="Editar"
                                    >
                                        <Edit3 size={18} />
                                    </Link>

                                    <button
                                        onClick={() =>
                                            openDeleteModal(
                                                story.id,
                                                story.title
                                            )
                                        }
                                        className="action-btn delete-btn"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Link para a página de séries - substituindo a tabela */}
            <div className="series-link-section">
                <div className="series-link-header">
                    <h2>Minhas Séries</h2>
                    <Link href="/dashboard/new-series" className="new-story-button">
                        <PlusCircle size={20} />
                        <span>Nova Série</span>
                    </Link>
                </div>
                
                <div className="series-stats-card">
                    <div className="series-stats-content">
                        <div className="series-stats-item">
                            <span className="series-stats-value">{series.length}</span>
                            <span className="series-stats-label">Total de Séries</span>
                        </div>
                        <div className="series-stats-item">
                            <span className="series-stats-value">
                                {series.filter(s => s.is_completed).length}
                            </span>
                            <span className="series-stats-label">Completas</span>
                        </div>
                        <div className="series-stats-item">
                            <span className="series-stats-value">
                                {series.filter(s => !s.is_completed).length}
                            </span>
                            <span className="series-stats-label">Em andamento</span>
                        </div>
                    </div>
                </div>
                
                <div className="series-footer">
                    <Link href="/series" className="view-all-series-link">
                        <BookOpen size={18} />
                        <span>Ver Minhas Séries</span>
                    </Link>
                </div>
            </div>

            {/* Modal de confirmação de exclusão */}
            <DeleteModal
                isOpen={deleteModal.open}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                title={deleteModal.title}
                type={deleteModal.type}
            />
        </div>
    );
}
