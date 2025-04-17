"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { Bell, Check, CheckCheck, ArrowLeft, X, Filter, Clock, CheckCircle, Circle, MessageSquare, Reply, Heart, User, BookOpen, BookText } from "lucide-react";
import { generateSlug } from "@/lib/utils";

interface Notification {
    id: string;
    user_id: string;
    read: boolean;
    created_at: string;
    // ... outros campos relevantes
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [user, setUser] = useState<any>(null);
    const [markingAll, setMarkingAll] = useState<boolean>(false);
    const [markingOne, setMarkingOne] = useState<string|null>(null);
    const [filter, setFilter] = useState<string>("all"); // "all", "unread", "read"

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

    async function fetchUserNotifications(userId: string) {
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

            // ... resto da lógica
        } catch (err) {
            // ... tratamento de erro
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            {/* Conteúdo da página de notificações */}
        </div>
    );
}
