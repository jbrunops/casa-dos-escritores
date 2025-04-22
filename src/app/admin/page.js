"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { hasRole, ROLES } from "@/utils/userRoles";
import {
    Users,
    BookOpen,
    MessageSquare,
    RefreshCw,
    Eye,
    Edit,
    Trash2,
    ArrowLeft,
    Shield,
    Calendar,
    Mail,
    AlertTriangle,
    CheckCircle2,
    ChevronRight
} from "lucide-react";

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [stories, setStories] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("users");
    const [statusMessage, setStatusMessage] = useState({
        type: "",
        message: "",
    });
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const supabase = createBrowserClient();

    // Detectar dispositivo móvel
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        async function checkAccess() {
            try {
                const isAdmin = await hasRole(ROLES.ADMIN);
                if (!isAdmin) {
                    router.push("/unauthorized");
                    return;
                }

                loadData();
            } catch (error) {
                console.error("Erro ao verificar permissões:", error);
                router.push("/unauthorized");
            }
        }

        checkAccess();
    }, [router]);

    async function loadData() {
        setLoading(true);
        setStatusMessage({ type: "", message: "" });

        try {
            // Carregar usuários
            const { data: usersData, error: usersError } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });

            if (usersError) throw usersError;
            setUsers(usersData || []);

            // Carregar histórias
            const { data: storiesData, error: storiesError } = await supabase
                .from("stories")
                .select(
                    `
                    id, 
                    title,
                    is_published,
                    created_at,
                    profiles(username)
                `
                )
                .order("created_at", { ascending: false })
                .limit(50);

            if (storiesError) throw storiesError;
            setStories(storiesData || []);

            // Carregar comentários recentes
            const { data: commentsData, error: commentsError } = await supabase
                .from("comments")
                .select(
                    `
                    id,
                    text,
                    created_at,
                    author_id:profiles!inner(username),
                    stories(title)
                `
                )
                .order("created_at", { ascending: false })
                .limit(50);

            if (commentsError) throw commentsError;
            setComments(commentsData || []);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            setStatusMessage({
                type: "error",
                message:
                    "Erro ao carregar dados. Por favor, atualize a página.",
            });
        } finally {
            setLoading(false);
        }
    }

    async function setUserRole(userId, newRole) {
        setActionLoading(true);
        setStatusMessage({ type: "", message: "" });

        try {
            const { error } = await supabase
                .from("profiles")
                .update({ role: newRole })
                .eq("id", userId);

            if (error) throw error;

            // Atualizar a lista de usuários localmente
            setUsers(
                users.map((user) =>
                    user.id === userId ? { ...user, role: newRole } : user
                )
            );

            setStatusMessage({
                type: "success",
                message: "Permissão do usuário atualizada com sucesso!",
            });

            // Recarregar dados após um breve período
            setTimeout(() => {
                loadData();
            }, 2000);
        } catch (error) {
            console.error("Erro ao atualizar role:", error);
            setStatusMessage({
                type: "error",
                message:
                    "Erro ao atualizar permissões do usuário. Tente novamente.",
            });
        } finally {
            setActionLoading(false);
        }
    }

    async function deleteUser(userId, username) {
        if (
            !confirm(
                `ATENÇÃO: Você está prestes a excluir o usuário "${username}" e TODOS os seus conteúdos (histórias, comentários, etc.). Esta ação não pode ser desfeita. Tem certeza?`
            )
        ) {
            return;
        }

        setActionLoading(true);
        setStatusMessage({ type: "", message: "" });

        try {
            // Novo passo: Excluir notificações enviadas pelo usuário
            const { error: notificationsError } = await supabase
                .from("notifications")
                .delete()
                .eq("sender_id", userId);

            if (notificationsError) throw notificationsError;

            // Etapa 1: Excluir histórias do usuário
            const { error: storiesError } = await supabase
                .from("stories")
                .delete()
                .eq("author_id", userId);

            if (storiesError) throw storiesError;

            // Etapa 2: Excluir comentários do usuário
            const { error: commentsError } = await supabase
                .from("comments")
                .delete()
                .eq("author_id", userId);

            if (commentsError) throw commentsError;

            // Etapa 3: Excluir perfil do usuário
            const { error: profileError } = await supabase
                .from("profiles")
                .delete()
                .eq("id", userId);

            if (profileError) throw profileError;

            // Tentar excluir o usuário da autenticação via API
            try {
                const response = await fetch("/api/admin/delete-user", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ userId }),
                });

                if (!response.ok) {
                    console.warn(
                        "Aviso: Registro de autenticação não foi excluído completamente"
                    );
                }
            } catch (authError) {
                console.warn(
                    "Aviso: Não foi possível excluir registro de autenticação",
                    authError
                );
            }

            setStatusMessage({
                type: "success",
                message: `Usuário ${username} foi excluído com sucesso!`,
            });

            // Atualizar UI removendo o usuário da lista
            setUsers(users.filter((user) => user.id !== userId));

            // Recarregar dados após um breve período
            setTimeout(() => {
                loadData();
            }, 3000);
        } catch (error) {
            console.error("Erro ao excluir usuário:", error);
            setStatusMessage({
                type: "error",
                message: `Erro ao excluir usuário: ${error.message}`,
            });
        } finally {
            setActionLoading(false);
        }
    }

    async function deleteContent(contentType, id) {
        if (!confirm(`Tem certeza que deseja excluir este ${contentType}?`)) {
            return;
        }

        setActionLoading(true);
        setStatusMessage({ type: "", message: "" });

        try {
            const { error } = await supabase
                .from(contentType)
                .delete()
                .eq("id", id);

            if (error) throw error;

            // Atualizar listas localmente
            if (contentType === "stories") {
                setStories(stories.filter((story) => story.id !== id));
                setStatusMessage({
                    type: "success",
                    message: "História excluída com sucesso!",
                });
            } else if (contentType === "comments") {
                setComments(comments.filter((comment) => comment.id !== id));
                setStatusMessage({
                    type: "success",
                    message: "Comentário excluído com sucesso!",
                });
            }

            // Recarregar dados após um breve período
            setTimeout(() => {
                loadData();
            }, 2000);
        } catch (error) {
            console.error(`Erro ao excluir ${contentType}:`, error);
            setStatusMessage({
                type: "error",
                message: `Erro ao excluir ${contentType}. Tente novamente.`,
            });
        } finally {
            setActionLoading(false);
        }
    }

    // Formatar data de maneira amigável
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { 
            day: '2-digit', 
            month: '2-digit', 
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('pt-BR', options);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen flex-col">
                <RefreshCw size={40} className="animate-spin text-[#484DB5] mb-4" />
                <p className="text-gray-700 font-medium">Carregando painel administrativo...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[75rem] mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6 border-b border-[#E5E7EB] pb-4">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => router.back()} 
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200" 
                        aria-label="Voltar para página anterior"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
                </div>
                
                <button 
                    onClick={loadData} 
                    className="h-[2.5rem] px-4 flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={actionLoading || loading}
                >
                    <RefreshCw size={18} className={actionLoading ? "animate-spin" : ""} />
                    {!isMobile && <span>Atualizar</span>}
                </button>
            </div>

            {statusMessage.type && (
                <div className={`flex items-center gap-2 p-4 mb-6 rounded-md ${
                    statusMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>
                    {statusMessage.type === "success" ? (
                        <CheckCircle2 size={20} />
                    ) : (
                        <AlertTriangle size={20} />
                    )}
                    <span>{statusMessage.message}</span>
                </div>
            )}

            <div className="flex border-b border-[#E5E7EB] mb-6">
                <button
                    className={`flex items-center gap-2 px-4 py-3 font-medium ${
                        activeTab === "users" 
                            ? "text-[#484DB5] border-b-2 border-[#484DB5]" 
                            : "text-gray-500 hover:text-gray-800 transition-colors duration-200"
                    }`}
                    onClick={() => setActiveTab("users")}
                >
                    <Users size={18} />
                    <span className="hidden sm:inline">Usuários</span>
                    <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-xs">{users.length}</span>
                </button>
                
                <button
                    className={`flex items-center gap-2 px-4 py-3 font-medium ${
                        activeTab === "stories" 
                            ? "text-[#484DB5] border-b-2 border-[#484DB5]" 
                            : "text-gray-500 hover:text-gray-800 transition-colors duration-200"
                    }`}
                    onClick={() => setActiveTab("stories")}
                >
                    <BookOpen size={18} />
                    <span className="hidden sm:inline">Histórias</span>
                    <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-xs">{stories.length}</span>
                </button>
                
                <button
                    className={`flex items-center gap-2 px-4 py-3 font-medium ${
                        activeTab === "comments" 
                            ? "text-[#484DB5] border-b-2 border-[#484DB5]" 
                            : "text-gray-500 hover:text-gray-800 transition-colors duration-200"
                    }`}
                    onClick={() => setActiveTab("comments")}
                >
                    <MessageSquare size={18} />
                    <span className="hidden sm:inline">Comentários</span>
                    <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-xs">{comments.length}</span>
                </button>
            </div>

            <div className="w-full">
                {/* Conteúdo de usuários */}
                {activeTab === "users" && (
                    <div>
                        {users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <Shield size={40} className="mb-2" />
                                <p>Nenhum usuário encontrado</p>
                            </div>
                        ) : (
                            <>
                                {/* Versão mobile - exibe cards */}
                                <div className="grid gap-4 md:hidden">
                                    {users.map(user => (
                                        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm p-4" key={user.id}>
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-medium text-gray-900">{user.username}</h3>
                                                <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                                                    user.role === 'moderator' ? 'bg-blue-100 text-blue-700' : 
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {user.role === 'admin' ? 'Administrador' : 
                                                     user.role === 'moderator' ? 'Moderador' : 'Usuário'}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail size={16} />
                                                    <span>{user.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar size={16} />
                                                    <span>{formatDate(user.created_at)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="border-t border-[#E5E7EB] pt-3">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <label htmlFor={`role-${user.id}`} className="text-sm text-gray-700">Função:</label>
                                                    <select
                                                        id={`role-${user.id}`}
                                                        value={user.role || "user"}
                                                        onChange={(e) => setUserRole(user.id, e.target.value)}
                                                        disabled={actionLoading}
                                                        className="flex-1 h-[2.5rem] px-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#484DB5]/20 focus:border-[#484DB5]"
                                                    >
                                                        <option value="user">Usuário</option>
                                                        <option value="moderator">Moderador</option>
                                                        <option value="admin">Administrador</option>
                                                    </select>
                                                </div>
                                                
                                                <div className="flex gap-2 mt-2">
                                                    <Link
                                                        href={`/profile/${encodeURIComponent(user.username)}`}
                                                        className="flex-1 h-[2.5rem] flex items-center justify-center gap-1 bg-gray-50 border border-[#E5E7EB] rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                                                    >
                                                        <Eye size={16} />
                                                        <span>Ver</span>
                                                    </Link>
                                                    
                                                    <button
                                                        onClick={() => deleteUser(user.id, user.username)}
                                                        className="flex-1 h-[2.5rem] flex items-center justify-center gap-1 bg-red-50 border border-red-200 rounded-md text-red-600 hover:bg-red-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        disabled={actionLoading || user.role === "admin"}
                                                        title={user.role === "admin" ? "Não é possível excluir um administrador" : "Excluir usuário"}
                                                    >
                                                        <Trash2 size={16} />
                                                        <span>Excluir</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Versão desktop - exibe tabela */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-left">
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB]">Usuário</th>
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB]">E-mail</th>
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB]">Criado em</th>
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB]">Função</th>
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB]">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id} className="border-b border-[#E5E7EB] hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {user.username}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {user.email}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {formatDate(user.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={user.role || "user"}
                                                            onChange={(e) => setUserRole(user.id, e.target.value)}
                                                            disabled={actionLoading}
                                                            className="h-[2.5rem] w-full px-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#484DB5]/20 focus:border-[#484DB5]"
                                                        >
                                                            <option value="user">Usuário</option>
                                                            <option value="moderator">Moderador</option>
                                                            <option value="admin">Administrador</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={`/profile/${encodeURIComponent(user.username)}`}
                                                                className="h-[2.5rem] px-3 flex items-center justify-center gap-1 bg-gray-50 border border-[#E5E7EB] rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                                                            >
                                                                <Eye size={16} />
                                                                <span>Ver</span>
                                                            </Link>
                                                            <button
                                                                onClick={() => deleteUser(user.id, user.username)}
                                                                className="h-[2.5rem] px-3 flex items-center justify-center gap-1 bg-red-50 border border-red-200 rounded-md text-red-600 hover:bg-red-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                disabled={actionLoading || user.role === "admin"}
                                                                title={
                                                                    user.role === "admin"
                                                                        ? "Não é possível excluir um administrador"
                                                                        : "Excluir usuário"
                                                                }
                                                            >
                                                                <Trash2 size={16} />
                                                                <span>Excluir</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Conteúdo de histórias */}
                {activeTab === "stories" && (
                    <div>
                        {stories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <BookOpen size={40} className="mb-2" />
                                <p>Nenhuma história encontrada</p>
                            </div>
                        ) : (
                            <>
                                {/* Versão mobile - exibe cards */}
                                <div className="grid gap-4 md:hidden">
                                    {stories.map(story => (
                                        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm p-4" key={story.id}>
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-medium text-gray-900">{story.title}</h3>
                                                <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    story.is_published 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {story.is_published ? "Publicado" : "Rascunho"}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Users size={16} />
                                                    <span>Autor: {story.profiles.username}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar size={16} />
                                                    <span>{formatDate(story.created_at)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <Link
                                                    href={`/story/${story.id}`}
                                                    className="flex-1 h-[2.5rem] flex items-center justify-center gap-1 bg-gray-50 border border-[#E5E7EB] rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                                                >
                                                    <Eye size={16} />
                                                    <span>Ver</span>
                                                </Link>
                                                
                                                <Link
                                                    href={`/dashboard/edit/${story.id}`}
                                                    className="flex-1 h-[2.5rem] flex items-center justify-center gap-1 bg-[#484DB5]/10 border border-[#484DB5]/20 rounded-md text-[#484DB5] hover:bg-[#484DB5]/20 transition-colors duration-200"
                                                >
                                                    <Edit size={16} />
                                                    <span>Editar</span>
                                                </Link>
                                                
                                                <button
                                                    onClick={() => deleteContent("stories", story.id)}
                                                    className="flex-1 h-[2.5rem] flex items-center justify-center gap-1 bg-red-50 border border-red-200 rounded-md text-red-600 hover:bg-red-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={actionLoading}
                                                >
                                                    <Trash2 size={16} />
                                                    <span>Excluir</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Versão desktop - exibe tabela */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-left">
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB]">Título</th>
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB]">Autor</th>
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB]">Status</th>
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB]">Criado em</th>
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB]">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stories.map((story) => (
                                                <tr key={story.id} className="border-b border-[#E5E7EB] hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {story.title}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {story.profiles.username}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            story.is_published 
                                                                ? 'bg-green-100 text-green-700' 
                                                                : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {story.is_published ? "Publicado" : "Rascunho"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {formatDate(story.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={`/story/${story.id}`}
                                                                className="h-[2.5rem] px-3 flex items-center justify-center gap-1 bg-gray-50 border border-[#E5E7EB] rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                                                            >
                                                                <Eye size={16} />
                                                                <span>Ver</span>
                                                            </Link>
                                                            <Link
                                                                href={`/dashboard/edit/${story.id}`}
                                                                className="h-[2.5rem] px-3 flex items-center justify-center gap-1 bg-[#484DB5]/10 border border-[#484DB5]/20 rounded-md text-[#484DB5] hover:bg-[#484DB5]/20 transition-colors duration-200"
                                                            >
                                                                <Edit size={16} />
                                                                <span>Editar</span>
                                                            </Link>
                                                            <button
                                                                onClick={() => deleteContent("stories", story.id)}
                                                                className="h-[2.5rem] px-3 flex items-center justify-center gap-1 bg-red-50 border border-red-200 rounded-md text-red-600 hover:bg-red-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                disabled={actionLoading}
                                                            >
                                                                <Trash2 size={16} />
                                                                <span>Excluir</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Conteúdo de comentários */}
                {activeTab === "comments" && (
                    <div>
                        {comments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <MessageSquare size={40} className="mb-2" />
                                <p>Nenhum comentário encontrado</p>
                            </div>
                        ) : (
                            <>
                                {/* Versão mobile - exibe cards */}
                                <div className="grid gap-4 md:hidden">
                                    {comments.map(comment => (
                                        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm p-4" key={comment.id}>
                                            <div className="mb-3">
                                                <p className="text-gray-800 text-sm">
                                                    {comment.text.length > 100 ? comment.text.substring(0, 100) + "..." : comment.text}
                                                </p>
                                            </div>
                                            
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Users size={16} />
                                                    <span>Autor: {comment.profiles.username}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <BookOpen size={16} />
                                                    <span>História: {comment.stories?.title || "História removida"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar size={16} />
                                                    <span>{formatDate(comment.created_at)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="pt-3 border-t border-[#E5E7EB]">
                                                <button
                                                    onClick={() => deleteContent("comments", comment.id)}
                                                    className="w-full h-[2.5rem] flex items-center justify-center gap-1 bg-red-50 border border-red-200 rounded-md text-red-600 hover:bg-red-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={actionLoading}
                                                >
                                                    <Trash2 size={16} />
                                                    <span>Excluir</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Versão desktop - exibe tabela */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-left">
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB] w-1/3">Comentário</th>
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB]">Autor</th>
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB]">História</th>
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB]">Criado em</th>
                                                <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-[#E5E7EB]">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {comments.map((comment) => (
                                                <tr key={comment.id} className="border-b border-[#E5E7EB] hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-800">
                                                        <div className="max-w-md truncate">
                                                            {comment.text.length > 100
                                                                ? comment.text.substring(0, 100) + "..."
                                                                : comment.text}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {comment.profiles.username}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {comment.stories?.title || "História removida"}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        {formatDate(comment.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => deleteContent("comments", comment.id)}
                                                            className="h-[2.5rem] px-3 flex items-center justify-center gap-1 bg-red-50 border border-red-200 rounded-md text-red-600 hover:bg-red-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={actionLoading}
                                                        >
                                                            <Trash2 size={16} />
                                                            <span>Excluir</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
