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
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-[#484DB5] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Carregando seu painel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[75rem] mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Meu Dashboard</h1>
                    <p className="text-gray-600 mt-1">Bem-vindo, {profile?.username || "Escritor"}</p>
                </div>

                <div className="flex items-center mt-4 sm:mt-0">
                    <Link href="/dashboard/new" className="h-10 px-4 flex items-center bg-[#484DB5] text-white rounded-md hover:shadow-md transition-shadow duration-200">
                        <PlusCircle size={20} className="mr-2" />
                        <span>Nova História</span>
                    </Link>
                </div>
            </div>

            {successMessage && (
                <div className="bg-green-50 text-green-700 p-4 rounded-md mb-8">
                    {successMessage}
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] hover:shadow-md transition-shadow duration-200">
                    <div className="text-center">
                        <span className="block text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalStories}</span>
                        <span className="text-sm sm:text-base text-gray-600">Total de histórias</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] hover:shadow-md transition-shadow duration-200">
                    <div className="text-center">
                        <span className="block text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.publishedStories}</span>
                        <span className="text-sm sm:text-base text-gray-600">Publicadas</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] hover:shadow-md transition-shadow duration-200">
                    <div className="text-center">
                        <span className="block text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalViews}</span>
                        <span className="text-sm sm:text-base text-gray-600">Visualizações</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] hover:shadow-md transition-shadow duration-200">
                    <div className="text-center">
                        <span className="block text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalComments}</span>
                        <span className="text-sm sm:text-base text-gray-600">Comentários</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-[#E5E7EB] mb-8">
                <div className="p-6 border-b border-[#E5E7EB]">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 sm:mb-0">Minhas Histórias</h2>

                        <div className="flex flex-wrap gap-2">
                            <button
                                className={`h-10 px-2 sm:px-4 text-sm sm:text-base rounded-md transition-shadow duration-200 ${
                                    activeTab === "all" 
                                    ? "bg-[#484DB5] text-white" 
                                    : "bg-white border border-[#E5E7EB] text-gray-600 hover:shadow-md"
                                }`}
                                onClick={() => setActiveTab("all")}
                            >
                                Todas
                            </button>
                            <button
                                className={`h-10 px-2 sm:px-4 text-sm sm:text-base rounded-md transition-shadow duration-200 ${
                                    activeTab === "published"
                                    ? "bg-[#484DB5] text-white"
                                    : "bg-white border border-[#E5E7EB] text-gray-600 hover:shadow-md"
                                }`}
                                onClick={() => setActiveTab("published")}
                            >
                                Publicadas
                            </button>
                            <button
                                className={`h-10 px-2 sm:px-4 text-sm sm:text-base rounded-md transition-shadow duration-200 ${
                                    activeTab === "drafts"
                                    ? "bg-[#484DB5] text-white"
                                    : "bg-white border border-[#E5E7EB] text-gray-600 hover:shadow-md"
                                }`}
                                onClick={() => setActiveTab("drafts")}
                            >
                                Rascunhos
                            </button>
                        </div>
                    </div>
                </div>

                {loadingStories ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-8 h-8 border-4 border-[#484DB5] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-600">Carregando histórias...</p>
                        </div>
                    </div>
                ) : filteredStories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <p className="text-gray-600 mb-4">
                            {activeTab === "all"
                                ? "Você ainda não criou nenhuma história."
                                : activeTab === "published"
                                ? "Você ainda não publicou nenhuma história."
                                : "Você não tem nenhum rascunho."}
                        </p>
                        <Link href="/dashboard/new" className="h-10 px-4 flex items-center bg-[#484DB5] text-white rounded-md hover:shadow-md transition-shadow duration-200">
                            Criar minha primeira história
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-[#E5E7EB]">
                        {filteredStories.map((story) => (
                            <div key={story.id} className="flex justify-between items-center p-6 hover:bg-gray-50">
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900 mb-1">
                                        {story.title}
                                    </h3>

                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                        <span>{story.category || "Sem categoria"}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            story.is_published
                                                ? "bg-green-100 text-green-700"
                                                : "bg-yellow-100 text-yellow-700"
                                        }`}>
                                            {story.is_published ? "Publicado" : "Rascunho"}
                                        </span>
                                    </div>

                                    <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                                        <span className="flex items-center">
                                            <Eye size={14} className="mr-1" />
                                            {story.view_count || 0}
                                        </span>
                                        <span className="flex items-center">
                                            <MessageSquare size={14} className="mr-1" />
                                            {story.comment_count || 0}
                                        </span>
                                        <span className="flex items-center">
                                            <BookOpen size={14} className="mr-1" />
                                            {formatDate(story.created_at)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Link
                                        href={`/story/${generateSlug(story.title, story.id)}`}
                                        className="h-10 w-10 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:shadow-md transition-shadow duration-200"
                                        title="Visualizar"
                                    >
                                        <Eye size={18} className="text-gray-600" />
                                    </Link>

                                    <Link
                                        href={`/dashboard/edit/${story.id}`}
                                        className="h-10 w-10 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:shadow-md transition-shadow duration-200"
                                        title="Editar"
                                    >
                                        <Edit3 size={18} className="text-gray-600" />
                                    </Link>

                                    <button
                                        onClick={() => openDeleteModal(story.id, story.title)}
                                        className="h-10 w-10 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:shadow-md transition-shadow duration-200"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} className="text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg border border-[#E5E7EB]">
                <div className="p-6 border-b border-[#E5E7EB] flex flex-row justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Minhas Séries</h2>
                    <Link href="/series" className="h-10 px-4 flex items-center text-[#484DB5] hover:shadow-md transition-shadow duration-200 whitespace-nowrap">
                        <BookOpen size={18} className="mr-2" />
                        <span>Ver minhas séries</span>
                    </Link>
                </div>
                
                <div className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <span className="block text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{series.length}</span>
                            <span className="text-sm sm:text-base text-gray-600">Total de séries</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                                {series.filter(s => s.is_completed).length}
                            </span>
                            <span className="text-sm sm:text-base text-gray-600">Completas</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                                {series.filter(s => !s.is_completed).length}
                            </span>
                            <span className="text-sm sm:text-base text-gray-600">Em andamento</span>
                        </div>
                    </div>
                    <div className="mt-6 text-center">
                        <Link href="/dashboard/new-series" className="h-10 px-4 inline-flex items-center bg-[#484DB5] text-white rounded-md hover:shadow-md transition-shadow duration-200">
                            <Plus size={20} className="mr-2" />
                            <span>Criar nova série</span>
                        </Link>
                    </div>
                </div>
            </div>

            <DeleteModal
                isOpen={deleteModal.open}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                title={deleteModal.title}
                loading={deleting}
            />
        </div>
    );
}
