"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { Bell, Check, CheckCheck, ArrowLeft, X, Filter, Clock, CheckCircle, Circle, MessageSquare, Reply, Heart, User, BookOpen, BookText } from "lucide-react";
import { generateSlug } from "@/lib/utils"; // agora usando utils.ts

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [markingAll, setMarkingAll] = useState(false);
    const [markingOne, setMarkingOne] = useState(null);
    const [filter, setFilter] = useState("all"); // "all", "unread", "read"

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

                // Buscar notificações do usuário
                await fetchUserNotifications(session.user.id);
            } catch (error) {
                console.error("Erro ao carregar notificações:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    async function fetchUserNotifications(userId) {
        try {
            setLoading(true);

            const query = supabase
                .from("notifications")
                .select(`
                    *,
                    profiles(username, avatar_url),
                    additional_data
                `)
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            setNotifications(data || []);
        } catch (error) {
            console.error("Erro ao buscar notificações:", error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }

    // Marcar uma notificação como lida
    const markAsRead = async (notificationId) => {
        try {
            setMarkingOne(notificationId);
            
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notificationId);

            if (error) throw error;

            // Atualizar o estado local
            setNotifications((prevNotifications) =>
                prevNotifications.map((notification) =>
                    notification.id === notificationId
                        ? { ...notification, is_read: true }
                        : notification
                )
            );
        } catch (error) {
            console.error("Erro ao marcar notificação como lida:", error);
        } finally {
            setMarkingOne(null);
        }
    };

    // Marcar todas as notificações como lidas
    const markAllAsRead = async () => {
        try {
            if (!user) return;
            
            setMarkingAll(true);
            
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", user.id)
                .eq("is_read", false);

            if (error) throw error;

            // Atualizar o estado local
            setNotifications((prevNotifications) =>
                prevNotifications.map((notification) => ({
                    ...notification,
                    is_read: true,
                }))
            );
        } catch (error) {
            console.error("Erro ao marcar notificações como lidas:", error);
        } finally {
            setMarkingAll(false);
        }
    };

    // Formatar data da notificação
    const formatNotificationDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHour / 24);

        if (diffSec < 60) return "agora";
        if (diffMin < 60) return `${diffMin} min`;
        if (diffHour < 24) return `${diffHour}h`;
        if (diffDays < 7) return `${diffDays}d`;

        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
        });
    };

    // Determinar URL de redirecionamento com base no tipo de notificação
    const getNotificationUrl = (notification) => {
        switch (notification.type) {
            case "comment":
            case "reply":
                // Para histórias
                if (notification.additional_data?.story_id) {
                    return `/story/${generateSlug(
                        notification.additional_data?.story_title || "",
                        notification.additional_data?.story_id
                    )}`;
                }
                // Para séries
                if (notification.additional_data?.series_id) {
                    return `/series/${notification.additional_data.series_id}`;
                }
                // Para capítulos
                if (notification.additional_data?.chapter_id) {
                    return `/chapter/${notification.additional_data.chapter_id}`;
                }
                // Fallback para o ID relacionado se disponível
                return notification.related_id 
                    ? `/story/${notification.related_id}` 
                    : "/dashboard";
            case "follow":
                if (notification.additional_data?.username) {
                    return `/profile/${notification.additional_data.username}`;
                }
                return "/profile";
            case "like":
                if (notification.additional_data?.story_id) {
                    return `/story/${generateSlug(
                        notification.additional_data?.story_title || "",
                        notification.additional_data?.story_id
                    )}`;
                }
                return "/dashboard";
            default:
                return "/dashboard";
        }
    };

    // Filtrar notificações
    const getFilteredNotifications = () => {
        if (filter === "read") {
            return notifications.filter(n => n.is_read);
        } else if (filter === "unread") {
            return notifications.filter(n => !n.is_read);
        }
        return notifications;
    };

    // Obter ícone com base no tipo de notificação
    const getNotificationIcon = (type) => {
        switch (type) {
            case "comment":
                return <MessageSquare size={20} className="text-[#484DB5]" />;
            case "reply":
                return <Reply size={20} className="text-[#484DB5]" />;
            case "like":
                return <Heart size={20} className="text-[#484DB5]" />;
            case "follow":
                return <User size={20} className="text-[#484DB5]" />;
            case "new_story":
                return <BookText size={20} className="text-[#484DB5]" />;
            case "new_chapter":
                return <BookOpen size={20} className="text-[#484DB5]" />;
            default:
                return <Bell size={20} className="text-[#484DB5]" />;
        }
    };

    // Renderizar conteúdo da notificação com base no tipo
    const renderNotificationContent = (notification) => {
        const { type, additional_data, profiles } = notification;
        const authorName = profiles?.username || "Usuário";
    
        switch (type) {
            case "comment":
                return (
                    <>
                        <span className="font-medium">{authorName}</span>
                        <span> comentou na sua história </span>
                        <span className="font-medium">
                            {additional_data?.story_title || ""}
                        </span>
                    </>
                );
            case "reply":
                return (
                    <>
                        <span className="font-medium">{authorName}</span>
                        <span> respondeu ao seu comentário</span>
                    </>
                );
            case "like":
                return (
                    <>
                        <span className="font-medium">{authorName}</span>
                        <span> curtiu sua história </span>
                        <span className="font-medium">
                            {additional_data?.story_title || ""}
                        </span>
                    </>
                );
            case "follow":
                return (
                    <>
                        <span className="font-medium">{authorName}</span>
                        <span> começou a seguir você</span>
                    </>
                );
            case "new_story":
                return (
                    <>
                        <span className="font-medium">{authorName}</span>
                        <span> publicou uma nova história: </span>
                        <span className="font-medium">
                            {additional_data?.story_title || "Nova história"}
                        </span>
                    </>
                );
            case "new_chapter":
                return (
                    <>
                        <span className="font-medium">{authorName}</span>
                        <span> publicou um novo capítulo: </span>
                        <span className="font-medium">
                            {additional_data?.chapter_title || "Novo capítulo"}
                        </span>
                        {additional_data?.series_title && (
                            <>
                                <span> em </span>
                                <span className="font-medium">
                                    {additional_data.series_title}
                                </span>
                            </>
                        )}
                    </>
                );
            default:
                return (
                    <>
                        <span>Nova notificação</span>
                    </>
                );
        }
    };

    // Contagem de não lidas
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const filteredNotifications = getFilteredNotifications();

    return (
        <div className="flex flex-col mx-auto max-w-[75rem]">
            {/* Cabeçalho da página */}
            <header className="border-b border-[#E5E7EB] py-6 mb-6">
                <div className="md:flex md:items-center md:justify-between px-4 md:px-0">
                    <div className="flex items-center mb-4 md:mb-0">
                        <button 
                            onClick={() => router.back()} 
                            className="mr-3 h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
                            aria-label="Voltar"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Bell className="mr-3 text-[#484DB5]" />
                            Notificações
                            {unreadCount > 0 && (
                                <span className="ml-3 px-2 py-1 text-xs font-medium rounded-full bg-[#484DB5] text-white">
                                    {unreadCount} não lidas
                                </span>
                            )}
                        </h1>
                    </div>
                    
                    <div className="flex space-x-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                disabled={markingAll}
                                className="h-10 px-4 flex items-center justify-center bg-[#484DB5] hover:bg-opacity-90 text-white rounded-md text-sm font-medium transition-colors duration-200"
                            >
                                {markingAll ? "Processando..." : (
                                    <>
                                        <CheckCheck size={16} className="mr-2" />
                                        Marcar todas como lidas
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Filtros */}
            <div className="mb-6 flex items-center space-x-2 px-4 md:px-0">
                <Filter size={16} className="text-gray-500 mr-1" />
                <span className="text-sm text-gray-500">Filtrar:</span>
                
                <button
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                        filter === "all"
                            ? "bg-[#484DB5] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    Todas
                </button>
                
                <button
                    onClick={() => setFilter("unread")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                        filter === "unread"
                            ? "bg-[#484DB5] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    <Circle size={14} className="mr-1 inline-block" />
                    Não lidas
                </button>
                
                <button
                    onClick={() => setFilter("read")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                        filter === "read"
                            ? "bg-[#484DB5] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    <CheckCircle size={14} className="mr-1 inline-block" />
                    Lidas
                </button>
            </div>

            {/* Lista de notificações */}
            <div className="flex-1 px-4 md:px-0">
                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="w-10 h-10 border-4 border-[#484DB5] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="bg-white rounded-lg border border-[#E5E7EB] p-8 text-center">
                        <Bell size={40} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação</h3>
                        <p className="text-gray-500">
                            {filter === "unread" 
                                ? "Você não tem notificações não lidas." 
                                : filter === "read" 
                                    ? "Você não tem notificações lidas."
                                    : "Você não tem notificações."}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`relative border-b border-[#E5E7EB] last:border-b-0 ${
                                    !notification.is_read ? "bg-blue-50" : ""
                                }`}
                            >
                                <Link
                                    href={getNotificationUrl(notification)}
                                    className="block p-4 hover:bg-gray-50 transition-colors duration-200"
                                    onClick={() => {
                                        if (!notification.is_read) {
                                            markAsRead(notification.id);
                                        }
                                    }}
                                >
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 mr-4">
                                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 line-clamp-3">
                                                {renderNotificationContent(notification)}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatNotificationDate(notification.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                                
                                {!notification.is_read && (
                                    <button
                                        onClick={() => markAsRead(notification.id)}
                                        disabled={markingOne === notification.id}
                                        className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
                                        aria-label="Marcar como lida"
                                    >
                                        <Check size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 