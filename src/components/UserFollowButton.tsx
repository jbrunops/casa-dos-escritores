"use client";

import { useState, useTransition } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { SupabaseClient } from '@supabase/supabase-js';
import * as React from 'react';

// Props do componente
interface UserFollowButtonProps {
    profileId: string | number;
    isFollowing: boolean;
    userId?: string;
    className?: string;
}

export default function UserFollowButton({
    profileId,
    isFollowing,
    userId,
    className = "",
}: UserFollowButtonProps) {
    const [following, setFollowing] = useState<boolean>(isFollowing);
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const router = useRouter();
    const supabase: SupabaseClient = createBrowserClient();

    const loading = isLoading || isPending;

    // Função separada para criar notificação
    const createFollowNotification = async (currentUserId: string, followedId: string | number) => {
        try {
             const notificationData = {
                user_id: followedId,
                type: 'follow' as const,
                sender_id: currentUserId,
                is_read: false,
                created_at: new Date().toISOString()
            };
            const { error } = await supabase.from('notifications').insert(notificationData);
            if (error) console.error('Erro ao criar notificação:', error);
        } catch (error) {
            console.error('Erro inesperado ao criar notificação:', error);
        }
    };

    const handleFollowToggle = async () => {
        setIsLoading(true);
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw new Error(`Erro de sessão: ${sessionError.message}`);
            if (!session?.user?.id) {
                 return router.push('/login?redirect=/profile/' + profileId);
            }
            const currentUserId = session.user.id;
            if (currentUserId === profileId) {
                console.warn("Usuário tentando seguir a si mesmo.");
                setIsLoading(false);
                return;
            }

            if (following) {
                const { error } = await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: profileId });
                if (error) throw new Error(`Erro ao deixar de seguir: ${error.message}`);
                setFollowing(false);
            } else {
                const { error } = await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profileId });
                if (error) throw new Error(`Erro ao seguir: ${error.message}`);
                setFollowing(true);
                createFollowNotification(currentUserId, profileId);
            }
            startTransition(() => { router.refresh(); });
        } catch (error: any) {
            console.error('Erro ao atualizar status de seguidor:', error);
            alert(`Erro: ${error.message || 'Não foi possível completar a ação.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleFollowToggle}
            disabled={loading}
            className={`inline-flex items-center justify-center h-10 px-6 rounded-md transition-all duration-200 ${className} ${
                following
                    ? 'bg-white text-gray-700 border border-border hover:bg-gray-50'
                    : 'bg-primary text-white hover:bg-primary-600'
            }`.trim()}
            aria-label={following ? 'Deixar de seguir' : 'Seguir'}
        >
            {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
            ) : following ? (
                <UserMinus size={16} className="mr-2" />
            ) : (
                <UserPlus size={16} className="mr-2" />
            )}
            <span>{following ? 'Seguindo' : 'Seguir'}</span>
        </button>
    );
} 