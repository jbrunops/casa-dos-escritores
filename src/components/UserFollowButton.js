"use client";

import { useState, useTransition } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

export default function UserFollowButton({ profileId, isFollowing, username }) {
    const [following, setFollowing] = useState(isFollowing);
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createBrowserClient();

    // Combinando os estados de loading
    const loading = isLoading || isPending;

    // Função separada para criar notificação
    const createFollowNotification = async (userId, followedId, senderUsername) => {
        try {
            console.log('Tentando criar notificação para:', followedId);
            
            // Verificar se a tabela notifications existe
            const { error: tableCheckError } = await supabase
                .from('notifications')
                .select('id')
                .limit(1);
                
            if (tableCheckError) {
                console.error('Erro ao verificar tabela de notificações:', tableCheckError);
                return;
            }
            
            // Buscar username do usuário que está seguindo
            const { data: senderData, error: senderError } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', userId)
                .single();
                
            if (senderError) {
                console.error('Erro ao buscar dados do remetente:', senderError);
                return;
            }
            
            const senderName = senderData?.username || 'Usuário';
            
            // Estrutura para a notificação com todos os campos necessários
            const notificationData = {
                user_id: followedId,
                type: 'follow',
                sender_id: userId,
                is_read: false,
                content: `${senderName} começou a seguir você`,
                created_at: new Date().toISOString()
            };
            
            // Inserir a notificação com log detalhado
            const { data, error: insertError } = await supabase
                .from('notifications')
                .insert(notificationData)
                .select();
                
            if (insertError) {
                console.error('Erro ao criar notificação:', insertError.message, insertError.details, insertError.hint);
                return;
            }
            
            console.log('Notificação criada com sucesso:', data);
            
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
        }
    };

    const handleFollowToggle = async () => {
        try {
            // Verificar sessão do usuário
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) throw new Error(`Erro de sessão: ${sessionError.message}`);
            
            if (!session) {
                // Redirecionar para login se não estiver autenticado
                return router.push('/login');
            }
            
            setIsLoading(true);
            
            if (following) {
                // Deixar de seguir
                const { error: deleteError } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', session.user.id)
                    .eq('following_id', profileId);
                    
                if (deleteError) throw new Error(`Erro ao deixar de seguir: ${deleteError.message}`);
            } else {
                // Seguir
                const { error: insertError } = await supabase
                    .from('follows')
                    .insert({
                        follower_id: session.user.id,
                        following_id: profileId
                    });
                    
                if (insertError) throw new Error(`Erro ao seguir: ${insertError.message}`);
                
                // Buscar username do usuário atual
                try {
                    const { data: userData } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', session.user.id)
                        .single();
                    
                    // Criar notificação em um processo separado
                    // Não esperamos por ele para continuar o fluxo principal
                    createFollowNotification(session.user.id, profileId, userData?.username);
                } catch (userError) {
                    console.error('Erro ao buscar dados do usuário:', userError);
                    // Continuar mesmo se houver erro ao buscar o usuário
                    createFollowNotification(session.user.id, profileId, 'Usuário');
                }
            }
            
            // Inverter o estado
            setFollowing(!following);
            
            // Atualizar a UI
            startTransition(() => {
                router.refresh();
            });
        } catch (error) {
            console.error('Erro ao atualizar status de seguidor:', error);
            alert(`Não foi possível ${following ? 'deixar de seguir' : 'seguir'} este usuário. Por favor, tente novamente mais tarde.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleFollowToggle}
            disabled={loading}
            className={`inline-flex items-center justify-center h-10 px-6 rounded-md transition-all duration-200 ${
                following
                    ? 'bg-white text-gray-700 border border-[#E5E7EB] hover:bg-gray-50'
                    : 'bg-[#484DB5] text-white hover:bg-opacity-90'
            }`}
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