"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Bell, Check, X, ArrowRight } from "lucide-react";
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

    // Obter ícone com base no tipo de notificação
    const getNotificationIcon = (type) => {
        switch (type) {
            case "comment":
                return "💬";
            case "reply":
                return "↩️";
            case "like":
                return "❤️";
            case "follow":
                return "👤";
            case "chapter":
                return "📖";
            default:
                return "🔔";
        }
    };

    if (loading) {
        return (
            <div className="relative">
                <button 
                    className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    aria-label="Notificações"
                >
                    <Bell size={isMobile ? 24 : 20} className="text-gray-700" />
                </button>
            </div>
        );
    }

    // Mostrar apenas para usuários logados
    return (
        <div className="relative z-50" ref={dropdownRef}>
            <button
                className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 transition-colors duration-200"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notificações"
            >
                <Bell size={isMobile ? 24 : 20} className="text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-[#484DB5] text-white text-xs font-medium">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-[#E5E7EB] overflow-hidden z-50">
                    <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
                        <h3 className="font-semibold text-gray-900">Notificações</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-medium text-[#484DB5] hover:text-opacity-80 transition-colors duration-200 flex items-center"
                            >
                                <Check size={14} className="mr-1" />
                                Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto max-h-[70vh] md:max-h-[400px]">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center">
                                <p className="text-gray-500">Nenhuma notificação</p>
                            </div>
                        ) : (
                            <div>
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`relative hover:bg-gray-50 transition-colors duration-200 ${
                                            !notification.is_read
                                                ? "bg-blue-50"
                                                : ""
                                        }`}
                                    >
                                        <Link
                                            href={getNotificationUrl(notification)}
                                            className="block p-4"
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0 mr-4">
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-900 font-medium line-clamp-2">
                                                        {notification.content}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {formatNotificationDate(notification.created_at)}
                                                    </p>
                                                </div>
                                                {!notification.is_read && (
                                                    <div className="ml-2 mt-1 flex-shrink-0">
                                                        <div className="h-2 w-2 rounded-full bg-[#484DB5]"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                        
                                        {!notification.is_read && (
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                                aria-label="Marcar como lida"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[#E5E7EB] p-3">
                        <Link 
                            href="/notifications"
                            className="block w-full h-10 flex items-center justify-center text-sm font-medium text-[#484DB5] hover:bg-gray-50 rounded-md transition-colors duration-200"
                        >
                            Ver todas as notificações
                            <ArrowRight size={16} className="ml-2" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
