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
        });
    };

    // Função para determinar o URL de redirecionamento para cada tipo de notificação
    const getNotificationUrl = (notification) => {
        const type = notification.type;
        const data = notification.additional_data;

        switch (type) {
            case "comment":
                if (data?.story_id) {
                    return `/story/${generateSlug(data.story_title, data.story_id)}#comments`;
                } else if (data?.chapter_id) {
                    return `/chapter/${generateSlug(data.chapter_title, data.chapter_id)}#comments`;
                }
                return `/notifications`;

            case "reply":
                if (data?.story_id) {
                    return `/story/${generateSlug(data.story_title, data.story_id)}#comment-${data.comment_id}`;
                } else if (data?.chapter_id) {
                    return `/chapter/${generateSlug(data.chapter_title, data.chapter_id)}#comment-${data.comment_id}`;
                }
                return `/notifications`;

            case "follow":
                if (data?.username) {
                    return `/profile/${data.username}`;
                }
                return `/notifications`;

            case "like":
                if (data?.story_id) {
                    return `/story/${generateSlug(data.story_title, data.story_id)}`;
                } else if (data?.chapter_id) {
                    return `/chapter/${generateSlug(data.chapter_title, data.chapter_id)}`;
                }
                return `/notifications`;

            default:
                return `/notifications`;
        }
    };

    // Se não estiver logado ou estiver carregando, mostrar apenas o ícone
    if (loading || notifications === null) {
        return (
            <div className="relative mx-4">
                <div className="w-8 h-8 flex items-center justify-center text-gray-600">
                    <Bell size={20} />
                </div>
            </div>
        );
    }

    // Mostrar apenas para usuários logados
    return (
        <div className="relative mx-4" ref={dropdownRef}>
            <button
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notificações"
            >
                <Bell size={isMobile ? 28 : 20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden border border-gray-200">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                        <h3 className="font-medium text-gray-800">Notificações</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-purple-600 hover:text-purple-800"
                            >
                                Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            <p>Você não tem notificações.</p>
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.map((notification) => (
                                <Link
                                    href={getNotificationUrl(notification)}
                                    key={notification.id}
                                    className={`block px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                        !notification.is_read ? "bg-purple-50" : ""
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
                                    <div className="w-full">
                                        <div className="text-sm text-gray-700 mb-1">
                                            {notification.content}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            <span>
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
