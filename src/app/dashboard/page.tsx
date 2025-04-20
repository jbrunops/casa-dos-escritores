"use client";

import { useState, useEffect, Key } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import DeleteModal from "@/components/DeleteModal";
import { SupabaseClient, User } from "@supabase/supabase-js";
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
    Loader,
    CheckCircle,
    XCircle,
    LayoutGrid, // Added for grid view
    List, // Added for list view
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from 'next/image'; // Import Image

// --- Interfaces ---
interface Profile {
    id: string;
    username: string;
    avatar_url?: string | null;
    // Add other profile fields as needed
}

interface Story {
    id: string;
    title: string | null;
    created_at: string;
    updated_at: string;
    is_published: boolean;
    category: string | null;
    view_count: number;
    comment_count?: number; // Added later
}

interface Series {
    id: string;
    title: string | null;
    created_at: string;
    updated_at: string;
    is_completed: boolean;
    genre: string | null;
    view_count: number;
    chapter_count?: number; // Added later
    cover_url?: string | null; // Added cover URL
}

interface DashboardStats {
    totalStories: number;
    publishedStories: number;
    totalSeries: number;
    totalChapters: number;
    totalViews: number;       // Sum of story views
    totalSeriesViews: number; // Sum of series views
    totalComments: number;    // Sum of comments on stories
}

interface DeleteModalState {
    open: boolean;
    id: string | null;
    title: string;
    type: "story" | "series";
}

type ActiveTab = "all" | "stories" | "series";
type StoryFilter = "all" | "published" | "draft";
type SeriesFilter = "all" | "completed" | "ongoing";
type ViewMode = "grid" | "list";

// --- Utility Functions ---
const formatDate = (dateString: string): string => {
    try {
        return format(new Date(dateString), "PP 'às' p", { locale: ptBR });
    } catch {
        return "Data inválida";
    }
};

// --- Dashboard Page Component ---
export default function DashboardPage() {
    // State declarations with types
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stories, setStories] = useState<Story[]>([]);
    const [series, setSeries] = useState<Series[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        totalStories: 0,
        publishedStories: 0,
        totalSeries: 0,
        totalChapters: 0,
        totalViews: 0,
        totalSeriesViews: 0,
        totalComments: 0,
    });
    const [loading, setLoading] = useState(true);
    const [loadingStories, setLoadingStories] = useState(true);
    const [loadingSeries, setLoadingSeries] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [activeTab, setActiveTab] = useState<ActiveTab>("all");
    const [storyFilter, setStoryFilter] = useState<StoryFilter>("all");
    const [seriesFilter, setSeriesFilter] = useState<SeriesFilter>("all");
    const [viewMode, setViewMode] = useState<ViewMode>("grid"); // Default view mode
    const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
        open: false,
        id: null,
        title: "",
        type: "story",
    });

    const router = useRouter();
    const supabase = createBrowserClient();

    // --- Data Fetching Effects ---
    useEffect(() => {
        async function initialLoad() {
            setLoading(true);
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) {
                    router.push("/login");
                    return;
                }
                setUser(session.user);

                // Fetch profile first
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();

                if (profileError) throw profileError; // Rethrow to catch block
                setProfile(profileData as Profile);

                // Fetch everything else in parallel
                await Promise.allSettled([
                    fetchUserStories(session.user.id),
                    fetchUserSeries(session.user.id),
                    fetchUserStats(session.user.id),
                ]);

            } catch (error: any) {
                console.error("Erro ao carregar dashboard:", error);
                // TODO: Show error message to user
                if (error.message.includes("relation \"profiles\" does not exist")) {
                    // Handle case where profile might not be created yet
                    console.warn("Profile might not exist yet.");
                } else if (!error.message.includes('aborted')) { // Ignore cancelled requests
                    // Maybe push to an error page or show a toast
                }
            } finally {
                setLoading(false);
            }
        }

        initialLoad();

         // Cleanup function for AbortController if implemented
        // return () => { controller.abort(); };

    }, [supabase, router]); // Add dependencies

    // --- Fetching Functions ---
    async function fetchUserStories(userId: string) {
        setLoadingStories(true);
        try {
            const { data, error } = await supabase
                .from("stories")
                .select("*, view_count") // Select view_count
                .eq("author_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const storiesData = (data as Story[]) || [];

            // Fetch comment counts in parallel for stories
            const storiesWithCounts = await Promise.all(
                storiesData.map(async (story) => {
                    const { count, error: countError } = await supabase
                        .from("comments")
                        .select("id", { count: "exact", head: true })
                        .eq("story_id", story.id);
                    return {
                        ...story,
                        comment_count: countError ? 0 : count ?? 0,
                    };
                })
            );
            setStories(storiesWithCounts);
        } catch (error: any) {
            console.error("Erro ao buscar histórias:", error);
            setStories([]); // Reset on error
        } finally {
            setLoadingStories(false);
        }
    }

    async function fetchUserSeries(userId: string) {
        setLoadingSeries(true);
        try {
            const { data, error } = await supabase
                .from("series")
                .select("*, view_count, cover_url") // Select view_count and cover_url
                .eq("author_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            const seriesData = (data as Series[]) || [];

            // Fetch chapter counts in parallel for series
            const seriesWithCounts = await Promise.all(
                seriesData.map(async (serie) => {
                    const { count, error: countError } = await supabase
                        .from("chapters")
                        .select("id", { count: "exact", head: true })
                        .eq("series_id", serie.id);
                    return {
                        ...serie,
                        chapter_count: countError ? 0 : count ?? 0,
                    };
                })
            );
            setSeries(seriesWithCounts);
        } catch (error: any) {
            console.error("Erro ao buscar séries:", error);
            setSeries([]); // Reset on error
        } finally {
            setLoadingSeries(false);
        }
    }

    async function fetchUserStats(userId: string) {
        setLoadingStats(true);
        try {
            // Use RPC for potentially better performance if function exists
            // const { data: statsData, error: rpcError } = await supabase.rpc('get_user_dashboard_stats', { user_id_param: userId });
            // if (!rpcError && statsData) {
            //     setStats(statsData);
            //     return;
            // }
            // console.warn("RPC get_user_dashboard_stats failed or doesn't exist, falling back to client-side aggregation.", rpcError);

            // Fallback: Fetch data client-side (less efficient)
            const { data: allStories, error: storiesError } = await supabase
                .from("stories")
                .select("id, is_published, view_count")
                .eq("author_id", userId);

            const { data: allSeries, error: seriesError } = await supabase
                 .from("series")
                 .select("id, view_count")
                 .eq("author_id", userId);

             const { count: chaptersCount, error: chaptersError } = await supabase
                 .from("chapters")
                 .select("id", { count: "exact", head: true })
                 .eq("author_id", userId);

            const { count: commentsCount, error: commentsError } = await supabase
                .from("comments")
                .select("id", { count: "exact", head: true })
                .eq("author_id", userId);
                // Note: This counts ALL user comments, not just on their stories.
                // Need a more complex query/RPC for comments *on user's content*.

            if (storiesError || seriesError || chaptersError || commentsError) {
                console.error("Error fetching stats data:", { storiesError, seriesError, chaptersError, commentsError });
                throw new Error("Failed to fetch some statistics data.");
            }

            const totalStories = allStories?.length ?? 0;
            const publishedStories = allStories?.filter(s => s.is_published).length ?? 0;
            const totalViews = allStories?.reduce((sum, s) => sum + (s.view_count || 0), 0) ?? 0;
            const totalSeries = allSeries?.length ?? 0;
            const totalSeriesViews = allSeries?.reduce((sum, s) => sum + (s.view_count || 0), 0) ?? 0;
            const totalChapters = chaptersCount ?? 0;
            const totalComments = commentsCount ?? 0; // Reminder: this is total comments BY user

            setStats({ totalStories, publishedStories, totalSeries, totalChapters, totalViews, totalSeriesViews, totalComments });

        } catch (error: any) {
            console.error("Erro ao buscar estatísticas:", error);
            // Keep default stats on error
        } finally {
            setLoadingStats(false);
        }
    }

    // --- Action Handlers ---
    const refreshData = async () => {
        if (!user) return;
        setLoading(true); // Indicate overall refresh
        setSuccessMessage(""); // Clear previous success message
        try {
             await Promise.allSettled([
                fetchUserStories(user.id),
                fetchUserSeries(user.id),
                fetchUserStats(user.id),
            ]);
        } catch (error) {
            console.error("Erro ao atualizar dados:", error);
        } finally {
             setLoading(false);
        }
    };

    const openDeleteModal = (id: string, title: string, type: "story" | "series") => {
        setDeleteModal({ open: true, id, title, type });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ open: false, id: null, title: "", type: "story" });
    };

    const handleDelete = async () => {
        if (!deleteModal.id || !user) return;
        setDeleting(true);
        setSuccessMessage("");
        const { id, type } = deleteModal;

        try {
            let deleteError: any = null;
            if (type === "story") {
                // Delete comments associated with the story first (optional, depends on cascade setup)
                 const { error: commentDeleteError } = await supabase
                    .from("comments")
                    .delete()
                    .eq("story_id", id);
                 if(commentDeleteError) console.warn("Could not delete comments for story:", commentDeleteError);

                // Delete the story
                const { error } = await supabase.from("stories").delete().eq("id", id);
                deleteError = error;
            } else {
                // Delete series - requires deleting chapters first
                // Consider using the dedicated API endpoint for safety: /api/series/delete?id=...
                // Or perform cascade delete here (requires service key or appropriate RLS/triggers)

                // 1. Delete chapters
                const { error: chapterError } = await supabase
                    .from("chapters")
                    .delete()
                    .eq("series_id", id);
                if (chapterError) {
                    console.error("Failed to delete chapters:", chapterError);
                     throw new Error("Failed to delete chapters before deleting series.");
                }

                // 2. Delete comments (if linked to series directly - check schema)
                // const { error: commentDeleteError } = await supabase.from("comments").delete().eq("series_id", id);

                // 3. Delete series
                 const { error } = await supabase.from("series").delete().eq("id", id);
                 deleteError = error;
            }

            if (deleteError) {
                throw deleteError;
            }

            setSuccessMessage(`${type === "story" ? "História" : "Série"} excluída com sucesso!`);
            closeDeleteModal();
            // Refresh data after deletion
            await refreshData(); // Await refresh to ensure UI updates

            // Clear success message after a delay
             setTimeout(() => setSuccessMessage(""), 4000);

        } catch (error: any) {
            console.error(`Erro ao excluir ${type}:`, error);
            // Show error in modal or via toast
            setDeleteModal(prev => ({ ...prev, error: error.message || `Falha ao excluir ${type}` }));
        } finally {
            setDeleting(false);
        }
    };

    // --- Filtering Logic ---
    const filteredStories = stories.filter(story => {
        if (storyFilter === "all") return true;
        if (storyFilter === "published") return story.is_published;
        if (storyFilter === "draft") return !story.is_published;
        return true;
    });

    const filteredSeries = series.filter(s => {
        if (seriesFilter === "all") return true;
        if (seriesFilter === "completed") return s.is_completed;
        if (seriesFilter === "ongoing") return !s.is_completed;
        return true;
    });

    // --- Render Functions ---
    const renderStatCard = (label: string, value: number | string, icon: React.ReactNode) => (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-border flex items-start space-x-3">
            <div className="text-[#484DB5]">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                {loadingStats ? (
                     <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                    <p className="text-2xl font-semibold text-gray-900">{value}</p>
                )}
            </div>
        </div>
    );

     const renderContentCard = (item: Story | Series) => {
        const isStory = "category" in item;
        const type = isStory ? "story" : "series";
        const title = item.title || (isStory ? "História sem título" : "Série sem título");
        const linkPrefix = isStory ? "/story" : "/obra";
        const editLink = `/edit/${type}/${item.id}`;
        const viewLink = `${linkPrefix}/${item.id}`;
        const status = isStory
            ? (item as Story).is_published ? "Publicado" : "Rascunho"
            : (item as Series).is_completed ? "Completa" : "Em andamento";
        const statusColor = isStory
            ? (item as Story).is_published ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
            : (item as Series).is_completed ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800";
        const coverUrl = !isStory ? (item as Series).cover_url : null;

        return (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-border flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                 {coverUrl && (
                    <Link href={viewLink} className="block relative w-full h-32 bg-gray-100 group">
                        <Image
                            src={coverUrl}
                            alt={`Capa de ${title}`}
                            layout="fill"
                            objectFit="cover"
                             className="transition-transform duration-300 group-hover:scale-105"
                        />
                    </Link>
                )}
                <div className="p-4 flex flex-col flex-grow">
                     <span className={`text-xs font-medium uppercase tracking-wider mb-2 px-2 py-0.5 rounded-full inline-block self-start ${statusColor}`}>
                        {status}
                    </span>
                    <h3 className="text-md font-semibold text-gray-900 mb-1 line-clamp-2">
                        <Link href={viewLink} className="hover:text-[#484DB5] transition-colors">
                            {title}
                        </Link>
                    </h3>
                     <p className="text-xs text-gray-500 mb-3">
                        Criado: {formatDate(item.created_at)} • Atualizado: {formatDate(item.updated_at)}
                    </p>
                     <div className="text-xs text-gray-600 space-y-1 mb-4 flex-grow">
                        <p>Vis.: {item.view_count || 0}</p>
                        {isStory && <p>Coment.: {(item as Story).comment_count ?? 0}</p>}
                        {!isStory && <p>Caps.: {(item as Series).chapter_count ?? 0}</p>}
                    </div>
                    <div className="mt-auto border-t border-gray-100 pt-3 flex justify-between items-center space-x-2">
                        <div className="flex space-x-1">
                             <Link href={viewLink} className="p-1 text-gray-500 hover:text-blue-600" title="Ver">
                                <Eye size={16} />
                            </Link>
                            <Link href={editLink} className="p-1 text-gray-500 hover:text-green-600" title="Editar">
                                <Edit3 size={16} />
                            </Link>
                        </div>
                         <button onClick={() => openDeleteModal(item.id, title, type)} className="p-1 text-gray-500 hover:text-red-600" title="Excluir">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

     const renderContentListItem = (item: Story | Series) => {
        const isStory = "category" in item;
        const type = isStory ? "story" : "series";
        const title = item.title || (isStory ? "História sem título" : "Série sem título");
        const linkPrefix = isStory ? "/story" : "/obra";
        const editLink = `/edit/${type}/${item.id}`;
        const viewLink = `${linkPrefix}/${item.id}`;
         const status = isStory
            ? (item as Story).is_published ? "Publicado" : "Rascunho"
            : (item as Series).is_completed ? "Completa" : "Em andamento";
        const statusColor = isStory
            ? (item as Story).is_published ? "text-green-600" : "text-yellow-600"
            : (item as Series).is_completed ? "text-blue-600" : "text-purple-600";

        return (
            <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={viewLink} className="text-sm font-medium text-gray-900 hover:text-[#484DB5]">
                        {title}
                    </Link>
                 </td>
                 <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${statusColor}`}>{status}</td>
                 <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.view_count || 0}</td>
                 <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                     {isStory ? (item as Story).comment_count ?? 0 : (item as Series).chapter_count ?? 0}
                 </td>
                 <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{formatDate(item.updated_at)}</td>
                 <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link href={viewLink} className="text-indigo-600 hover:text-indigo-900" title="Ver">
                        <Eye size={18} />
                    </Link>
                    <Link href={editLink} className="text-green-600 hover:text-green-900" title="Editar">
                        <Edit3 size={18} />
                    </Link>
                    <button onClick={() => openDeleteModal(item.id, title, type)} className="text-red-600 hover:text-red-900" title="Excluir">
                        <Trash2 size={18} />
                    </button>
                </td>
            </tr>
        );
    };

    // --- Main Render ---
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader size={40} className="animate-spin text-[#484DB5]" />
            </div>
        );
    }

    if (!user || !profile) {
        // Should have been redirected by useEffect, but as a fallback:
        return <p className="p-8 text-center text-red-600">Erro: Usuário não autenticado ou perfil não encontrado.</p>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center space-x-4">
                     {profile.avatar_url && (
                        <Image
                            src={profile.avatar_url}
                            alt={`Avatar de ${profile.username}`}
                            width={50}
                            height={50}
                            className="rounded-full border-2 border-white shadow-sm"
                        />
                    )}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Seu Painel, {profile.username}</h1>
                        <p className="text-gray-600">Gerencie suas criações.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 flex-wrap">
                     <button
                        onClick={refreshData}
                        disabled={loading}
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
                        Atualizar
                    </button>
                     <Link
                        href="/write"
                        className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#484DB5] hover:bg-[#484DB5]/90"
                    >
                        <PlusCircle size={16} className="mr-2" />
                        Criar Novo
                    </Link>
                 </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md flex items-center justify-between">
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage("")}><XCircle size={16} /></button>
                 </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {renderStatCard("Total de Histórias", stats.totalStories, <BookOpen size={20} />)}
                {renderStatCard("Total de Séries", stats.totalSeries, <Layers size={20} />)}
                {renderStatCard("Total de Visualizações", stats.totalViews + stats.totalSeriesViews, <Eye size={20} />)}
                {renderStatCard("Comentários Recebidos", stats.totalComments, <MessageSquare size={20} />)} 
            </div>

             {/* Tabs for Content Type */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {["all", "stories", "series"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as ActiveTab)}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
                                activeTab === tab
                                    ? 'border-[#484DB5] text-[#484DB5]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab === 'all' ? 'Tudo' : tab === 'stories' ? 'Histórias' : 'Séries'}
                         </button>
                    ))}
                </nav>
            </div>

             {/* Filters and View Toggle */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                 {/* Filters - Shown based on active tab */}
                 <div className="flex space-x-2 flex-wrap">
                    {activeTab !== 'series' && (
                        <select
                            value={storyFilter}
                            onChange={(e) => setStoryFilter(e.target.value as StoryFilter)}
                             className="text-sm p-1.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">Todas as Histórias</option>
                            <option value="published">Publicadas</option>
                            <option value="draft">Rascunhos</option>
                        </select>
                    )}
                    {activeTab !== 'stories' && (
                        <select
                            value={seriesFilter}
                            onChange={(e) => setSeriesFilter(e.target.value as SeriesFilter)}
                            className="text-sm p-1.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">Todas as Séries</option>
                            <option value="completed">Completas</option>
                            <option value="ongoing">Em Andamento</option>
                        </select>
                    )}
                </div>

                 {/* View Mode Toggle */}
                 <div className="flex space-x-1 border border-gray-300 rounded-md p-0.5">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                        aria-label="Visualização em Grade"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                        aria-label="Visualização em Lista"
                     >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Content Display */}
            <div className="mt-6">
                 {(loadingStories || loadingSeries) && (
                     <div className="flex justify-center items-center py-10">
                        <Loader size={30} className="animate-spin text-[#484DB5]" />
                    </div>
                 )}

                {/* Check for empty state AFTER loading */}
                {!loadingStories && !loadingSeries &&
                    (activeTab === 'all' && filteredStories.length === 0 && filteredSeries.length === 0) ||
                    (activeTab === 'stories' && filteredStories.length === 0) ||
                    (activeTab === 'series' && filteredSeries.length === 0) ? (
                     <p className="text-center text-gray-500 py-10">Nenhum conteúdo encontrado com os filtros selecionados.</p>
                 ) : (
                     <> {/* Wrapper to render grid or list */} 
                         {/* Grid View */}
                         {viewMode === 'grid' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(activeTab === 'all' || activeTab === 'stories') && filteredStories.map(renderContentCard)}
                                {(activeTab === 'all' || activeTab === 'series') && filteredSeries.map(renderContentCard)}
                            </div>
                         )}

                         {/* List View */}
                         {viewMode === 'list' && (
                             <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-border">
                                 <table className="min-w-full divide-y divide-gray-200">
                                     <thead className="bg-gray-50">
                                        <tr>
                                             <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                                             <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                             <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vis.</th>
                                             {/* Conditional TH based on activeTab */} 
                                             <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                 {activeTab === 'series' ? 'Caps.' : 'Coment.'}
                                             </th>
                                             <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Última Atualização</th>
                                             <th scope="col" className="relative px-4 py-3"><span className="sr-only">Ações</span></th>
                                        </tr>
                                    </thead>
                                     <tbody className="bg-white divide-y divide-gray-200">
                                        {(activeTab === 'all' || activeTab === 'stories') && filteredStories.map(renderContentListItem)}
                                        {/* REMOVED Redundant Check: activeTab === 'series' */}
                                        {(activeTab === 'all' || activeTab === 'series') && filteredSeries.map(renderContentListItem)}
                                    </tbody>
                                </table>
                            </div>
                         )}
                     </> /* End Wrapper */
                 )}
            </div>

            {/* Delete Confirmation Modal - Corrected Props */}
            <DeleteModal
                isOpen={deleteModal.open}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                title={deleteModal.title} // Pass the title from state
                isDeleting={deleting}
            />
        </div>
    );
} 