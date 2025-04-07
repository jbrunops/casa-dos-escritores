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
                    profiles(username),
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

    // Componente de card para mobile
    const renderUserCard = (user) => {
        return (
            <div className="admin-card" key={user.id}>
                <div className="admin-card-header">
                    <h3 className="admin-card-title">{user.username}</h3>
                    <div className={`role-badge ${user.role || 'user'}`}>
                        {user.role === 'admin' ? 'Administrador' : 
                         user.role === 'moderator' ? 'Moderador' : 'Usuário'}
                    </div>
                </div>
                
                <div className="admin-card-content">
                    <div className="admin-card-field">
                        <Mail size={16} className="admin-card-icon" />
                        <span>{user.email}</span>
                    </div>
                    <div className="admin-card-field">
                        <Calendar size={16} className="admin-card-icon" />
                        <span>{formatDate(user.created_at)}</span>
                    </div>
                </div>
                
                <div className="admin-card-actions">
                    <div className="admin-card-select">
                        <label htmlFor={`role-${user.id}`}>Função:</label>
                        <select
                            id={`role-${user.id}`}
                            value={user.role || "user"}
                            onChange={(e) => setUserRole(user.id, e.target.value)}
                            disabled={actionLoading}
                            className="role-select"
                        >
                            <option value="user">Usuário</option>
                            <option value="moderator">Moderador</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    
                    <div className="admin-action-buttons">
                        <Link
                            href={`/profile/${encodeURIComponent(user.username)}`}
                            className="view-btn"
                        >
                            <Eye size={16} />
                            <span>Ver</span>
                        </Link>
                        
                        <button
                            onClick={() => deleteUser(user.id, user.username)}
                            className="delete-btn"
                            disabled={actionLoading || user.role === "admin"}
                            title={user.role === "admin" ? "Não é possível excluir um administrador" : "Excluir usuário"}
                        >
                            <Trash2 size={16} />
                            <span>Excluir</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderStoryCard = (story) => {
        return (
            <div className="admin-card" key={story.id}>
                <div className="admin-card-header">
                    <h3 className="admin-card-title">{story.title}</h3>
                    <div className={`status-badge ${story.is_published ? "published" : "draft"}`}>
                        {story.is_published ? "Publicado" : "Rascunho"}
                    </div>
                </div>
                
                <div className="admin-card-content">
                    <div className="admin-card-field">
                        <Users size={16} className="admin-card-icon" />
                        <span>Autor: {story.profiles.username}</span>
                    </div>
                    <div className="admin-card-field">
                        <Calendar size={16} className="admin-card-icon" />
                        <span>{formatDate(story.created_at)}</span>
                    </div>
                </div>
                
                <div className="admin-card-actions">
                    <Link
                        href={`/story/${story.id}`}
                        className="view-btn"
                    >
                        <Eye size={16} />
                        <span>Ver</span>
                    </Link>
                    
                    <Link
                        href={`/dashboard/edit/${story.id}`}
                        className="edit-btn"
                    >
                        <Edit size={16} />
                        <span>Editar</span>
                    </Link>
                    
                    <button
                        onClick={() => deleteContent("stories", story.id)}
                        className="delete-btn"
                        disabled={actionLoading}
                    >
                        <Trash2 size={16} />
                        <span>Excluir</span>
                    </button>
                </div>
            </div>
        );
    };

    const renderCommentCard = (comment) => {
        return (
            <div className="admin-card" key={comment.id}>
                <div className="admin-card-header">
                    <div className="admin-card-comment">
                        {comment.text.length > 100 ? comment.text.substring(0, 100) + "..." : comment.text}
                    </div>
                </div>
                
                <div className="admin-card-content">
                    <div className="admin-card-field">
                        <Users size={16} className="admin-card-icon" />
                        <span>Autor: {comment.profiles.username}</span>
                    </div>
                    <div className="admin-card-field">
                        <BookOpen size={16} className="admin-card-icon" />
                        <span>História: {comment.stories?.title || "História removida"}</span>
                    </div>
                    <div className="admin-card-field">
                        <Calendar size={16} className="admin-card-icon" />
                        <span>{formatDate(comment.created_at)}</span>
                    </div>
                </div>
                
                <div className="admin-card-actions">
                    <button
                        onClick={() => deleteContent("comments", comment.id)}
                        className="delete-btn"
                        disabled={actionLoading}
                    >
                        <Trash2 size={16} />
                        <span>Excluir</span>
                    </button>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <RefreshCw size={40} className="admin-loading-icon" />
                <p>Carregando painel administrativo...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <div>
                    <Link href="/dashboard" className="admin-back-link">
                        <ArrowLeft size={16} />
                        <span>Voltar para o Dashboard</span>
                    </Link>
                    <h1 className="admin-title">Painel de Administração</h1>
                    <p className="admin-subtitle">
                        Gerencie usuários, histórias e comentários
                    </p>
                </div>

                <div className="admin-actions-top">
                    <button
                        className="admin-refresh-btn"
                        onClick={loadData}
                        disabled={loading}
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "spin" : ""}
                        />
                        <span>Atualizar dados</span>
                    </button>
                </div>
            </div>

            {statusMessage.type && (
                <div className={`admin-message ${statusMessage.type}`}>
                    {statusMessage.type === "success" ? (
                        <CheckCircle2 size={20} className="admin-message-icon" />
                    ) : (
                        <AlertTriangle size={20} className="admin-message-icon" />
                    )}
                    <span>{statusMessage.message}</span>
                </div>
            )}

            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
                    onClick={() => setActiveTab("users")}
                >
                    <Users size={18} className="admin-tab-icon" />
                    <span>Usuários</span>
                    <span className="admin-tab-count">{users.length}</span>
                </button>
                
                <button
                    className={`admin-tab ${activeTab === "stories" ? "active" : ""}`}
                    onClick={() => setActiveTab("stories")}
                >
                    <BookOpen size={18} className="admin-tab-icon" />
                    <span>Histórias</span>
                    <span className="admin-tab-count">{stories.length}</span>
                </button>
                
                <button
                    className={`admin-tab ${activeTab === "comments" ? "active" : ""}`}
                    onClick={() => setActiveTab("comments")}
                >
                    <MessageSquare size={18} className="admin-tab-icon" />
                    <span>Comentários</span>
                    <span className="admin-tab-count">{comments.length}</span>
                </button>
            </div>

            <div className="admin-content">
                {/* Conteúdo de usuários */}
                {activeTab === "users" && (
                    <div className="admin-section">
                        {users.length === 0 ? (
                            <div className="admin-empty">
                                <Shield size={40} />
                                <p>Nenhum usuário encontrado</p>
                            </div>
                        ) : (
                            <>
                                {/* Versão mobile - exibe cards */}
                                <div className="admin-cards">
                                    {users.map(user => renderUserCard(user))}
                                </div>
                                
                                {/* Versão desktop - exibe tabela */}
                                <div className="admin-table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Usuário</th>
                                                <th>E-mail</th>
                                                <th>Criado em</th>
                                                <th>Função</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id}>
                                                    <td data-label="Usuário">
                                                        {user.username}
                                                    </td>
                                                    <td data-label="E-mail">
                                                        {user.email}
                                                    </td>
                                                    <td data-label="Criado em">
                                                        {formatDate(user.created_at)}
                                                    </td>
                                                    <td data-label="Função">
                                                        <div className="role-selector">
                                                            <select
                                                                value={user.role || "user"}
                                                                onChange={(e) => setUserRole(user.id, e.target.value)}
                                                                disabled={actionLoading}
                                                                className="role-select"
                                                            >
                                                                <option value="user">Usuário</option>
                                                                <option value="moderator">Moderador</option>
                                                                <option value="admin">Administrador</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td data-label="Ações">
                                                        <div className="admin-actions">
                                                            <Link
                                                                href={`/profile/${encodeURIComponent(user.username)}`}
                                                                className="view-btn"
                                                            >
                                                                <Eye size={16} />
                                                                <span>Ver</span>
                                                            </Link>
                                                            <button
                                                                onClick={() => deleteUser(user.id, user.username)}
                                                                className="delete-btn"
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
                    <div className="admin-section">
                        {stories.length === 0 ? (
                            <div className="admin-empty">
                                <BookOpen size={40} />
                                <p>Nenhuma história encontrada</p>
                            </div>
                        ) : (
                            <>
                                {/* Versão mobile - exibe cards */}
                                <div className="admin-cards">
                                    {stories.map(story => renderStoryCard(story))}
                                </div>
                                
                                {/* Versão desktop - exibe tabela */}
                                <div className="admin-table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Título</th>
                                                <th>Autor</th>
                                                <th>Status</th>
                                                <th>Criado em</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stories.map((story) => (
                                                <tr key={story.id}>
                                                    <td data-label="Título">
                                                        {story.title}
                                                    </td>
                                                    <td data-label="Autor">
                                                        {story.profiles.username}
                                                    </td>
                                                    <td data-label="Status">
                                                        <span className={`status-badge ${story.is_published ? "published" : "draft"}`}>
                                                            {story.is_published ? "Publicado" : "Rascunho"}
                                                        </span>
                                                    </td>
                                                    <td data-label="Criado em">
                                                        {formatDate(story.created_at)}
                                                    </td>
                                                    <td data-label="Ações">
                                                        <div className="admin-actions">
                                                            <Link
                                                                href={`/story/${story.id}`}
                                                                className="view-btn"
                                                            >
                                                                <Eye size={16} />
                                                                <span>Ver</span>
                                                            </Link>
                                                            <Link
                                                                href={`/dashboard/edit/${story.id}`}
                                                                className="edit-btn"
                                                            >
                                                                <Edit size={16} />
                                                                <span>Editar</span>
                                                            </Link>
                                                            <button
                                                                onClick={() => deleteContent("stories", story.id)}
                                                                className="delete-btn"
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
                    <div className="admin-section">
                        {comments.length === 0 ? (
                            <div className="admin-empty">
                                <MessageSquare size={40} />
                                <p>Nenhum comentário encontrado</p>
                            </div>
                        ) : (
                            <>
                                {/* Versão mobile - exibe cards */}
                                <div className="admin-cards">
                                    {comments.map(comment => renderCommentCard(comment))}
                                </div>
                                
                                {/* Versão desktop - exibe tabela */}
                                <div className="admin-table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Comentário</th>
                                                <th>Autor</th>
                                                <th>História</th>
                                                <th>Criado em</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {comments.map((comment) => (
                                                <tr key={comment.id}>
                                                    <td data-label="Comentário">
                                                        <div className="comment-preview">
                                                            {comment.text.length > 100
                                                                ? comment.text.substring(0, 100) + "..."
                                                                : comment.text}
                                                        </div>
                                                    </td>
                                                    <td data-label="Autor">
                                                        {comment.profiles.username}
                                                    </td>
                                                    <td data-label="História">
                                                        {comment.stories?.title || "História removida"}
                                                    </td>
                                                    <td data-label="Criado em">
                                                        {formatDate(comment.created_at)}
                                                    </td>
                                                    <td data-label="Ações">
                                                        <button
                                                            onClick={() => deleteContent("comments", comment.id)}
                                                            className="delete-btn"
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
