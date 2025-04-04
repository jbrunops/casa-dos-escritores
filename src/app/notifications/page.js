"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { Bell, Check, CheckCheck, ArrowLeft } from "lucide-react";
import { generateSlug } from "@/lib/utils";

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
                // Para histórias, usar slug
                if (notification.additional_data?.story_id) {
                    return `/story/${generateSlug(
                        notification.additional_data?.story_title || "",
                        notification.additional_data?.story_id
                    )}`;
                }
                // Para capítulos, manter apenas o ID por enquanto
                return `/story/${notification.related_id}`;
            case "follow":
                if (notification.additional_data?.username) {
                    return `/profile/${notification.additional_data.username}`;
                }
                return `/profile`;
            case "like":
                if (notification.additional_data?.story_id) {
                    return `/story/${generateSlug(
                        notification.additional_data?.story_title || "",
                        notification.additional_data?.story_id
                    )}`;
                }
                return `/dashboard`;
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

    // Contagem de não lidas
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="notifications-page">
            <div className="notifications-container">
                <div className="notifications-header">
                    <div className="header-left">
                        <button 
                            className="back-button" 
                            onClick={() => router.back()}
                            aria-label="Voltar"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1>Notificações</h1>
                    </div>
                    <div className="header-actions">
                        {unreadCount > 0 && (
                            <button
                                className="mark-all-button"
                                onClick={markAllAsRead}
                                disabled={markingAll}
                            >
                                {markingAll ? (
                                    <span className="loading-spinner-small"></span>
                                ) : (
                                    <>
                                        <CheckCheck size={16} />
                                        <span>Marcar todas como lidas</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="notifications-filter">
                    <button 
                        className={`filter-button ${filter === "all" ? "active" : ""}`}
                        onClick={() => setFilter("all")}
                    >
                        Todas
                    </button>
                    <button 
                        className={`filter-button ${filter === "unread" ? "active" : ""}`}
                        onClick={() => setFilter("unread")}
                    >
                        Não lidas {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                    <button 
                        className={`filter-button ${filter === "read" ? "active" : ""}`}
                        onClick={() => setFilter("read")}
                    >
                        Lidas
                    </button>
                </div>

                <div className="notifications-list-container">
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Carregando notificações...</p>
                        </div>
                    ) : getFilteredNotifications().length === 0 ? (
                        <div className="empty-notifications">
                            <Bell size={40} />
                            <p>
                                {filter === "all" 
                                    ? "Você não tem notificações." 
                                    : filter === "unread" 
                                    ? "Não há notificações não lidas." 
                                    : "Não há notificações lidas."}
                            </p>
                        </div>
                    ) : (
                        <div className="notifications-list">
                            {getFilteredNotifications().map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${
                                        !notification.is_read ? "unread" : ""
                                    }`}
                                >
                                    <div className="notification-content">
                                        <Link
                                            href={getNotificationUrl(notification)}
                                            className="notification-link"
                                            onClick={() => {
                                                if (!notification.is_read) {
                                                    markAsRead(notification.id);
                                                }
                                            }}
                                        >
                                            <div className="notification-text">
                                                {notification.content}
                                            </div>
                                            <div className="notification-meta">
                                                <span>{formatNotificationDate(notification.created_at)}</span>
                                            </div>
                                        </Link>
                                        
                                        {!notification.is_read && (
                                            <button 
                                                className="mark-read-button"
                                                onClick={() => markAsRead(notification.id)}
                                                disabled={markingOne === notification.id}
                                                aria-label="Marcar como lida"
                                            >
                                                {markingOne === notification.id ? (
                                                    <span className="button-loading"></span>
                                                ) : (
                                                    <Check size={16} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 