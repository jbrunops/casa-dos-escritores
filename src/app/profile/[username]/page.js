import { notFound } from "next/navigation";
import Link from "next/link";
import { generateSlug } from "@/lib/utils";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
    Users, 
    MessageSquare,
    Bookmark,
    Hash,
    TrendingUp,
    Trash2,
    PlusCircle,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";
import UserFollowButton from "@/components/UserFollowButton";
import ProfileStoryActions from "@/components/ProfileStoryActions";
import DeleteModal from "@/components/DeleteModal";

export async function generateMetadata({ params }) {
    const resolvedParams = await Promise.resolve(params);
    const username = resolvedParams.username;
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name, value, options) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch (error) {
                            // O erro será tratado se set falhar
                        }
                    },
                    remove(name, options) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch (error) {
                           // O erro será tratado se set falhar
                        }
                    },
                },
            }
        );
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
    const resolvedParams = await Promise.resolve(params);
    const username = resolvedParams.username;
    const decodedUsername = decodeURIComponent(username);

    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value;
                },
                set(name, value, options) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // O erro será tratado se set falhar
                    }
                },
                remove(name, options) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                       // O erro será tratado se set falhar
                    }
                },
            },
        }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
        console.error("--- ERRO CRÍTICO AO BUSCAR USUÁRIO ---", userError);
        // Considerar lançar um erro ou retornar uma página de erro aqui
        // return <ErroPage mensagem="Não foi possível autenticar o usuário." />;
    }
    const user = userData?.user;

    try {
        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", decodedUsername)
            .single();

        if (!profile) return notFound();

        const isOwnProfile = user?.id === profile.id;

        console.log("--- DEBUG: Perfil Data ---");
        console.log("Username Decoded:", decodedUsername);
        console.log("Profile ID:", profile?.id);
        console.log("Session User ID (from getUser):", user?.id);
        console.log("Is Own Profile:", isOwnProfile);

        let storiesQuery = supabase
            .from("stories")
            .select("id, title, created_at, category, view_count, is_published, updated_at")
            .eq("author_id", profile.id)
            .eq("is_part_of_series", false)
            .order("created_at", { ascending: false });

        if (!isOwnProfile) {
            storiesQuery = storiesQuery.eq("is_published", true);
        }

        let stories = null;
        let storiesError = null;
        try {
            const { data: fetchedStories, error: queryError } = await storiesQuery;
            if (queryError) {
                storiesError = queryError;
            } else {
                stories = fetchedStories;
            }
        } catch (e) {
            storiesError = e;
        }
        
        if (storiesError) {
            console.error("--- ERRO CRÍTICO AO BUSCAR STORIES ---", storiesError);
        }

        console.log("--- DEBUG: Stories Data ---");
        console.log("Fetched Stories:", stories);

        const { data: series } = await supabase
            .from("series")
            .select("id, title, created_at, genre, view_count, cover_url, tags, description")
            .eq("author_id", profile.id)
            .order("created_at", { ascending: false });

        let allSeries = [];
        if (series && series.length > 0) {
            for (const s of series) {
                const { data: chapters, error } = await supabase
                    .from("chapters")
                    .select("id, title, chapter_number, view_count")
                    .eq("series_id", s.id)
                    .order("chapter_number", { ascending: true });
                
                allSeries.push({
                    ...s,
                    chapters: chapters || [],
                    chapterCount: chapters ? chapters.length : 0
                });
            }
        }

        console.log("--- DEBUG: Series Data ---");
        console.log("Fetched Series (initial):", series);
        console.log("Processed All Series (with chapters):", allSeries);

        const { data: popularChapters } = await supabase
            .from("chapters")
            .select("id, title, chapter_number, view_count, series_id, series:series(title)")
            .eq("author_id", profile.id)
            .order("view_count", { ascending: false })
            .limit(5);

        const { data: comments } = await supabase
            .from("comments_with_author")
            .select("id, text, created_at, story_id, series_id, chapter_id")
            .eq("author_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(5);

        const { count: followersCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profile.id);
            
        const { count: followingCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', profile.id);
            
        let isFollowing = false;
        if (user && !isOwnProfile) {
            const { data: followData } = await supabase
                .from('follows')
                .select('id')
                .eq('follower_id', user.id)
                .eq('following_id', profile.id)
                .maybeSingle();
                
            isFollowing = !!followData;
        }

        const totalStoryViews =
            stories?.reduce(
                (sum, story) => sum + (parseInt(story.view_count) || 0),
                0
            ) || 0;
            
        const totalSeriesViews =
            allSeries?.reduce(
                (sum, s) => sum + (parseInt(s.view_count) || 0),
                0
            ) || 0;
            
        const totalChapterViews =
            allSeries?.reduce(
                (sum, s) => s.chapters.reduce(
                    (chSum, ch) => chSum + (parseInt(ch.view_count) || 0), 
                    0
                ), 
                0
            ) || 0;
            
        const totalViews = totalStoryViews + totalSeriesViews + totalChapterViews;

        console.log("--- DEBUG: Views Data ---");
        console.log("Total Story Views:", totalStoryViews);
        console.log("Total Series Views:", totalSeriesViews);
        console.log("Total Chapter Views:", totalChapterViews);
        console.log("Total Views Calculated:", totalViews);

        const tagMap = new Map();
        
        allSeries?.forEach(s => {
            if (s.tags && Array.isArray(s.tags)) {
                s.tags.forEach(tag => {
                    tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
                });
            }
        });
        
        const tagsCloud = Array.from(tagMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => ({ tag, count }));

        const storiesByCategory = {};
        stories?.forEach((story) => {
            const category = story.category || "Sem categoria";
            if (!storiesByCategory[category]) {
                storiesByCategory[category] = [];
            }
            storiesByCategory[category].push(story);
        });

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

        console.log("--- DEBUG: Category Data ---");
        console.log("Stories By Category:", storiesByCategory);
        console.log("Favorite Category Calculated:", favoriteCategory);

        const joinDate = new Date(profile.created_at).toLocaleDateString('pt-BR', {
            year: 'numeric', 
            month: 'long'
        });

        const formatUrl = (url) => {
            if (!url) return "#";
            return url.startsWith("http") ? url : `https://${url}`;
        };

        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        };

        return (
            <div className="content-wrapper py-8">
                <div className="bg-white rounded-lg overflow-hidden p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
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

                        <div className="flex-grow text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{profile.username}</h1>
                            
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

                            {profile.bio && (
                                <div className="mb-4 text-gray-700">
                                    <p>{profile.bio}</p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                                {profile.website_url && (
                                    <a
                                        href={formatUrl(profile.website_url)}
                                        className="inline-flex items-center h-10 px-4 rounded-md border border-[#D7D7D7] text-gray-700 hover:bg-gray-50"
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
                                        className="inline-flex items-center h-10 px-4 rounded-md border border-[#D7D7D7] text-gray-700 hover:bg-gray-50"
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
                                        className="inline-flex items-center h-10 px-4 rounded-md border border-[#D7D7D7] text-gray-700 hover:bg-gray-50"
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
                                        className="inline-flex items-center h-10 px-4 rounded-md border border-[#D7D7D7] text-gray-700 hover:bg-gray-50"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Instagram"
                                    >
                                        <Instagram size={16} className="mr-1" />
                                        <span>Instagram</span>
                                    </a>
                                )}
                            </div>

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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg border border-[#D7D7D7] p-4 flex items-center">
                        <div className="p-3 bg-blue-50 text-[#484DB5] rounded-full mr-4">
                            <BookText size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#484DB5]">{stories?.length || 0}</div>
                            <div className="text-sm text-gray-600">Contos</div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-[#D7D7D7] p-4 flex items-center">
                        <div className="p-3 bg-blue-50 text-[#484DB5] rounded-full mr-4">
                            <Bookmark size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#484DB5]">{allSeries?.length || 0}</div>
                            <div className="text-sm text-gray-600">Séries</div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-[#D7D7D7] p-4 flex items-center">
                        <div className="p-3 bg-blue-50 text-[#484DB5] rounded-full mr-4">
                            <Eye size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#484DB5]">{totalViews}</div>
                            <div className="text-sm text-gray-600">Visualizações</div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-[#D7D7D7] p-4 flex items-center">
                        <div className="p-3 bg-blue-50 text-[#484DB5] rounded-full mr-4">
                            <Award size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#484DB5]">{favoriteCategory}</div>
                            <div className="text-sm text-gray-600">Categoria Favorita</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-lg border border-[#D7D7D7] overflow-hidden">
                            <div className="border-b border-[#D7D7D7] p-4 bg-gray-50 flex justify-between items-center">
                                <h2 className="flex items-center text-lg font-medium text-gray-900">
                                    <BookText size={20} className="mr-2 text-[#484DB5]" /> 
                                    Contos Únicos
                                </h2>
                                {isOwnProfile && (
                                    <Link
                                        href="/dashboard/new-story"
                                        className="text-sm text-[#484DB5] hover:underline flex items-center"
                                    >
                                        <PlusCircle size={16} className="mr-1" />
                                        Criar Conto
                                    </Link>
                                )}
                            </div>
                            
                            <div className="p-6">
                                {!stories || stories.length === 0 ? (
                                    <div className="py-6 flex flex-col items-center justify-center text-gray-500">
                                        <div className="mb-4 p-4 bg-gray-50 rounded-full">
                                            <BookText size={48} className="text-gray-400" />
                                        </div>
                                        <p>Nenhum conto {isOwnProfile ? 'criado' : 'publicado'} ainda.</p>
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                                                {isOwnProfile && (
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                                                )}
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Visualizações</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Atualizada</th>
                                                {isOwnProfile && (
                                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-border">
                                            {stories.map((story) => (
                                                <tr key={story.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Link href={`/story/${generateSlug(story.title, story.id)}`} className="text-sm font-medium text-gray-900 hover:text-[#484DB5]">
                                                            {story.title}
                                                        </Link>
                                                        <div className="text-xs text-gray-500">{story.category || "Sem categoria"}</div>
                                                    </td>
                                                    {isOwnProfile && (
                                                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                                            <span
                                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${story.is_published
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-yellow-100 text-yellow-800"
                                                                    }`}
                                                            >
                                                                {story.is_published ? "Publicada" : "Rascunho"}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                                        {story.view_count || 0}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                                                        {formatDate(story.updated_at || story.created_at)}
                                                    </td>
                                                    {isOwnProfile && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <ProfileStoryActions story={story} isOwnProfile={isOwnProfile} />
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-[#D7D7D7] overflow-hidden">
                            <div className="border-b border-[#D7D7D7] p-4 bg-gray-50">
                                <h2 className="flex items-center text-lg font-medium text-gray-900">
                                    <Bookmark size={20} className="mr-2 text-[#484DB5]" /> 
                                    Séries
                                </h2>
                            </div>
                            
                            <div className="p-6">
                                {!allSeries || allSeries.length === 0 ? (
                                    <div className="py-6 flex flex-col items-center justify-center text-gray-500">
                                        <div className="mb-4 p-4 bg-gray-50 rounded-full">
                                            <Bookmark size={48} className="text-gray-400" />
                                        </div>
                                        <p>Nenhuma série publicada ainda.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {allSeries.map((s) => (
                                            <div key={s.id} className="border border-[#D7D7D7] rounded-lg overflow-hidden">
                                                <div className="flex flex-col md:flex-row">
                                                    {s.cover_url && (
                                                        <div className="w-full md:w-1/4 h-48 md:h-auto">
                                                            <div 
                                                                className="w-full h-full bg-cover bg-center bg-gray-100"
                                                                style={{
                                                                    backgroundImage: `url(${s.cover_url})`,
                                                                }}
                                                            ></div>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="p-4 flex-1">
                                                        <Link 
                                                            href={`/series/${s.id}`}
                                                            className="text-xl font-medium text-[#484DB5] hover:underline mb-2 block"
                                                        >
                                                            {s.title}
                                                        </Link>
                                                        
                                                        {s.genre && (
                                                            <div className="text-sm text-gray-600 mb-2">
                                                                Gênero: {s.genre}
                                                            </div>
                                                        )}
                                                        
                                                        {s.description && (
                                                            <p className="text-gray-700 mb-3 line-clamp-2">
                                                                {s.description}
                                                            </p>
                                                        )}
                                                        
                                                        {s.tags && s.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mb-3">
                                                                {s.tags.slice(0, 3).map(tag => (
                                                                    <span key={tag} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full border border-[#D7D7D7]">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                                {s.tags.length > 3 && (
                                                                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full border border-[#D7D7D7]">
                                                                        +{s.tags.length - 3}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                            <span className="flex items-center">
                                                                <BookText size={14} className="mr-1" />
                                                                {s.chapterCount} capítulos
                                                            </span>
                                                            <span className="flex items-center">
                                                                <Eye size={14} className="mr-1" />
                                                                {s.view_count || 0} visualizações
                                                            </span>
                                                            <span className="flex items-center">
                                                                <Calendar size={14} className="mr-1" />
                                                                {new Date(s.created_at).toLocaleDateString("pt-BR")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {s.chapters && s.chapters.length > 0 && (
                                                    <div className="border-t border-[#D7D7D7] bg-gray-50 p-3">
                                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Capítulos recentes:</h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {s.chapters.slice(0, 4).map((chapter) => (
                                                                <Link
                                                                    key={chapter.id}
                                                                    href={`/chapter/${chapter.id}`}
                                                                    className="text-sm flex justify-between p-2 bg-white rounded border border-[#D7D7D7] hover:border-[#484DB5]"
                                                                >
                                                                    <span className="line-clamp-1">
                                                                        {chapter.chapter_number}. {chapter.title}
                                                                    </span>
                                                                    <span className="flex items-center text-gray-500">
                                                                        <Eye size={12} className="mr-1" />
                                                                        {chapter.view_count || 0}
                                                                    </span>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                        {s.chapters.length > 4 && (
                                                            <div className="mt-2 text-center">
                                                                <Link 
                                                                    href={`/series/${s.id}`}
                                                                    className="text-sm text-[#484DB5] hover:underline"
                                                                >
                                                                    Ver todos os {s.chapters.length} capítulos
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        <div className="bg-white rounded-lg border border-[#D7D7D7] overflow-hidden">
                            <div className="border-b border-[#D7D7D7] p-4 bg-gray-50">
                                <h2 className="flex items-center text-lg font-medium text-gray-900">
                                    <TrendingUp size={20} className="mr-2 text-[#484DB5]" /> 
                                    Capítulos Populares
                                </h2>
                            </div>
                            
                            <div className="p-4">
                                {!popularChapters || popularChapters.length === 0 ? (
                                    <div className="py-6 flex flex-col items-center justify-center text-gray-500">
                                        <p>Nenhum capítulo publicado ainda.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {popularChapters.map((chapter) => (
                                            <Link
                                                key={chapter.id}
                                                href={`/chapter/${chapter.id}`}
                                                className="flex items-start p-3 border border-[#D7D7D7] rounded-md hover:border-[#484DB5] transition-colors"
                                            >
                                                <div className="p-2 bg-blue-50 text-[#484DB5] rounded-full mr-3">
                                                    <BookText size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-900 line-clamp-1">
                                                        {chapter.title}
                                                    </h3>
                                                    <div className="text-sm text-gray-600">
                                                        Capítulo {chapter.chapter_number} de{" "}
                                                        <span className="text-[#484DB5]">
                                                            {chapter.series.title}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-500 mt-1">
                                                        <Eye size={14} className="mr-1" />
                                                        {chapter.view_count || 0} visualizações
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border border-[#D7D7D7] overflow-hidden">
                            <div className="border-b border-[#D7D7D7] p-4 bg-gray-50">
                                <h2 className="flex items-center text-lg font-medium text-gray-900">
                                    <Hash size={20} className="mr-2 text-[#484DB5]" /> 
                                    Tags Frequentes
                                </h2>
                            </div>
                            
                            <div className="p-4">
                                {!tagsCloud || tagsCloud.length === 0 ? (
                                    <div className="py-6 flex flex-col items-center justify-center text-gray-500">
                                        <p>Nenhuma tag encontrada.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {tagsCloud.map(({ tag, count }) => {
                                            const fontSize = Math.min(Math.max(count * 0.5 + 0.8, 0.8), 1.5);
                                            const opacity = Math.min(Math.max(count * 0.2 + 0.6, 0.6), 1);
                                            
                                            return (
                                                <div 
                                                    key={tag}
                                                    className="px-3 py-1.5 bg-gray-100 rounded-full border border-[#D7D7D7] cursor-pointer hover:bg-gray-200 transition-colors"
                                                    style={{ 
                                                        fontSize: `${fontSize}rem`,
                                                        opacity
                                                    }}
                                                >
                                                    {tag}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border border-[#D7D7D7] overflow-hidden">
                            <div className="border-b border-[#D7D7D7] p-4 bg-gray-50">
                                <h2 className="flex items-center text-lg font-medium text-gray-900">
                                    <MessageSquare size={20} className="mr-2 text-[#484DB5]" /> 
                                    Comentários Recentes
                                </h2>
                            </div>
                            
                            <div className="p-4">
                                {!comments || comments.length === 0 ? (
                                    <div className="py-6 flex flex-col items-center justify-center text-gray-500">
                                        <p>Nenhum comentário encontrado.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {comments.map((comment) => {
                                            let commentLink = "#";
                                            if (comment.story_id) {
                                                commentLink = `/story/${comment.story_id}`;
                                            } else if (comment.chapter_id) {
                                                commentLink = `/chapter/${comment.chapter_id}`;
                                            } else if (comment.series_id) {
                                                commentLink = `/series/${comment.series_id}`;
                                            }
                                            
                                            return (
                                                <div key={comment.id} className="border border-[#D7D7D7] rounded-md p-3">
                                                    <Link href={commentLink} className="block">
                                                        <div className="text-sm text-gray-500 mb-1">
                                                            {new Date(comment.created_at).toLocaleDateString("pt-BR", {
                                                                year: "numeric",
                                                                month: "short",
                                                                day: "numeric"
                                                            })}
                                                        </div>
                                                        <div className="text-gray-700 line-clamp-2">
                                                            {comment.text}
                                                        </div>
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        return (
            <div className="content-wrapper py-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar perfil</h1>
                <p className="text-gray-700 mb-6">Não foi possível carregar os dados do perfil.</p>
                <Link href="/" className="inline-flex items-center justify-center h-10 px-6 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90">
                    Voltar para a página inicial
                </Link>
            </div>
        );
    }
}
