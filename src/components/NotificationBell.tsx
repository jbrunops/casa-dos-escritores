"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Bell, Check, X, ArrowRight, MessageSquare, Reply, Heart, User, BookOpen, BookText } from "lucide-react";
import Link from "next/link";
import { generateSlug } from "@/lib/utils";

interface Profile {
  username: string;
  avatar_url?: string;
}

interface Notification {
  id: string;
  user_id: string;
  is_read: boolean;
  created_at: string;
  type: string;
  content: string;
  story_id?: string;
  chapter_id?: string;
  profiles?: Profile;
  [key: string]: any;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const supabase = createBrowserClient();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
        setUnreadCount(data?.filter((n: Notification) => !n.is_read).length || 0);
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [supabase]);

  // ...demais funções e renderização permanecem iguais, apenas adicione tipagens conforme necessário

  // Exemplo de renderização básica de sininho
  return (
    <div ref={dropdownRef} className="relative">
      <button onClick={() => setIsOpen((open) => !open)} className="relative">
        <Bell className="w-6 h-6 text-[#484DB5]" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-100 font-bold text-gray-700">Notificações</div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Carregando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Nenhuma notificação.</div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className={`p-4 border-b border-gray-100 ${!notification.is_read ? 'bg-[#484DB5]/10' : ''}`}>
                  <div className="flex items-center gap-2">
                    {notification.profiles?.avatar_url ? (
                      <img src={notification.profiles.avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                    <div>
                      <div className="font-semibold text-sm">{notification.profiles?.username || "Usuário"}</div>
                      <div className="text-xs text-gray-600">{notification.content}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(notification.created_at).toLocaleString('pt-BR')}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
