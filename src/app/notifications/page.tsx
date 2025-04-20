"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import {
    Bell,
    Check,
    CheckCheck,
    ArrowLeft,
    X,
    Filter,
    Clock,
    CheckCircle,
    Circle,
    MessageSquare,
    Reply,
    Heart,
    User as UserIcon, // Renomeado para evitar conflito
    BookOpen,
    BookText,
    Loader,
    Trash2,
    Layers,
    ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User } from "@supabase/supabase-js"; // Importar tipo User
import Image from 'next/image';

// --- Interfaces ---
interface Profile {
    username: string | null;
    avatar_url: string | null;
}

// Use a more specific type for additional_data if possible, otherwise keep as Record
interface Notification {
    id: string;
    user_id: string;
    actor_id: string | null;
    type: string; // Ideally an enum/literal type: 'comment' | 'reply' | 'follow' etc.
    content: string; // Main notification text (might be generated based on type/data)
    link: string | null;
    related_id: string | null;
    is_read: boolean;
    created_at: string;
    additional_data: Record<string, any> | null; // Flexible for various notification types
    profiles: Profile | null; // Actor profile (the one performing the action)
}

type NotificationFilter = "all" | "unread" | "read";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [markingAll, setMarkingAll] = useState(false);
    const [markingOne, setMarkingOne] = useState<string | null>(null); // Store ID being marked
    const [deletingOne, setDeletingOne] = useState<string | null>(null); // Store ID being deleted
    const [filter, setFilter] = useState<NotificationFilter>("all");

    const router = useRouter();
    const supabase = createBrowserClient();

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) {
                    router.push("/login?redirect=/notifications");
                    return;
                }
                setUser(session.user);
                await fetchUserNotifications(session.user.id);
            } catch (error: any) {
                console.error("Erro ao carregar notificações:", error.message);
                 // TODO: Show error to user
            } finally {
                setLoading(false);
            }
        }

        fetchData();
        // No dependency array needed if only running on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchUserNotifications(userId: string) {
        setLoading(true); // Ensure loading state is set
        try {
            const { data, error } = await supabase
                .from("notifications")
                .select(`
                    *,
                    profiles:actor_id(username, avatar_url) 
                `)
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            setNotifications((data as Notification[]) || []);
        } catch (error: any) {
            console.error("Erro ao buscar notificações:", error.message);
            setNotifications([]); // Clear on error
        } finally {
            setLoading(false);
        }
    }

    const markAsRead = async (notificationId: string) => {
        // Optimistic UI update
        const previousNotifications = [...notifications];
        setNotifications((prev) =>
            prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
        setMarkingOne(notificationId);

        try {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notificationId)
                .eq("user_id", user?.id); // Ensure only owner can mark as read

            if (error) {
                // Revert optimistic update on error
                setNotifications(previousNotifications);
                console.error("Erro ao marcar notificação como lida:", error);
                // TODO: Show error toast
            }
        } catch (error: any) {
            setNotifications(previousNotifications);
            console.error("Exceção ao marcar notificação como lida:", error.message);
            // TODO: Show error toast
        } finally {
            setMarkingOne(null);
        }
    };

    const markAllAsRead = async () => {
        if (!user || notifications.filter(n => !n.is_read).length === 0) return;

        // Optimistic UI update
        const previousNotifications = [...notifications];
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setMarkingAll(true);

        try {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", user.id)
                .eq("is_read", false);

            if (error) {
                 // Revert optimistic update
                setNotifications(previousNotifications);
                console.error("Erro ao marcar notificações como lidas:", error);
                // TODO: Show error toast
            }
        } catch (error: any) {
             setNotifications(previousNotifications);
            console.error("Exceção ao marcar notificações como lidas:", error.message);
            // TODO: Show error toast
        } finally {
            setMarkingAll(false);
        }
    };

     const deleteNotification = async (notificationId: string) => {
        // Optimistic UI update
        const previousNotifications = [...notifications];
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setDeletingOne(notificationId);

        try {
            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("id", notificationId)
                .eq("user_id", user?.id); // Ensure only owner can delete

            if (error) {
                 // Revert optimistic update
                setNotifications(previousNotifications);
                console.error("Erro ao excluir notificação:", error);
                // TODO: Show error toast
            }
        } catch (error: any) {
            setNotifications(previousNotifications);
            console.error("Exceção ao excluir notificação:", error.message);
            // TODO: Show error toast
        } finally {
            setDeletingOne(null);
        }
    };

    // --- Utility Functions ---
    const formatNotificationDate = (dateString: string): string => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR });
        } catch {
            return "Data inválida";
        }
    };

    const getNotificationUrl = (notification: Notification): string => {
         // Use pre-defined link if available
        if (notification.link) return notification.link;
        
        // Fallback logic based on type and additional_data (keep it simple)
        const { type, additional_data, related_id } = notification;
        const storyId = additional_data?.story_id;
        const seriesId = additional_data?.series_id;
        const chapterId = additional_data?.chapter_id;
        const actorUsername = notification.profiles?.username;

        if ((type === "comment" || type === "reply") && related_id) {
             // Link to the content where the comment/reply was made
             if (storyId) return `/story/${storyId}#comment-${related_id}`;
             if (chapterId && additional_data?.series_id) return `/ler/${additional_data.series_id}/${chapterId}#comment-${related_id}`;
             if (seriesId) return `/obra/${seriesId}#comment-${related_id}`;
         }
         if (type === "follow" && actorUsername) {
            return `/profile/${actorUsername}`;
         }
         if (type === "new_chapter" && chapterId && seriesId) {
             return `/ler/${seriesId}/${chapterId}`;
         }
         if (type === "new_series" && seriesId) {
             return `/obra/${seriesId}`;
         }
         if (type === "new_story" && storyId) {
             return `/story/${storyId}`;
         }
        
         // Default fallback
         return "/dashboard";
    };

     const getNotificationIcon = (type: string): React.ReactNode => {
        switch (type) {
            case "comment": return <MessageSquare size={18} className="text-blue-600" />;
            case "reply": return <Reply size={18} className="text-blue-600" />;
            case "like": return <Heart size={18} className="text-red-600" />;
            case "follow": return <UserIcon size={18} className="text-green-600" />;
            case "new_story": return <BookText size={18} className="text-purple-600" />;
            case "new_chapter": return <BookOpen size={18} className="text-purple-600" />;
            case "new_series": return <Layers size={18} className="text-purple-600" />;
            // Add more specific icons if needed
            default: return <Bell size={18} className="text-gray-500" />;
        }
    };

    // --- Filtering and Memoization ---
    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            if (filter === "read") return n.is_read;
            if (filter === "unread") return !n.is_read;
            return true;
        });
    }, [notifications, filter]);

    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.is_read).length;
    }, [notifications]);

    // --- Render Logic ---
    if (loading && notifications.length === 0) {
         return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader size={40} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                    <Bell size={24} className="mr-3 text-primary" />
                    Notificações
                </h1>
                 <Link href="/dashboard" className="text-sm text-gray-600 hover:text-primary flex items-center">
                    <ArrowLeft size={16} className="mr-1" />
                    Voltar ao Painel
                </Link>
            </div>

            {/* Filter and Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-5 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex space-x-1 border border-gray-300 rounded-md p-1 bg-white">
                     {(['all', 'unread', 'read'] as NotificationFilter[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${filter === f ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            {f === 'all' ? 'Todas' : f === 'unread' ? `Não Lidas ${unreadCount > 0 ? `(${unreadCount})` : ''}` : 'Lidas'}
                        </button>
                    ))}
                 </div>
                <button
                    onClick={markAllAsRead}
                    disabled={markingAll || unreadCount === 0}
                    className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                     {markingAll ? <Loader size={16} className="animate-spin mr-2" /> : <CheckCheck size={16} className="mr-2" />}
                    Marcar todas como lidas
                </button>
            </div>

            {/* Notifications List */}
            {loading && notifications.length > 0 && (
                <div className="text-center py-4 text-gray-500">Atualizando...</div>
            )}
            {!loading && filteredNotifications.length === 0 ? (
                 <div className="text-center py-10 px-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                     <Bell size={40} className="mx-auto text-gray-300 mb-3" />
                     <p className="text-gray-500">
                         {filter === 'unread' ? 'Nenhuma notificação não lida.' :
                          filter === 'read' ? 'Nenhuma notificação lida encontrada.' :
                          'Você ainda não tem notificações.'}
                     </p>
                 </div>
            ) : (
                <ul className="space-y-3">
                     {filteredNotifications.map((notification) => {
                        const url = getNotificationUrl(notification);
                        const isLoadingThis = markingOne === notification.id || deletingOne === notification.id;
                        return (
                             <li
                                key={notification.id}
                                className={`relative flex items-start space-x-4 p-4 border rounded-lg transition-colors duration-200 ${notification.is_read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200 shadow-sm'}`}
                            >
                                 {/* Read Status Indicator */}
                                {!notification.is_read && (
                                     <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" title="Não lida"></span>
                                 )}
 
                                 {/* Icon */}
                                 <div className="flex-shrink-0 pt-1">
                                     {notification.profiles?.avatar_url ? (
                                         <Link href={`/profile/${notification.profiles.username}`}>
                                             <Image
                                                 src={notification.profiles.avatar_url}
                                                 alt={notification.profiles.username || 'Avatar'}
                                                 width={36}
                                                 height={36}
                                                 className="rounded-full border border-gray-200"
                                             />
                                         </Link>
                                     ) : (
                                         <span className="flex items-center justify-center w-9 h-9 bg-gray-100 rounded-full border border-gray-200">
                                             {getNotificationIcon(notification.type)}
                                         </span>
                                     )}
                                 </div>
 
                                 {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-700 mb-1 leading-snug">
                                         {/* Renderização de conteúdo customizada pode vir aqui no futuro */} 
                                         {notification.content} 
                                     </div>
                                    <p className="text-xs text-gray-500 flex items-center">
                                        <Clock size={12} className="mr-1" />
                                        {formatNotificationDate(notification.created_at)}
                                    </p>
                                 </div>
 
                                 {/* Actions */}
                                 <div className="flex-shrink-0 flex items-center space-x-2 pt-1">
                                    {isLoadingThis ? (
                                         <Loader size={16} className="animate-spin text-gray-400" />
                                     ) : (
                                        <>
                                             {!notification.is_read && (
                                                 <button
                                                     onClick={() => markAsRead(notification.id)}
                                                     title="Marcar como lida"
                                                     className="p-1 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-100 transition-colors"
                                                 >
                                                     <CheckCircle size={16} />
                                                 </button>
                                             )}
                                            <Link href={url} title="Ir para conteúdo" className="p-1 text-gray-400 hover:text-primary rounded-full hover:bg-blue-100 transition-colors">
                                                 <ArrowRight size={16} />
                                             </Link>
                                             <button
                                                 onClick={() => deleteNotification(notification.id)}
                                                 title="Excluir notificação"
                                                 className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                             >
                                                 <Trash2 size={16} />
                                             </button>
                                         </>
                                     )}
                                 </div>
                             </li>
                         );
                    })}
                </ul>
            )}
        </div>
    );
} 