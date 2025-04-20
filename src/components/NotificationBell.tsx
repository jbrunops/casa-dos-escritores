"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Bell, Check, X, ArrowRight, MessageSquare, Reply, Heart, User, BookOpen, BookText } from "lucide-react";
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

    // Determinar ícone com base no tipo de notificação
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
                    ? `/redirect?related_id=${notification.related_id}&type=${notification.type}` // Rota genérica para redirecionar
                    : "/notifications"; // Fallback para a página de notificações
            case "like":
                // Lógica semelhante à de comentário/reply, dependendo do que foi curtido
                if (notification.additional_data?.story_id) {
                    return `/story/${generateSlug(
                        notification.additional_data?.story_title || "",
                        notification.additional_data?.story_id
                    )}`;
                }
                if (notification.additional_data?.series_id) {
                    return `/series/${notification.additional_data.series_id}`;
                }
                 if (notification.additional_data?.chapter_id) {
                    return `/chapter/${notification.additional_data.chapter_id}`;
                }
                 if (notification.additional_data?.comment_id) {
                     // Idealmente teríamos uma forma de levar ao comentário exato
                     // Por ora, leva ao conteúdo relacionado
                    return `/redirect?related_id=${notification.related_id}&type=comment`
                 }
                return "/notifications";
            case "follow":
                // Leva para o perfil do usuário que começou a seguir
                return `/profile/${notification.sender_id}`;
            case "new_story":
            case "new_chapter":
                 // Leva para a história ou capítulo recém-criado
                 if (notification.additional_data?.story_id) {
                     return `/story/${generateSlug(
                         notification.additional_data?.story_title || "", 
                         notification.additional_data?.story_id
                         )}`;
                 }
                 if (notification.additional_data?.chapter_id) {
                     return `/chapter/${notification.additional_data.chapter_id}`; // Assumindo que chapter_id é suficiente
                 }
                 // Fallback para série se for um capítulo e o ID da história não estiver disponível
                 if (notification.type === 'new_chapter' && notification.additional_data?.series_id) {
                     return `/series/${notification.additional_data.series_id}`;
                 }
                return "/notifications";
            default:
                return "/notifications";
        }
    };

    // Renderizar o conteúdo da notificação
    const renderNotificationContent = (notification) => {
        const senderUsername = notification.profiles?.username || "Alguém";
        const storyTitle = notification.additional_data?.story_title;
        const seriesTitle = notification.additional_data?.series_title;
        const chapterTitle = notification.additional_data?.chapter_title;

        switch (notification.type) {
            case "comment":
                return (
                    <span>
                        <strong className="font-semibold">{senderUsername}</strong> comentou em {
                            storyTitle ? <strong className="font-semibold">{storyTitle}</strong> :
                            seriesTitle ? <strong className="font-semibold">{seriesTitle}</strong> :
                            chapterTitle ? <strong className="font-semibold">{chapterTitle}</strong> :
                            'seu conteúdo'
                        }.
                    </span>
                );
            case "reply":
                return (
                     <span>
                        <strong className="font-semibold">{senderUsername}</strong> respondeu ao seu comentário em {
                            storyTitle ? <strong className="font-semibold">{storyTitle}</strong> :
                            seriesTitle ? <strong className="font-semibold">{seriesTitle}</strong> :
                            chapterTitle ? <strong className="font-semibold">{chapterTitle}</strong> :
                            'um conteúdo'
                        }.
                    </span>
                );
            case "like":
                 return (
                    <span>
                        <strong className="font-semibold">{senderUsername}</strong> curtiu {
                             notification.additional_data?.comment_text ? 'seu comentário' : 
                            storyTitle ? <strong className="font-semibold">{storyTitle}</strong> :
                            seriesTitle ? <strong className="font-semibold">{seriesTitle}</strong> :
                            chapterTitle ? <strong className="font-semibold">{chapterTitle}</strong> :
                            'seu conteúdo'
                        }.
                    </span>
                );
            case "follow":
                return (
                    <span>
                        <strong className="font-semibold">{senderUsername}</strong> começou a seguir você.
                    </span>
                );
            case "new_story":
                return (
                     <span>
                        <strong className="font-semibold">{senderUsername}</strong> publicou uma nova história: <strong className="font-semibold">{storyTitle || 'Nova História'}</strong>.
                    </span>
                );
            case "new_chapter":
                return (
                     <span>
                        <strong className="font-semibold">{senderUsername}</strong> adicionou um novo capítulo{chapterTitle ? `: ${chapterTitle}` : ''} em <strong className="font-semibold">{seriesTitle || 'uma série'}</strong>.
                    </span>
                );
            default:
                return <span>{notification.message || "Nova notificação"}</span>;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-gray-600 hover:text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                aria-label="Notificações"
            >
                <Bell size={isMobile ? 20 : 24} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                )}
            </button>

            {isOpen && (
                <div className={`absolute ${isMobile ? 'right-0' : '-right-16'} mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50`}>
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">Notificações</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-primary hover:underline focus:outline-none"
                            >
                                Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="p-6 text-center text-gray-500">
                            Carregando...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            Nenhuma notificação no momento.
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                            {notifications.map((notification) => (
                                <Link
                                    href={getNotificationUrl(notification)}
                                    key={notification.id}
                                    className={`block p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? "bg-blue-50" : ""}`}
                                    onClick={() => {
                                        if (!notification.is_read) {
                                            markAsRead(notification.id);
                                        }
                                        setIsOpen(false); // Fechar dropdown ao clicar
                                    }}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-gray-700">
                                                {renderNotificationContent(notification)}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatNotificationDate(notification.created_at)}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="flex-shrink-0 ml-2 mt-1">
                                                <span className="block h-2 w-2 rounded-full bg-primary" />
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <Link
                            href="/notifications"
                            onClick={() => setIsOpen(false)} // Fechar dropdown
                            className="block w-full text-center text-sm text-primary hover:underline focus:outline-none"
                        >
                            Ver todas as notificações
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
} 