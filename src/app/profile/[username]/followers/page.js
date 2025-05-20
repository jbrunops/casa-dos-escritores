import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ArrowLeft, UserPlus } from "lucide-react";
import UserFollowButton from "@/components/UserFollowButton";

export async function generateMetadata({ params }) {
    const username = await Promise.resolve(params.username);
    try {
        const supabase = await createServerSupabaseClient();
        const { data } = await supabase
            .from("profiles")
            .select("username, first_name, last_name")
            .eq("username", decodeURIComponent(username))
            .single();

        if (!data) return { title: "Perfil não encontrado" };
        
        // Usar nome completo quando disponível, caso contrário usar nome de usuário
        const displayName = (data.first_name || data.last_name) 
            ? `${data.first_name || ''} ${data.last_name || ''}`.trim() 
            : data.username;
            
        return {
            title: `Seguidores de ${displayName}`,
            description: `Lista de pessoas que seguem ${displayName}`,
        };
    } catch (error) {
        return { title: "Seguidores" };
    }
}

export default async function FollowersPage({ params }) {
    const username = await Promise.resolve(params.username);
    const decodedUsername = decodeURIComponent(username);

    try {
        const supabase = await createServerSupabaseClient();

        // Buscar perfil
        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", decodedUsername)
            .single();

        if (!profile) return notFound();

        // Verificar sessão
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        const currentUserId = session?.user?.id;
        
        // Buscar seguidores
        const { data: followers, error } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', profile.id);

        if (error) {
            console.error("Erro ao buscar seguidores:", error.message, error.details, error.hint);
            return (
                <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
                    <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                        <p>Erro ao carregar seguidores.</p>
                        <p className="text-sm text-gray-500 mt-2">Por favor, tente novamente mais tarde.</p>
                    </div>
                </div>
            );
        }

        if (!followers || followers.length === 0) {
            return (
                <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
                    <div className="mb-6">
                        <Link 
                            href={`/profile/${username}`} 
                            className="inline-flex items-center text-[#484DB5] hover:underline"
                        >
                            <ArrowLeft size={16} className="mr-1" />
                            <span>Voltar para o perfil de {profile.username}</span>
                        </Link>
                    </div>
                    
                    <h1 className="text-2xl font-bold mb-6 flex items-center">
                        <UserPlus size={24} className="mr-2 text-[#484DB5]" />
                        Seguidores de {profile.username}
                    </h1>

                    <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
                        <div className="p-8 text-center text-gray-500">
                            <p>Este usuário ainda não tem seguidores.</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Obter os perfis dos seguidores
        const followerIds = followers.map(f => f.follower_id);
        const { data: followerProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, bio, first_name, last_name')
            .in('id', followerIds);
            
        if (profilesError) {
            console.error("Erro ao buscar perfis:", profilesError.message, profilesError.details, profilesError.hint);
            return (
                <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
                    <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                        <p>Erro ao carregar perfis.</p>
                        <p className="text-sm text-gray-500 mt-2">Por favor, tente novamente mais tarde.</p>
                    </div>
                </div>
            );
        }

        // Para cada seguidor, verificar se o usuário atual os segue
        const followersWithStatus = await Promise.all(
            followerProfiles.map(async (followerProfile) => {
                let isFollowing = false;

                if (currentUserId) {
                    const { data: followData } = await supabase
                        .from('follows')
                        .select('id')
                        .eq('follower_id', currentUserId)
                        .eq('following_id', followerProfile.id)
                        .maybeSingle();
                        
                    isFollowing = !!followData;
                }
                
                return {
                    ...followerProfile,
                    isFollowing
                };
            })
        );

        return (
            <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
                <div className="mb-6">
                    <Link 
                        href={`/profile/${username}`} 
                        className="inline-flex items-center text-[#484DB5] hover:underline"
                    >
                        <ArrowLeft size={16} className="mr-1" />
                        <span>Voltar para o perfil de {profile.username}</span>
                    </Link>
                </div>
                
                <h1 className="text-2xl font-bold mb-6 flex items-center">
                    <UserPlus size={24} className="mr-2 text-[#484DB5]" />
                    Seguidores de {profile.username}
                </h1>

                <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
                    {followersWithStatus.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>Este usuário ainda não tem seguidores.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-[#E5E7EB]">
                            {followersWithStatus.map((follower) => (
                                <li key={follower.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <Link 
                                            href={`/profile/${follower.username}`}
                                            className="flex items-center flex-grow"
                                        >
                                            {/* Avatar */}
                                            {follower.avatar_url ? (
                                                <div 
                                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cover bg-center border border-[#E5E7EB] mr-3 sm:mr-4 flex-shrink-0"
                                                    style={{
                                                        backgroundImage: `url(${follower.avatar_url})`,
                                                    }}
                                                ></div>
                                            ) : (
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#484DB5] text-white flex items-center justify-center text-lg font-bold mr-3 sm:mr-4 flex-shrink-0">
                                                    {follower.first_name ? follower.first_name.charAt(0).toUpperCase() : follower.username.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            
                                            {/* Informações do usuário */}
                                            <div className="min-w-0 flex-grow">
                                                {(follower.first_name || follower.last_name) ? (
                                                    <>
                                                        <div className="font-medium text-gray-900 truncate">
                                                            {`${follower.first_name || ''} ${follower.last_name || ''}`.trim()}
                                                        </div>
                                                        <div className="text-xs text-gray-500">@{follower.username}</div>
                                                    </>
                                                ) : (
                                                    <div className="font-medium text-gray-900 truncate">{follower.username}</div>
                                                )}
                                                {follower.bio && (
                                                    <p className="text-sm text-gray-500 line-clamp-1 overflow-hidden text-ellipsis mt-1">{follower.bio}</p>
                                                )}
                                            </div>
                                        </Link>
                                        
                                        {/* Botão de seguir/deixar de seguir */}
                                        {currentUserId && currentUserId !== follower.id && (
                                            <div className="ml-0 sm:ml-4 self-start sm:self-center mt-2 sm:mt-0">
                                                <UserFollowButton 
                                                    profileId={follower.id} 
                                                    isFollowing={follower.isFollowing}
                                                    username={follower.username}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error("Erro na página de seguidores:", error);
        return (
            <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                    <p>Ocorreu um erro ao carregar esta página.</p>
                </div>
            </div>
        );
    }
} 