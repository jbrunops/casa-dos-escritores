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
        id: null,
        title: "",
        type: "story",
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
    const [error, setError] = useState(null);

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
        console.log("[DEBUG] openDeleteModal INICIADA com:", { id, title, type });
        try {
            setDeleteModal({
                open: true,
                id,
                title,
                type,
            });
            console.log("[DEBUG] openDeleteModal: setDeleteModal EXECUTADO.");
        } catch (e) {
            console.error("[DEBUG] Erro ao tentar definir estado em openDeleteModal:", e);
        }
    };

    const closeDeleteModal = () => {
        setDeleteModal({
            open: false,
            id: null,
            title: "",
            type: "story",
        });
    };

    const handleDelete = async () => {
        console.log("[DEBUG] handleDelete iniciado. Estado deleteModal:", deleteModal);
        if (!deleteModal.id || !deleteModal.type) {
            console.error("[DEBUG] ID ou Tipo inválido no deleteModal:", deleteModal);
            return;
        }

        try {
            setDeleting(true);
            const { id, type } = deleteModal;

            if (type === "story") {
                console.log(`[DEBUG] Tentando excluir STORY com ID: ${id}`);
                // Deletar história
                const { error } = await supabase
                    .from("stories")
                    .delete()
                    .eq("id", id);

                if (error) {
                    console.error("[DEBUG] Erro ao excluir STORY:", error);
                    throw error;
                }
                console.log(`[DEBUG] STORY com ID ${id} excluída com sucesso do DB.`);

            } else if (type === "series") {
                console.log(`[DEBUG] Tentando excluir SERIES com ID: ${id}`);
                // Verificar se a série tem capítulos
                const { count, error: countError } = await supabase
                    .from("chapters")
                    .select("id", { count: "exact" })
                    .eq("series_id", id);

                if (countError) {
                    console.error("[DEBUG] Erro ao contar capítulos da série:", countError);
                    throw countError;
                }

                if (count > 0) {
                    console.log(`[DEBUG] Excluindo ${count} capítulos da série ${id}...`);
                    const { error: chaptersError } = await supabase
                        .from("chapters")
                        .delete()
                        .eq("series_id", id);

                    if (chaptersError) {
                        console.error("[DEBUG] Erro ao excluir capítulos da série:", chaptersError);
                        throw chaptersError;
                    }
                    console.log(`[DEBUG] Capítulos da série ${id} excluídos.`);
                }

                // Deletar a série
                console.log(`[DEBUG] Excluindo a série ${id}...`);
                const { error } = await supabase
                    .from("series")
                    .delete()
                    .eq("id", id);

                if (error) {
                    console.error("[DEBUG] Erro ao excluir SERIES:", error);
                    throw error;
                }
                 console.log(`[DEBUG] SERIES com ID ${id} excluída com sucesso do DB.`);
            }

            setSuccessMessage(
                `${type === "story" ? "História" : "Série"} excluída com sucesso!`
            );
            closeDeleteModal();
            refreshData(); // Atualiza a lista após exclusão

            // Limpar mensagem de sucesso após 3 segundos
            setTimeout(() => {
                setSuccessMessage("");
            }, 3000);
        } catch (error) {
            console.error("[DEBUG] Erro GERAL ao excluir:", error);
            setSuccessMessage(
                `Erro ao excluir ${
                    deleteModal.type === "story" ? "história" : "série"
                }: ${error.message}`
            );
            // Limpar erro após 5 segundos
             setTimeout(() => {
                setSuccessMessage("");
            }, 5000);
        } finally {
            setDeleting(false);
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

    // Renderização condicional enquanto carrega
    if (loading) {
        return (
            <section className="content-wrapper py-8 min-h-screen">
                <div className="flex flex-col gap-6">
                    <div className="animate-pulse bg-gray-200 h-8 w-40 mb-4 rounded"></div>
                    <div className="animate-pulse bg-gray-200 h-32 rounded"></div>
                    <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
                </div>
            </section>
        );
    }

    return (
        <section className="content-wrapper py-8 min-h-screen">
            {/* Mensagem de sucesso */}
            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 mb-6 rounded relative">
                    <span className="block sm:inline">{successMessage}</span>
                    <button
                        onClick={() => setSuccessMessage("")}
                        className="absolute top-0 bottom-0 right-0 px-4 py-3"
                    >
                        <svg
                            className="fill-current h-6 w-6 text-green-500"
                            role="button"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                        >
                            <title>Fechar</title>
                            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Header do Dashboard */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    Olá, {profile?.username || "Escritor"}!
                </h1>
                <p className="text-gray-600">
                    Bem-vindo ao seu painel de controle. Aqui você pode
                    gerenciar suas histórias e acompanhar estatísticas.
                </p>
            </div>

            {/* Estatísticas do usuário */}
            <div className="mb-10 bg-white rounded-lg shadow p-6 border border-border">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Suas Estatísticas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-border flex flex-col">
                        <p className="text-gray-500 text-sm">
                            Histórias Publicadas
                        </p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-2xl font-bold text-primary">
                                {stats.publishedStories}
                            </p>
                            <span className="text-primary">
                                <BookOpen size={22} />
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-border flex flex-col">
                        <p className="text-gray-500 text-sm">
                            Total de Histórias
                        </p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-2xl font-bold text-primary">
                                {stats.totalStories}
                            </p>
                            <span className="text-primary">
                                <Layers size={22} />
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-border flex flex-col">
                        <p className="text-gray-500 text-sm">
                            Visualizações Totais
                        </p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-2xl font-bold text-primary">
                                {stats.totalViews}
                            </p>
                            <span className="text-primary">
                                <Eye size={22} />
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-border flex flex-col">
                        <p className="text-gray-500 text-sm">
                            Comentários Recebidos
                        </p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-2xl font-bold text-primary">
                                {stats.totalComments}
                            </p>
                            <span className="text-primary">
                                <MessageSquare size={22} />
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seção de Suas Histórias */}
            <div className="mb-10">
                <div className="flex flex-wrap items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Suas Histórias
                    </h2>
                    <div className="flex items-center space-x-2 mt-2 md:mt-0">
                        <button
                            onClick={refreshData}
                            className="flex items-center text-sm text-gray-600 hover:text-primary transition-colors duration-200"
                        >
                            <RefreshCw
                                size={16}
                                className={`mr-1 ${
                                    loadingStories && "animate-spin"
                                }`}
                            />
                            Atualizar
                        </button>
                        <Link
                            href="/dashboard/new-story"
                            className="bg-primary hover:bg-primary-dark text-white font-medium h-10 px-4 rounded-md flex items-center transition-colors duration-200"
                        >
                            <Plus size={18} className="mr-1.5" />
                            Nova História
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden border border-border">
                    {/* Filtros */}
                    <div className="flex border-b border-border">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`px-4 py-3 font-medium text-sm ${
                                activeTab === "all"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-primary"
                            }`}
                        >
                            Todas ({stories.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("published")}
                            className={`px-4 py-3 font-medium text-sm ${
                                activeTab === "published"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-primary"
                            }`}
                        >
                            Publicadas (
                            {
                                stories.filter(
                                    (story) => story.is_published
                                ).length
                            }
                            )
                        </button>
                        <button
                            onClick={() => setActiveTab("draft")}
                            className={`px-4 py-3 font-medium text-sm ${
                                activeTab === "draft"
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-primary"
                            }`}
                        >
                            Rascunhos (
                            {
                                stories.filter(
                                    (story) => !story.is_published
                                ).length
                            }
                            )
                        </button>
                    </div>

                    {/* Tabela de histórias */}
                    <div className="overflow-x-auto">
                        {loadingStories ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500">Carregando...</p>
                            </div>
                        ) : stories.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500 mb-4">
                                    Você ainda não tem histórias.
                                </p>
                                <Link
                                    href="/dashboard/new-story"
                                    className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                                >
                                    <PlusCircle
                                        className="mr-2"
                                        size={16}
                                    />
                                    Criar minha primeira história
                                </Link>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Título
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                                        >
                                            Categoria
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                                        >
                                            Status
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
                                        >
                                            Visualizações
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell"
                                        >
                                            Atualizada
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-border">
                                    {filteredStories.map((story) => (
                                        <tr key={story.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {story.title}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                                <div className="text-sm text-gray-500">
                                                    {story.category || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${
                                                    story.is_published
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                }`}
                                                >
                                                    {story.is_published
                                                        ? "Publicada"
                                                        : "Rascunho"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                                {story.view_count || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                                                {formatDate(story.updated_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Link
                                                        href={`/story/${generateSlug(
                                                            story.title,
                                                            story.id
                                                        )}`}
                                                        title="Visualizar"
                                                        className="text-gray-400 hover:text-primary"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                    <Link
                                                        href={`/dashboard/edit/${story.id}`}
                                                        title="Editar"
                                                        className="text-gray-400 hover:text-primary"
                                                    >
                                                        <Edit3 size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                story.id,
                                                                story.title,
                                                                "story"
                                                            )
                                                        }
                                                        title="Excluir"
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* ... resto do código ... */}

            {/* Modal de confirmação de exclusão */}
            <DeleteModal
                isOpen={deleteModal.open}
                title={`Excluir ${
                    deleteModal.type === "story" ? "História" : "Série"
                }`}
                message={`Tem certeza que deseja excluir "${deleteModal.title}"? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir"
                onConfirm={handleDelete}
                onCancel={closeDeleteModal}
                isDeleting={deleting}
            />
        </section>
    );
}
