import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateSlug } from "@/lib/utils"; // agora usando utils.ts
import { 
    Globe, 
    Twitter, 
    Facebook, 
    Instagram, 
    Edit, 
    Eye,
    BookOpen, 
    BookText,
    Clock,
    Award,
    Calendar,
    UserPlus,
    Users 
} from "lucide-react";
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
            title: `Perfil de ${data.username}`,
            description: `Conheça as histórias escritas por ${data.username} na Plataforma para Escritores`,
        };
    } catch (error) {
        return { title: "Perfil" };
    }
}

export default async function ProfilePage({ params }) {
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

        // Buscar histórias
        const { data: stories } = await supabase
            .from("stories")
            .select("id, title, created_at, category, view_count")
            .eq("author_id", profile.id)
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        // Verificar sessão
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        const isOwnProfile = session?.user?.id === profile.id;

        // Buscar contagem de seguidores
        const { count: followersCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profile.id);
            
        // Buscar contagem de seguindo
        const { count: followingCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', profile.id);
            
        // Verificar se o usuário logado segue este perfil
        let isFollowing = false;
        if (session?.user) {
            const { data: followData } = await supabase
                .from('follows')
                .select('id')
                .eq('follower_id', session.user.id)
                .eq('following_id', profile.id)
                .maybeSingle();
                
            isFollowing = !!followData;
        }

        // Calcular visualizações
        const totalViews =
            stories?.reduce(
                (sum, story) => sum + (parseInt(story.view_count) || 0),
                0
            ) || 0;

        // Organizar histórias por categoria
        const storiesByCategory = {};
        stories?.forEach((story) => {
            const category = story.category || "Sem categoria";
            if (!storiesByCategory[category]) {
                storiesByCategory[category] = [];
            }
            storiesByCategory[category].push(story);
        });

        // Encontrar categoria favorita
        let favoriteCategory = "Nenhuma";
        let maxCount = 0;
        Object.entries(storiesByCategory).forEach(
            ([category, categoryStories]) => {
                if (
                    categoryStories.length > maxCount &&
                    category !== "Sem categoria"
                ) {
                    maxCount = categoryStories.length;
                    favoriteCategory = category;
                }
            }
        );

        // Calcular data de inscrição
        const joinDate = new Date(profile.created_at).toLocaleDateString('pt-BR', {
            year: 'numeric', 
            month: 'long'
        });

        // Função para formatar URLs
        const formatUrl = (url) => {
            if (!url) return "#";
            return url.startsWith("http") ? url : `https://${url}`;
        };

        return (
            <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
                <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {profile.avatar_url ? (
                                <div 
                                    className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-cover bg-center border-4 border-[#484DB5]"
                                    style={{
                                        backgroundImage: `url(${profile.avatar_url})`,
                                    }}
                                ></div>
                            ) : (
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#484DB5] text-white flex items-center justify-center text-4xl font-bold border-4 border-[#484DB5]">
                                    {profile.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-grow text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{profile.username}</h1>
                            
                            {/* Membro desde e seguidores */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start text-gray-600 mb-4 gap-4">
                                <div className="flex items-center">
                                    <Calendar size={16} className="mr-1" />
                                    <span>Membro desde {joinDate}</span>
                                </div>
                                
                                <Link 
                                    href={`/profile/${username}/followers`}
                                    className="flex items-center text-[#484DB5] hover:underline"
                                >
                                    <UserPlus size={16} className="mr-1" />
                                    <span>{followersCount || 0} seguidores</span>
                                </Link>
                                
                                <Link 
                                    href={`/profile/${username}/following`}
                                    className="flex items-center text-[#484DB5] hover:underline"
                                >
                                    <Users size={16} className="mr-1" />
                                    <span>Segue {followingCount || 0}</span>
                                </Link>
                            </div>

                            {/* Bio */}
                            {profile.bio && (
                                <div className="mb-4 text-gray-700">
                                    <p>{profile.bio}</p>
                                </div>
                            )}

                            {/* Links sociais */}
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                                {profile.website_url && (
                                    <a
                                        href={formatUrl(profile.website_url)}
                                        className="inline-flex items-center h-10 px-4 rounded-md border border-[#E5E7EB] text-gray-700 hover:bg-gray-50"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Website"
                                    >
                                        <Globe size={16} className="mr-1" />
                                        <span>Website</span>
                                    </a>
                                )}
                                {profile.twitter_url && (
                                    <a
                                        href={formatUrl(profile.twitter_url)}
                                        className="inline-flex items-center h-10 px-4 rounded-md border border-[#E5E7EB] text-gray-700 hover:bg-gray-50"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Twitter"
                                    >
                                        <Twitter size={16} className="mr-1" />
                                        <span>Twitter</span>
                                    </a>
                                )}
                                {profile.facebook_url && (
                                    <a
                                        href={formatUrl(profile.facebook_url)}
                                        className="inline-flex items-center h-10 px-4 rounded-md border border-[#E5E7EB] text-gray-700 hover:bg-gray-50"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Facebook"
                                    >
                                        <Facebook size={16} className="mr-1" />
                                        <span>Facebook</span>
                                    </a>
                                )}
                                {profile.instagram_url && (
                                    <a
                                        href={formatUrl(profile.instagram_url)}
                                        className="inline-flex items-center h-10 px-4 rounded-md border border-[#E5E7EB] text-gray-700 hover:bg-gray-50"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Instagram"
                                    >
                                        <Instagram size={16} className="mr-1" />
                                        <span>Instagram</span>
                                    </a>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                {isOwnProfile ? (
                                    <Link
                                        href="/profile/edit"
                                        className="inline-flex items-center justify-center h-10 px-6 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-all duration-200"
                                    >
                                        <Edit size={16} className="mr-2" />
                                        <span>Editar Perfil</span>
                                    </Link>
                                ) : (
                                    <UserFollowButton 
                                        profileId={profile.id} 
                                        isFollowing={isFollowing}
                                        username={profile.username}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 flex items-center">
                        <div className="p-3 bg-blue-50 text-[#484DB5] rounded-full mr-4">
                            <BookText size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#484DB5]">{stories?.length || 0}</div>
                            <div className="text-sm text-gray-600">Histórias</div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 flex items-center">
                        <div className="p-3 bg-blue-50 text-[#484DB5] rounded-full mr-4">
                            <Eye size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#484DB5]">{totalViews}</div>
                            <div className="text-sm text-gray-600">Visualizações</div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 flex items-center">
                        <div className="p-3 bg-blue-50 text-[#484DB5] rounded-full mr-4">
                            <Award size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#484DB5]">{favoriteCategory}</div>
                            <div className="text-sm text-gray-600">Categoria Favorita</div>
                        </div>
                    </div>
                </div>

                {/* Histórias organizadas por categoria */}
                <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
                    <div className="border-b border-[#E5E7EB] p-4 bg-gray-50">
                        <h2 className="flex items-center text-lg font-medium text-gray-900">
                            <BookOpen size={20} className="mr-2 text-[#484DB5]" /> 
                            Histórias Publicadas
                        </h2>
                    </div>
                    
                    <div className="p-6">
                        {!stories || stories.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                                <div className="mb-4 p-4 bg-gray-50 rounded-full">
                                    <BookText size={48} className="text-gray-400" />
                                </div>
                                <p>Nenhuma história publicada ainda.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(storiesByCategory).map(
                                    ([category, categoryStories]) => (
                                        <div
                                            key={category}
                                            className="pb-6 border-b border-[#E5E7EB] last:border-0"
                                        >
                                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                                {category}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {categoryStories.map((story) => (
                                                    <Link
                                                        href={`/story/${generateSlug(story.title, story.id)}`}
                                                        key={story.id}
                                                        className="block p-4 border border-[#E5E7EB] rounded-md hover:border-[#484DB5]"
                                                    >
                                                        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{story.title}</h4>
                                                        <div className="flex justify-between text-sm text-gray-500">
                                                            <span className="flex items-center">
                                                                <Calendar size={14} className="mr-1" />
                                                                {new Date(
                                                                    story.created_at
                                                                ).toLocaleDateString(
                                                                    "pt-BR"
                                                                )}
                                                            </span>
                                                            <span className="flex items-center">
                                                                <Eye size={14} className="mr-1" />
                                                                {story.view_count ||
                                                                    0}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        return (
            <div className="max-w-[75rem] mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar perfil</h1>
                <p className="text-gray-700 mb-6">Não foi possível carregar os dados do perfil.</p>
                <Link href="/" className="inline-flex items-center justify-center h-10 px-6 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90">
                    Voltar para a página inicial
                </Link>
            </div>
        );
    }
}
