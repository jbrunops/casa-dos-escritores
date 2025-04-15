import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ArrowLeft, Users } from "lucide-react";
import UserFollowButton from "@/components/UserFollowButton";

export async function generateMetadata({ params }) {
    const username = await Promise.resolve(params.username);
    try {
        const supabase = await createServerSupabaseClient();
        const { data } = await supabase
            .from("profiles")
            .select("username")
            .eq("username", decodeURIComponent(username))
            .single();

        if (!data) return { title: "Perfil não encontrado" };
        return {
            title: `Quem ${data.username} segue`,
            description: `Lista de pessoas que ${data.username} segue`,
        };
    } catch (error) {
        return { title: "Seguindo" };
    }
}

export default async function FollowingPage({ params }) {
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
        
        // Buscar pessoas que o usuário segue
        const { data: following, error } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', profile.id);

        if (error) {
            console.error("Erro ao buscar pessoas seguidas:", error.message, error.details, error.hint);
            return (
                <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
                    <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                        <p>Erro ao carregar pessoas seguidas.</p>
                        <p className="text-sm text-gray-500 mt-2">Por favor, tente novamente mais tarde.</p>
                    </div>
                </div>
            );
        }

        if (!following || following.length === 0) {
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
                        <Users size={24} className="mr-2 text-[#484DB5]" />
                        Pessoas que {profile.username} segue
                    </h1>

                    <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
                        <div className="p-8 text-center text-gray-500">
                            <p>Este usuário ainda não segue ninguém.</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Obter os perfis das pessoas seguidas
        const followingIds = following.map(f => f.following_id);
        const { data: followingProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, bio')
            .in('id', followingIds);
            
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

        // Para cada pessoa seguida, verificar se o usuário atual também os segue
        const followingWithStatus = await Promise.all(
            followingProfiles.map(async (followingProfile) => {
                let isFollowing = false;

                if (currentUserId) {
                    // Se o usuário atual é o mesmo do perfil que estamos visualizando,
                    // a pessoa já está sendo seguida
                    if (currentUserId === profile.id) {
                        isFollowing = true;
                    } else {
                        const { data: followData } = await supabase
                            .from('follows')
                            .select('id')
                            .eq('follower_id', currentUserId)
                            .eq('following_id', followingProfile.id)
                            .maybeSingle();
                            
                        isFollowing = !!followData;
                    }
                }
                
                return {
                    ...followingProfile,
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
                    <Users size={24} className="mr-2 text-[#484DB5]" />
                    Pessoas que {profile.username} segue
                </h1>

                <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
                    {followingWithStatus.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>Este usuário ainda não segue ninguém.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-[#E5E7EB]">
                            {followingWithStatus.map((followingUser) => (
                                <li key={followingUser.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <Link 
                                            href={`/profile/${followingUser.username}`}
                                            className="flex items-center flex-grow"
                                        >
                                            {/* Avatar */}
                                            {followingUser.avatar_url ? (
                                                <div 
                                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cover bg-center border border-[#E5E7EB] mr-3 sm:mr-4 flex-shrink-0"
                                                    style={{
                                                        backgroundImage: `url(${followingUser.avatar_url})`,
                                                    }}
                                                ></div>
                                            ) : (
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#484DB5] text-white flex items-center justify-center text-lg font-bold mr-3 sm:mr-4 flex-shrink-0">
                                                    {followingUser.username.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            
                                            {/* Informações do usuário */}
                                            <div className="min-w-0 flex-grow">
                                                <div className="font-medium text-gray-900 truncate">{followingUser.username}</div>
                                                {followingUser.bio && (
                                                    <p className="text-sm text-gray-500 line-clamp-1 overflow-hidden text-ellipsis">{followingUser.bio}</p>
                                                )}
                                            </div>
                                        </Link>
                                        
                                        {/* Botão de seguir/deixar de seguir */}
                                        {currentUserId && currentUserId !== followingUser.id && (
                                            <div className="ml-0 sm:ml-4 self-start sm:self-center mt-2 sm:mt-0">
                                                <UserFollowButton 
                                                    profileId={followingUser.id} 
                                                    isFollowing={followingUser.isFollowing}
                                                    username={followingUser.username}
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
        console.error("Erro na página de pessoas seguidas:", error);
        return (
            <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                    <p>Ocorreu um erro ao carregar esta página.</p>
                </div>
            </div>
        );
    }
} 