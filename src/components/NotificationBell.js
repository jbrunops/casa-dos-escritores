"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Bell } from "lucide-react";
import Link from "next/link";
import { generateSlug } from "@/lib/utils";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const supabase = createBrowserClient();
    const dropdownRef = useRef(null);

    // Verificar tamanho da tela
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 480);
        };

        // Verificar no carregamento inicial
        checkMobile();

        // Adicionar listener para redimensionamento
        window.addEventListener("resize", checkMobile);

        // Limpar listener
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Buscar notificações do usuário
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session) {
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from("notifications")
                    .select("*, profiles(username, avatar_url)")
                    .eq("user_id", session.user.id)
                    .order("created_at", { ascending: false })
                    .limit(20);

                if (error) throw error;

                setNotifications(data || []);
                setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
            } catch (error) {
                console.error("Erro ao buscar notificações:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Configurar subscription para notificações em tempo real
        const subscription = supabase
            .channel("notification_changes")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                },
                (payload) => {
                    // Verificar se a notificação é para o usuário atual
                    supabase.auth.getSession().then(({ data: { session } }) => {
                        if (
                            session &&
                            payload.new.user_id === session.user.id
                        ) {
                            fetchNotificationsForUser(session.user.id);
                        }
                    });
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Função auxiliar para buscar notificações de um usuário específico
    const fetchNotificationsForUser = async (userId) => {
        try {
            const { data, error } = await supabase
                .from("notifications")
                .select(`
                    *,
                    profiles(username, avatar_url),
                    additional_data
                `)
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) throw error;

            setNotifications(data || []);
            setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
        } catch (error) {
            console.error("Erro ao atualizar notificações:", error);
        }
    };

    // Fechar o dropdown quando clicar fora dele
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Marcar todas as notificações como lidas
    const markAllAsRead = async () => {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", session.user.id)
                .eq("is_read", false);

            if (error) throw error;

            setNotifications((prevNotifications) =>
                prevNotifications.map((notification) => ({
                    ...notification,
                    is_read: true,
                }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Erro ao marcar notificações como lidas:", error);
        }
    };

    // Marcar uma notificação específica como lida
    const markAsRead = async (notificationId) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notificationId);

            if (error) throw error;

            setNotifications((prevNotifications) =>
                prevNotifications.map((notification) =>
                    notification.id === notificationId
                        ? { ...notification, is_read: true }
                        : notification
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Erro ao marcar notificação como lida:", error);
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
            default:
                return "#";
        }
    };

    if (loading) {
        return (
            <div className="notification-bell-container">
                <div className="notification-icon-wrapper">
                    <Bell size={20} />
                </div>
            </div>
        );
    }

    // Mostrar apenas para usuários logados
    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button
                className="notification-icon-wrapper"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notificações"
            >
                <Bell size={isMobile ? 28 : 20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notifications-dropdown">
                    <div className="notifications-header">
                        <h3>Notificações</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="mark-read-button"
                            >
                                Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className="empty-notifications">
                            <p>Você não tem notificações.</p>
                        </div>
                    ) : (
                        <div className="notifications-list">
                            {notifications.map((notification) => (
                                <Link
                                    href={getNotificationUrl(notification)}
                                    key={notification.id}
                                    className={`notification-item ${
                                        !notification.is_read ? "unread" : ""
                                    }`}
                                    onClick={() => {
                                        if (!notification.is_read) {
                                            markAsRead(notification.id);
                                        }
                                        // Fechar dropdown ao clicar em notificação no mobile
                                        if (isMobile) {
                                            setIsOpen(false);
                                        }
                                    }}
                                >
                                    <div className="notification-content">
                                        <div className="notification-text">
                                            {notification.content}
                                        </div>
                                        <div className="notification-meta">
                                            <span className="notification-time">
                                                {formatNotificationDate(
                                                    notification.created_at
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
