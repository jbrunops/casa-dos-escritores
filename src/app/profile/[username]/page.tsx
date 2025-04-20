import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateSlug } from "@/lib/utils";
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
import type { Metadata } from 'next';
import type { Session } from '@supabase/supabase-js';

// Tipagem para os parâmetros da rota
interface ProfilePageParams {
    username: string;
}

// Tipagem para os dados do perfil (simplificada, idealmente viria de um arquivo de tipos)
interface ProfileData {
    id: string;
    username: string;
    created_at: string;
    avatar_url?: string | null;
    bio?: string | null;
    website_url?: string | null;
    twitter_url?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
}

// Tipagem para os dados da história (simplificada)
interface StoryData {
    id: string;
    title: string;
    created_at: string;
    category?: string | null;
    view_count?: string | number | null; // Supabase pode retornar como string ou number
}

// Tipagem para os props da página
interface ProfilePageProps {
    params: ProfilePageParams;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    const username = params.username; // Não precisa de Promise.resolve
    try {
        const supabase = await createServerSupabaseClient();
        // Idealmente, buscar apenas 'username' se for só para o título
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
        console.error("Erro ao gerar metadata do perfil:", error);
        return { title: "Perfil" };
    }
}

export default async function ProfilePage({ params }: ProfilePageProps): Promise<React.ReactElement> {
    const username = params.username; // Não precisa de Promise.resolve
    const decodedUsername = decodeURIComponent(username);

    try {
        const supabase = await createServerSupabaseClient();

        // Buscar perfil
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select<string, ProfileData>("*") 
            .eq("username", decodedUsername)
            .single();

        if (profileError || !profile) {
             console.error("Erro ao buscar perfil:", profileError?.message || profileError);
             notFound(); // notFound() já é um 'never' type, não precisa return
        }

        // Buscar histórias
        const { data: stories, error: storiesError } = await supabase
            .from("stories")
            .select<string, StoryData>("id, title, created_at, category, view_count")
            .eq("author_id", profile.id)
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        if (storiesError) {
             console.error("Erro ao buscar histórias:", storiesError.message);
             // Continuar mesmo com erro, pode não ter histórias
        }

        // Verificar sessão
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
             console.error("Erro ao buscar sessão:", sessionError.message);
             // Tratar erro de sessão como necessário, talvez mostrar um estado diferente
        }
        const session: Session | null = sessionData?.session ?? null;
        const isOwnProfile: boolean = !!session?.user?.id && session.user.id === profile.id;

        // Buscar contagem de seguidores
        const { count: followersCount, error: followersError } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profile.id);
        
        if (followersError) {
             console.error("Erro ao buscar contagem de seguidores:", followersError.message);
        }
            
        // Buscar contagem de seguindo
        const { count: followingCount, error: followingError } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', profile.id);
            
        if (followingError) {
             console.error("Erro ao buscar contagem de seguindo:", followingError.message);
        }

        // Verificar se o usuário logado segue este perfil
        let isFollowing: boolean = false;
        if (session?.user) {
            const { data: followData, error: followCheckError } = await supabase
                .from('follows')
                .select('id', { count: 'exact', head: true }) // Mais eficiente, só precisamos saber se existe
                .eq('follower_id', session.user.id)
                .eq('following_id', profile.id)
                .limit(1); // Só precisamos de um resultado
                
            if (followCheckError) {
                 console.error("Erro ao verificar se segue:", followCheckError.message);
            }
            // A verificação agora é baseada na contagem (se > 0, então segue)
            // Se followData não for null/undefined e count > 0 (ou se count for null mas data existir)
            // Adapte conforme a resposta exata do Supabase com head:true + limit(1)
            // Simplificando: se não deu erro e achou algo (mesmo que só head), assuma que segue.
            // Cuidado: a lógica exata depende da API. Vamos manter a lógica original por segurança:
             const { data: followRecord } = await supabase
                 .from('follows')
                 .select('id')
                 .eq('follower_id', session.user.id)
                 .eq('following_id', profile.id)
                 .maybeSingle();
             isFollowing = !!followRecord; // Usar a segunda query para ter certeza
        }

        // Calcular visualizações
        const totalViews: number =
            stories?.reduce(
                (sum: number, story: StoryData) => {
                    const count = typeof story.view_count === 'string' ? parseInt(story.view_count, 10) : story.view_count;
                    return sum + (Number.isFinite(count) ? count ?? 0 : 0);
                },
                0
            ) ?? 0;

        // Organizar histórias por categoria
        const storiesByCategory: Record<string, StoryData[]> = {};
        stories?.forEach((story: StoryData) => {
            const category = story.category || "Sem categoria";
            if (!storiesByCategory[category]) {
                storiesByCategory[category] = [];
            }
            storiesByCategory[category].push(story);
        });

        // Encontrar categoria favorita
        let favoriteCategory: string = "Nenhuma";
        let maxCount: number = 0;
        Object.entries(storiesByCategory).forEach(
            ([category, categoryStories]: [string, StoryData[]]) => {
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
        const joinDate: string = new Date(profile.created_at).toLocaleDateString('pt-BR', {
            year: 'numeric', 
            month: 'long'
        });

        // Função para formatar URLs
        const formatUrl = (url: string | null | undefined): string => {
            if (!url) return "#";
            // Verifica também se já tem o protocolo para evitar https://https://...
            if (url.startsWith("http://") || url.startsWith("https://")) {
                 return url;
            }
            return `https://${url}`;
        };

        const parseViewCount = (count: string | number | null | undefined): number => {
             if (typeof count === 'number') return count;
             if (typeof count === 'string') return parseInt(count, 10) || 0;
             return 0;
        }

        return (
            <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-8">
                <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {profile.avatar_url ? (
                                <div 
                                    className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-cover bg-center border-4 border-[#484DB5]"
                                    style={{ backgroundImage: `url(${profile.avatar_url})` }}
                                />
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
                                    <span>{followersCount ?? 0} seguidores</span>
                                </Link>
                                
                                <Link 
                                    href={`/profile/${username}/following`}
                                    className="flex items-center text-[#484DB5] hover:underline"
                                >
                                    <Users size={16} className="mr-1" />
                                    <span>Segue {followingCount ?? 0}</span>
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
                                        href={`/profile/edit`}
                                        className="inline-flex items-center h-10 px-4 rounded-md bg-[#484DB5] text-white hover:bg-[#3A3E9A]"
                                    >
                                        <Edit size={16} className="mr-1" />
                                        <span>Editar Perfil</span>
                                    </Link>
                                ) : (
                                    <UserFollowButton 
                                        profileId={profile.id}
                                        isFollowing={isFollowing}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 text-center">
                        <BookOpen size={24} className="mx-auto mb-2 text-[#484DB5]" />
                        <p className="text-xl font-semibold text-gray-900">{stories?.length || 0}</p>
                        <p className="text-sm text-gray-600">Histórias publicadas</p>
                    </div>
                    <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 text-center">
                        <Eye size={24} className="mx-auto mb-2 text-[#484DB5]" />
                        <p className="text-xl font-semibold text-gray-900">{totalViews.toLocaleString('pt-BR')}</p>
                        <p className="text-sm text-gray-600">Visualizações totais</p>
                    </div>
                    <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 text-center">
                        <Award size={24} className="mx-auto mb-2 text-[#484DB5]" />
                        <p className="text-xl font-semibold text-gray-900">{favoriteCategory}</p>
                        <p className="text-sm text-gray-600">Gênero preferido</p>
                    </div>
                </div>

                {/* Histórias publicadas */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Histórias Publicadas</h2>
                    {stories && stories.length > 0 ? (
                        Object.entries(storiesByCategory).map(([category, categoryStories]) => (
                            <div key={category} className="mb-6">
                                <h3 className="text-lg font-medium text-gray-800 mb-3">{category}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categoryStories.map((story: StoryData) => {
                                        const slug = generateSlug(story.title, story.id); 
                                        const viewCount = parseViewCount(story.view_count);
                                        return (
                                            <Link 
                                                href={`/story/${slug}`} 
                                                key={story.id} 
                                                className="block p-4 bg-white rounded-lg border border-[#E5E7EB] hover:shadow-md transition-shadow duration-200"
                                            >
                                                <h4 className="font-semibold text-gray-900 truncate mb-1" title={story.title}>{story.title}</h4>
                                                <div className="flex items-center text-sm text-gray-500 gap-2">
                                                    <Clock size={14} /> 
                                                    <span>{new Date(story.created_at).toLocaleDateString('pt-BR')}</span>
                                                    <Eye size={14} />
                                                    <span>{viewCount.toLocaleString('pt-BR')}</span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600 italic">{profile.username} ainda não publicou nenhuma história.</p>
                    )}
                </div>
            </div>
        );
    } catch (error: any) { // Captura 'any' e refina se necessário
        console.error("Erro na página de perfil:", { error: error?.message || error, username });
        // Considerar usar um componente de erro dedicado ou notFound()
        // Se o erro for específico de perfil não encontrado, usar notFound()
        if (error?.message?.includes('not found') || error?.code === 'PGRST116') { // Exemplo de código Supabase
             notFound();
        }
        // Para outros erros, talvez uma página de erro genérica?
        // Por enquanto, re-lança para Error Boundary ou _error.tsx
        throw error; 
    }
} 