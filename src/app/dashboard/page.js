// src/app/dashboard/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import DeleteModal from "@/components/DeleteModal";

export default function DashboardPage() {
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
                console.log("Iniciando carregamento do dashboard");
                // Verificar se o usuário está autenticado
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session || !session.user) {
                    console.log(
                        "Nenhuma sessão encontrada, redirecionando para login"
                    );
                    router.push("/login");
                    return;
                }

                console.log(
                    "Sessão encontrada, ID do usuário:",
                    session.user.id
                );
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
                        console.log(
                            "Perfil recuperado:",
                            profileData?.username
                        );
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
            console.log("Buscando histórias para o usuário:", userId);
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
                console.error(
                    "Erro retornado pelo Supabase ao buscar histórias:",
                    error
                );
                throw error;
            }

            console.log("Histórias recuperadas:", data?.length || 0);

            // Para cada história, buscar contagem de comentários
            const storiesWithComments = await Promise.all(
                (data || []).map(async (story) => {
                    try {
                        const { count, error: countError } = await supabase
                            .from("comments")
                            .select("id", { count: "exact" })
                            .eq("story_id", story.id);

                        if (countError) {
                            console.warn(
                                `Erro ao contar comentários para história ${story.id}:`,
                                countError
                            );
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
                        console.error(
                            `Exceção ao contar comentários para história ${story.id}:`,
                            err
                        );
                        return {
                            ...story,
                            comment_count: 0,
                        };
                    }
                })
            );

            console.log(
                "Histórias com contagens de comentários:",
                storiesWithComments?.length || 0
            );
            setStories(storiesWithComments || []);
        } catch (error) {
            console.error("Erro ao buscar histórias:", error);
            setStories([]);
        } finally {
            setLoadingStories(false);
        }
    }

    async function fetchUserStats(userId) {
        try {
            console.log("Buscando estatísticas para o usuário:", userId);
            setLoadingStats(true);

            // Buscar todas as histórias do usuário
            const { data: allStories, error: storiesError } = await supabase
                .from("stories")
                .select("id, is_published, view_count")
                .eq("author_id", userId);

            if (storiesError) {
                console.error(
                    "Erro ao buscar histórias para estatísticas:",
                    storiesError
                );
                throw storiesError;
            }

            console.log(
                "Histórias encontradas para estatísticas:",
                allStories?.length || 0
            );

            // Calcular estatísticas básicas
            const totalStories = allStories?.length || 0;
            const publishedStories =
                allStories?.filter((s) => s.is_published).length || 0;
            const totalViews =
                allStories?.reduce(
                    (sum, story) => sum + (parseInt(story.view_count) || 0),
                    0
                ) || 0;

            console.log("Estatísticas calculadas:", {
                totalStories,
                publishedStories,
                totalViews,
            });

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

                    if (commentsError) {
                        console.error(
                            "Erro ao buscar contagem de comentários:",
                            commentsError
                        );
                    } else {
                        totalComments = count || 0;
                        console.log(
                            "Total de comentários encontrados:",
                            totalComments
                        );
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
            // Manter os valores padrão em caso de erro
        } finally {
            setLoadingStats(false);
        }
    }

    const openDeleteModal = (storyId, storyTitle) => {
        setDeleteModal({
            open: true,
            storyId,
            title: storyTitle,
        });
    };

    const closeDeleteModal = () => {
        setDeleteModal({
            open: false,
            storyId: null,
            title: "",
        });
    };

    const handleDeleteStory = async () => {
        if (!deleteModal.storyId) return;

        setDeleting(true);

        try {
            console.log("Excluindo história:", deleteModal.storyId);
            const { error } = await supabase
                .from("stories")
                .delete()
                .eq("id", deleteModal.storyId);

            if (error) {
                console.error("Erro ao excluir história:", error);
                throw error;
            }

            // Atualizar a lista de histórias
            setStories(
                stories.filter((story) => story.id !== deleteModal.storyId)
            );
            setSuccessMessage(
                `A história "${deleteModal.title}" foi excluída com sucesso.`
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
            console.error("Erro ao excluir história:", error);
            alert(
                "Não foi possível excluir a história. Por favor, tente novamente."
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
            <div className="loading-container">
                <div className="loader-large"></div>
                <p>Carregando seu painel...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="dashboard-welcome">
                    <h1>Meu Dashboard</h1>
                    <p>Olá, {profile?.username || "Escritor"}</p>
                </div>
                <Link href="/dashboard/new" className="new-story-button">
                    Nova História
                </Link>
            </div>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalStories}</div>
                    <div className="stat-label">Histórias</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.publishedStories}</div>
                    <div className="stat-label">Publicadas</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalViews}</div>
                    <div className="stat-label">Visualizações</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalComments}</div>
                    <div className="stat-label">Comentários</div>
                </div>
            </div>

            {successMessage && (
                <div className="success-notification">{successMessage}</div>
            )}

            <div className="stories-section">
                <div className="stories-header">
                    <h2>Minhas Histórias</h2>
                    <div className="stories-tabs">
                        <button
                            className={`tab-button ${
                                activeTab === "all" ? "active" : ""
                            }`}
                            onClick={() => setActiveTab("all")}
                        >
                            Todas ({stories.length})
                        </button>
                        <button
                            className={`tab-button ${
                                activeTab === "published" ? "active" : ""
                            }`}
                            onClick={() => setActiveTab("published")}
                        >
                            Publicadas (
                            {stories.filter((s) => s.is_published).length})
                        </button>
                        <button
                            className={`tab-button ${
                                activeTab === "drafts" ? "active" : ""
                            }`}
                            onClick={() => setActiveTab("drafts")}
                        >
                            Rascunhos (
                            {stories.filter((s) => !s.is_published).length})
                        </button>
                    </div>
                </div>

                {loadingStories ? (
                    <div className="loading-indicator">
                        <div className="loader-large"></div>
                        <p>Carregando histórias...</p>
                    </div>
                ) : filteredStories.length === 0 ? (
                    <div className="empty-state">
                        <p>
                            {activeTab === "all"
                                ? "Você ainda não criou nenhuma história."
                                : activeTab === "published"
                                ? "Você ainda não publicou nenhuma história."
                                : "Você não tem nenhum rascunho."}
                        </p>
                        <Link
                            href="/dashboard/new"
                            className="create-story-link"
                        >
                            Criar Nova História
                        </Link>
                    </div>
                ) : (
                    <div className="stories-list">
                        <div className="stories-table-header">
                            <div className="story-title-col">Título</div>
                            <div className="story-category-col">Categoria</div>
                            <div className="story-status-col">Status</div>
                            <div className="story-stats-col">Estatísticas</div>
                            <div className="story-date-col">Data</div>
                            <div className="story-actions-col">Ações</div>
                        </div>

                        {filteredStories.map((story) => (
                            <div key={story.id} className="story-row">
                                <div
                                    className="story-title-col"
                                    title={story.title}
                                >
                                    {story.title}
                                </div>

                                <div className="story-category-col">
                                    {story.category || "Sem categoria"}
                                </div>

                                <div className="story-status-col">
                                    <span
                                        className={`status-badge ${
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

                                <div className="story-stats-col">
                                    <div className="story-stats">
                                        <span
                                            className="story-stat-item"
                                            title="Visualizações"
                                        >
                                            {story.view_count || 0}{" "}
                                            visualizações
                                        </span>
                                        <span
                                            className="story-stat-item"
                                            title="Comentários"
                                        >
                                            {story.comment_count || 0}{" "}
                                            comentários
                                        </span>
                                    </div>
                                </div>

                                <div className="story-date-col">
                                    <div className="date-info">
                                        <div
                                            className="created-date"
                                            title="Data de criação"
                                        >
                                            {formatDate(story.created_at)}
                                        </div>
                                        {story.updated_at &&
                                            story.updated_at !==
                                                story.created_at && (
                                                <div
                                                    className="updated-date"
                                                    title="Última atualização"
                                                >
                                                    atualizado:{" "}
                                                    {formatDate(
                                                        story.updated_at
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>

                                <div className="story-actions-col">
                                    <div className="story-actions">
                                        <Link
                                            href={`/story/${story.id}`}
                                            className="story-action-btn view"
                                            title="Visualizar"
                                        >
                                            Ver
                                        </Link>
                                        <Link
                                            href={`/dashboard/edit/${story.id}`}
                                            className="story-action-btn edit"
                                            title="Editar"
                                        >
                                            Editar
                                        </Link>
                                        <button
                                            onClick={() =>
                                                openDeleteModal(
                                                    story.id,
                                                    story.title
                                                )
                                            }
                                            className="story-action-btn delete"
                                            title="Excluir"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de confirmação de exclusão */}
            <DeleteModal
                isOpen={deleteModal.open}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteStory}
                title={deleteModal.title}
            />
        </div>
    );
}
