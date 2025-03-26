"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { hasRole, ROLES } from "@/utils/userRoles";

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
    const router = useRouter();
    const supabase = createBrowserClient();

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

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader-large"></div>
                <p>Carregando painel administrativo...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <h1>Painel Administrativo</h1>

            {statusMessage.message && (
                <div className={`message-banner ${statusMessage.type}`}>
                    {statusMessage.message}
                </div>
            )}

            <div className="admin-actions-bar">
                <button
                    onClick={loadData}
                    className="refresh-button"
                    disabled={actionLoading || loading}
                >
                    {actionLoading || loading
                        ? "Carregando..."
                        : "🔄 Atualizar Dados"}
                </button>
            </div>

            <div className="admin-tabs">
                <button
                    className={`admin-tab ${
                        activeTab === "users" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("users")}
                >
                    Usuários ({users.length})
                </button>
                <button
                    className={`admin-tab ${
                        activeTab === "stories" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("stories")}
                >
                    Histórias ({stories.length})
                </button>
                <button
                    className={`admin-tab ${
                        activeTab === "comments" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("comments")}
                >
                    Comentários ({comments.length})
                </button>
            </div>

            {/* Tabela de usuários */}
            {activeTab === "users" && (
                <div className="admin-table-container">
                    {users.length === 0 ? (
                        <div className="empty-state">
                            <p>Nenhum usuário encontrado</p>
                        </div>
                    ) : (
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
                                            {new Date(
                                                user.created_at
                                            ).toLocaleDateString("pt-BR")}
                                        </td>
                                        <td data-label="Função">
                                            <select
                                                value={user.role || "user"}
                                                onChange={(e) =>
                                                    setUserRole(
                                                        user.id,
                                                        e.target.value
                                                    )
                                                }
                                                disabled={actionLoading}
                                                className="role-select"
                                            >
                                                <option value="user">
                                                    Usuário
                                                </option>
                                                <option value="moderator">
                                                    Moderador
                                                </option>
                                                <option value="admin">
                                                    Administrador
                                                </option>
                                            </select>
                                        </td>
                                        <td data-label="Ações">
                                            <div className="admin-actions">
                                                <Link
                                                    href={`/profile/${encodeURIComponent(
                                                        user.username
                                                    )}`}
                                                    className="view-btn"
                                                >
                                                    Ver
                                                </Link>
                                                <button
                                                    onClick={() =>
                                                        deleteUser(
                                                            user.id,
                                                            user.username
                                                        )
                                                    }
                                                    className="delete-btn"
                                                    disabled={
                                                        actionLoading ||
                                                        user.role === "admin"
                                                    }
                                                    title={
                                                        user.role === "admin"
                                                            ? "Não é possível excluir um administrador"
                                                            : "Excluir usuário"
                                                    }
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Tabela de histórias */}
            {activeTab === "stories" && (
                <div className="admin-table-container">
                    {stories.length === 0 ? (
                        <div className="empty-state">
                            <p>Nenhuma história encontrada</p>
                        </div>
                    ) : (
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
                                        </td>
                                        <td data-label="Criado em">
                                            {new Date(
                                                story.created_at
                                            ).toLocaleDateString("pt-BR")}
                                        </td>
                                        <td data-label="Ações">
                                            <div className="admin-actions">
                                                <Link
                                                    href={`/story/${story.id}`}
                                                    className="view-btn"
                                                >
                                                    Ver
                                                </Link>
                                                <Link
                                                    href={`/dashboard/edit/${story.id}`}
                                                    className="edit-btn"
                                                >
                                                    Editar
                                                </Link>
                                                <button
                                                    onClick={() =>
                                                        deleteContent(
                                                            "stories",
                                                            story.id
                                                        )
                                                    }
                                                    className="delete-btn"
                                                    disabled={actionLoading}
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Tabela de comentários */}
            {activeTab === "comments" && (
                <div className="admin-table-container">
                    {comments.length === 0 ? (
                        <div className="empty-state">
                            <p>Nenhum comentário encontrado</p>
                        </div>
                    ) : (
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
                                                    ? comment.text.substring(
                                                          0,
                                                          100
                                                      ) + "..."
                                                    : comment.text}
                                            </div>
                                        </td>
                                        <td data-label="Autor">
                                            {comment.profiles.username}
                                        </td>
                                        <td data-label="História">
                                            {comment.stories?.title ||
                                                "História removida"}
                                        </td>
                                        <td data-label="Criado em">
                                            {new Date(
                                                comment.created_at
                                            ).toLocaleDateString("pt-BR")}
                                        </td>
                                        <td data-label="Ações">
                                            <button
                                                onClick={() =>
                                                    deleteContent(
                                                        "comments",
                                                        comment.id
                                                    )
                                                }
                                                className="delete-btn"
                                                disabled={actionLoading}
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
