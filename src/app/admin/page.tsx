"use client";

import { useState, useEffect, Key } from "react";
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
    ChevronRight,
    Loader,
    UserX,
    UserCheck,
    Check,
    X,
} from "lucide-react";

// Tipos para os dados
interface Profile {
    id: string;
    username: string;
    email: string;
    role: string;
    created_at: string;
}

interface Story {
    id: string;
    title: string;
    is_published: boolean;
    created_at: string;
    profiles: { username: string } | null;
}

interface Comment {
    id: string;
    text: string;
    created_at: string;
    profiles: { username: string } | null;
    stories: { id: string; title: string } | null;
}

interface StatusMessage {
    type: "success" | "error" | "warning" | "";
    message: string;
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [stories, setStories] = useState<Story[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"users" | "stories" | "comments">("users");
    const [statusMessage, setStatusMessage] = useState<StatusMessage>({
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
            setUsers((usersData as unknown as Profile[]) || []);

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
            setStories((storiesData as unknown as Story[]) || []);

            // Carregar comentários recentes
            const { data: commentsData, error: commentsError } = await supabase
                .from("comments")
                .select(
                    `
                    id,
                    text,
                    created_at,
                    profiles(username),
                    stories(id, title)
                `
                )
                .order("created_at", { ascending: false })
                .limit(50);

            if (commentsError) throw commentsError;
            setComments((commentsData as unknown as Comment[]) || []);
        } catch (error: any) {
            console.error("Erro ao carregar dados:", error);
            setStatusMessage({
                type: "error",
                message:
                    error.message ||
                    "Erro ao carregar dados. Por favor, atualize a página.",
            });
        } finally {
            setLoading(false);
        }
    }

    async function setUserRole(userId: string, newRole: string) {
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
        } catch (error: any) {
            console.error("Erro ao atualizar role:", error);
            setStatusMessage({
                type: "error",
                message:
                    error.message ||
                    "Erro ao atualizar permissões do usuário. Tente novamente.",
            });
        } finally {
            setActionLoading(false);
        }
    }

    async function deleteUser(userId: string, username: string) {
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
        } catch (error: any) {
            console.error("Erro ao excluir usuário:", error);
            setStatusMessage({
                type: "error",
                message: `Erro ao excluir usuário: ${error.message}`,
            });
        } finally {
            setActionLoading(false);
        }
    }

    async function deleteContent(contentType: "stories" | "comments", id: string) {
        const contentName = contentType === "stories" ? "história" : "comentário";
        if (!confirm(`Tem certeza que deseja excluir est${contentName}?`)) {
            return;
        }

        setActionLoading(true);
        setStatusMessage({ type: "", message: "" });

        try {
            const { error } = await supabase.from(contentType).delete().eq("id", id);

            if (error) throw error;

            // Atualizar a lista correspondente
            if (contentType === "stories") {
                setStories(stories.filter((story) => story.id !== id));
            } else {
                setComments(comments.filter((comment) => comment.id !== id));
            }

            setStatusMessage({
                type: "success",
                message: `${contentName.charAt(0).toUpperCase() + contentName.slice(1)}
                    excluíd${contentType === "stories" ? "a" : "o"} com sucesso!`,
            });

            // Recarregar dados após um breve período
            setTimeout(() => {
                loadData();
            }, 1500);
        } catch (error: any) {
            console.error(`Erro ao excluir ${contentName}:`, error);
            setStatusMessage({
                type: "error",
                message: `Erro ao excluir ${contentName}: ${error.message}`,
            });
        } finally {
            setActionLoading(false);
        }
    }

    const formatDate = (dateString: string): string => {
        try {
            const options: Intl.DateTimeFormatOptions = {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            };
            return new Intl.DateTimeFormat("pt-BR", options).format(
                new Date(dateString)
            );
        } catch (e) {
            return "Data inválida";
        }
    };

    const getStatusIcon = (statusType: StatusMessage["type"]) => {
        switch (statusType) {
            case "success":
                return <CheckCircle2 className="text-green-500" size={20} />;
            case "error":
                return <AlertTriangle className="text-red-500" size={20} />;
            case "warning":
                return <AlertTriangle className="text-yellow-500" size={20} />;
            default:
                return null;
        }
    };

    const renderStatusMessage = () => {
        if (!statusMessage.message) return null;

        const bgColor = {
            success: "bg-green-100",
            error: "bg-red-100",
            warning: "bg-yellow-100",
            "": "bg-gray-100",
        }[statusMessage.type];
        const textColor = {
            success: "text-green-800",
            error: "text-red-800",
            warning: "text-yellow-800",
            "": "text-gray-800",
        }[statusMessage.type];

        return (
            <div
                className={`fixed bottom-5 right-5 flex items-center p-4 rounded-md shadow-lg z-50 ${bgColor} ${textColor}`}
                role="alert"
            >
                {getStatusIcon(statusMessage.type)}
                <span className="ml-2 font-medium">{statusMessage.message}</span>
                <button
                    onClick={() => setStatusMessage({ type: "", message: "" })}
                    className="ml-4 text-lg font-semibold hover:opacity-75"
                    aria-label="Fechar"
                >
                    &times;
                </button>
            </div>
        );
    };

    const Table = ({ children }: { children: React.ReactNode }) => (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 shadow border border-gray-200 rounded-lg overflow-hidden">
                {children}
            </table>
        </div>
    );

    const Th = ({ children }: { children: React.ReactNode }) => (
        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
            {children}
        </th>
    );

    const Td = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
        <td className={`px-4 py-4 whitespace-nowrap text-sm text-gray-700 ${className}`}>
            {children}
        </td>
    );

    const ActionButton = ({
        onClick,
        icon: Icon,
        label,
        variant = "default",
        disabled = false,
    }: {
        onClick: () => void;
        icon: React.ElementType;
        label: string;
        variant?: "default" | "danger" | "success";
        disabled?: boolean;
    }) => {
        const colors = {
            default: "text-indigo-600 hover:text-indigo-900",
            danger: "text-red-600 hover:text-red-900",
            success: "text-green-600 hover:text-green-900",
        };
        return (
            <button
                onClick={onClick}
                disabled={disabled || actionLoading}
                className={`p-1 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${colors[variant]}`}
                aria-label={label}
            >
                <Icon size={18} />
            </button>
        );
    };

    const TabButton = ({
        tabName,
        label,
        icon: Icon,
    }: {
        tabName: "users" | "stories" | "comments";
        label: string;
        icon: React.ElementType;
    }) => (
        <button
            className={`flex items-center px-4 py-2 mr-2 rounded-md text-sm font-medium transition-colors duration-150 ${activeTab === tabName ? "bg-[#484DB5] text-white" : "text-gray-600 hover:bg-gray-100"}`}
            onClick={() => setActiveTab(tabName)}
        >
            <Icon size={16} className="mr-2" />
            {label}
        </button>
    );

    const RenderUsers = () => (
        <Table>
            <thead className="bg-gray-50">
                <tr>
                    <Th>Usuário</Th>
                    <Th>Email</Th>
                    <Th>Permissão</Th>
                    <Th>Criado em</Th>
                    <Th>Ações</Th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                    <tr key={user.id}>
                        <Td className="font-medium text-gray-900">{user.username}</Td>
                        <Td>{user.email}</Td>
                        <Td>
                            <select
                                value={user.role}
                                onChange={(e) => setUserRole(user.id, e.target.value)}
                                disabled={actionLoading}
                                className="text-sm p-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="user">Usuário</option>
                                <option value="admin">Admin</option>
                            </select>
                        </Td>
                        <Td>{formatDate(user.created_at)}</Td>
                        <Td>
                            <div className="flex items-center space-x-2">
                                <ActionButton
                                    onClick={() => deleteUser(user.id, user.username)}
                                    icon={Trash2}
                                    label="Excluir usuário"
                                    variant="danger"
                                />
                            </div>
                        </Td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );

    const RenderStories = () => (
        <Table>
            <thead className="bg-gray-50">
                <tr>
                    <Th>Título</Th>
                    <Th>Autor</Th>
                    <Th>Status</Th>
                    <Th>Criado em</Th>
                    <Th>Ações</Th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {stories.map((story) => (
                    <tr key={story.id}>
                        <Td className="font-medium text-gray-900">
                            <Link href={`/story/${story.id}`} className="hover:underline text-indigo-600">
                                {story.title || "(Sem título)"}
                            </Link>
                        </Td>
                        <Td>{story.profiles?.username || "(Desconhecido)"}</Td>
                        <Td>
                            <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${story.is_published ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                            >
                                {story.is_published ? "Publicado" : "Rascunho"}
                            </span>
                        </Td>
                        <Td>{formatDate(story.created_at)}</Td>
                        <Td>
                            <div className="flex items-center space-x-2">
                                <ActionButton
                                    onClick={() => router.push(`/story/${story.id}`)}
                                    icon={Eye}
                                    label="Ver história"
                                />
                                <ActionButton
                                    onClick={() =>
                                        deleteContent("stories", story.id)
                                    }
                                    icon={Trash2}
                                    label="Excluir história"
                                    variant="danger"
                                />
                            </div>
                        </Td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );

    const RenderComments = () => (
        <Table>
            <thead className="bg-gray-50">
                <tr>
                    <Th>Comentário (trecho)</Th>
                    <Th>Autor</Th>
                    <Th>História</Th>
                    <Th>Criado em</Th>
                    <Th>Ações</Th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {comments.map((comment) => (
                    <tr key={comment.id}>
                        <Td className="max-w-xs truncate">
                            {comment.text}
                        </Td>
                        <Td>{comment.profiles?.username || "(Desconhecido)"}</Td>
                        <Td className="max-w-xs truncate">
                            <Link href={`/story/${comment.stories?.id || '#'}`} className="hover:underline text-indigo-600">
                                {comment.stories?.title || "(História excluída)"}
                            </Link>
                        </Td>
                        <Td>{formatDate(comment.created_at)}</Td>
                        <Td>
                            <div className="flex items-center space-x-2">
                                <ActionButton
                                    onClick={() =>
                                        deleteContent("comments", comment.id)
                                    }
                                    icon={Trash2}
                                    label="Excluir comentário"
                                    variant="danger"
                                />
                            </div>
                        </Td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );

    const MobileCard = ({ children, title, onClick }: { children: React.ReactNode, title: string, onClick?: () => void }) => (
        <div
            className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={onClick}
        >
            <div>{children}</div>
            <ChevronRight size={16} className="text-gray-400" />
        </div>
    );

    const RenderMobileUsers = () => (
        <div>
            {users.map((user) => (
                <MobileCard key={user.id} title={user.username}>
                    <div className="mb-2">
                        <p className="font-semibold text-gray-800">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <select
                            value={user.role}
                            onChange={(e) => {
                                e.stopPropagation(); // Evita abrir o card ao mudar o select
                                setUserRole(user.id, e.target.value);
                            }}
                            disabled={actionLoading}
                            className="text-xs p-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="user">Usuário</option>
                            <option value="admin">Admin</option>
                        </select>
                        <div onClick={(e) => e.stopPropagation()}>
                            <ActionButton
                                onClick={() => deleteUser(user.id, user.username)}
                                icon={Trash2}
                                label="Excluir usuário"
                                variant="danger"
                            />
                        </div>
                    </div>
                </MobileCard>
            ))}
        </div>
    );

    const RenderMobileStories = () => (
        <div>
            {stories.map((story) => (
                <MobileCard key={story.id} title={story.title} onClick={() => router.push(`/story/${story.id}`)}>
                    <div className="mb-2">
                        <p className="font-semibold text-gray-800 truncate">{story.title || "(Sem título)"}</p>
                        <p className="text-sm text-gray-500">Por: {story.profiles?.username || "Desconhecido"}</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${story.is_published ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                        >
                            {story.is_published ? "Publicado" : "Rascunho"}
                        </span>
                        <div onClick={(e) => e.stopPropagation()}>
                            <ActionButton
                                onClick={() => deleteContent("stories", story.id)}
                                icon={Trash2}
                                label="Excluir história"
                                variant="danger"
                            />
                        </div>
                    </div>
                </MobileCard>
            ))}
        </div>
    );

    const RenderMobileComments = () => (
        <div>
            {comments.map((comment) => (
                <MobileCard key={comment.id} title={`Comentário de ${comment.profiles?.username || 'Desconhecido'}`}>
                    <div className="mb-2">
                        <p className="text-sm text-gray-600 truncate italic">"{comment.text}"</p>
                        <p className="text-xs text-gray-400 mt-1">Em: {comment.stories?.title || "(História excluída)"}</p>
                    </div>
                    <div className="flex justify-end">
                        <div onClick={(e) => e.stopPropagation()}>
                            <ActionButton
                                onClick={() => deleteContent("comments", comment.id)}
                                icon={Trash2}
                                label="Excluir comentário"
                                variant="danger"
                            />
                        </div>
                    </div>
                </MobileCard>
            ))}
        </div>
    );


    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            {renderStatusMessage()}
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">Painel Administrativo</h1>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={loadData}
                            disabled={loading || actionLoading}
                            className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
                            Atualizar
                        </button>
                        <Link href="/dashboard" className="flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                            <ArrowLeft size={16} className="mr-2" />
                            Voltar
                        </Link>
                    </div>
                </div>

                {/* Tabs de navegação */}
                <div className="mb-6 border-b border-gray-200 pb-4 flex flex-wrap">
                    <TabButton tabName="users" label="Usuários" icon={Users} />
                    <TabButton tabName="stories" label="Histórias" icon={BookOpen} />
                    <TabButton tabName="comments" label="Comentários" icon={MessageSquare} />
                </div>

                {/* Conteúdo das Tabs */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader size={40} className="animate-spin text-[#484DB5]" />
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg p-4 md:p-6">
                        {activeTab === "users" && (isMobile ? <RenderMobileUsers /> : <RenderUsers />)}
                        {activeTab === "stories" && (isMobile ? <RenderMobileStories /> : <RenderStories />)}
                        {activeTab === "comments" && (isMobile ? <RenderMobileComments /> : <RenderComments />)}
                    </div>
                )}
            </div>
        </div>
    );
} 