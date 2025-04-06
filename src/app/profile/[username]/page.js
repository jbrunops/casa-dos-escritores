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
    Calendar 
} from "lucide-react";
import Image from "next/image";

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
        const isOwnProfile = data.session?.user?.id === profile.id;

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
            <div className="profile-page">
                <div className="profile-header-card">
                    {/* Avatar */}
                    <div className="profile-avatar-wrapper">
                        {profile.avatar_url ? (
                            <Image
                                src={profile.avatar_url}
                                alt={`${profile.username} avatar`}
                                width={112}
                                height={112}
                                className="profile-avatar"
                            />
                        ) : (
                            <div className="avatar-placeholder">
                                {profile.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="profile-info">
                        <h1>{profile.username}</h1>
                        
                        {/* Membro desde */}
                        <div className="join-date">
                            <Clock className="w-4 h-4" />
                            <span>Entrou em {joinDate}</span>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <p className="profile-bio">{profile.bio}</p>
                        )}

                        {/* Links sociais */}
                        <div className="social-links">
                            {profile.website_url && (
                                <a
                                    href={formatUrl(profile.website_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Globe className="w-4 h-4" />
                                    <span>Site</span>
                                </a>
                            )}
                            {profile.twitter_url && (
                                <a
                                    href={formatUrl(profile.twitter_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Twitter className="w-4 h-4" />
                                    <span>Twitter</span>
                                </a>
                            )}
                            {profile.facebook_url && (
                                <a
                                    href={formatUrl(profile.facebook_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Facebook size={18} />
                                    <span>Facebook</span>
                                </a>
                            )}
                            {profile.instagram_url && (
                                <a
                                    href={formatUrl(profile.instagram_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Instagram className="w-4 h-4" />
                                    <span>Instagram</span>
                                </a>
                            )}
                        </div>

                        {/* Actions */}
                        {isOwnProfile && (
                            <div className="profile-actions">
                                <Link
                                    href="/profile/edit"
                                    className="btn-primary"
                                >
                                    <Edit size={18} />
                                    <span>Editar Perfil</span>
                                </Link>
                            </div>
                        )}
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="profile-stats-cards">
                        <div className="profile-stat-card">
                            <div className="stat-card-info">
                                <div className="stat-card-value">{stories?.length || 0}</div>
                                <div className="stat-card-label">Histórias</div>
                            </div>
                        </div>
                        
                        <div className="profile-stat-card">
                            <div className="stat-card-info">
                                <div className="stat-card-value">{totalViews}</div>
                                <div className="stat-card-label">Visualizações</div>
                            </div>
                        </div>
                        
                        <div className="profile-stat-card">
                            <div className="stat-card-info">
                                <div className="stat-card-value">{favoriteCategory || "-"}</div>
                                <div className="stat-card-label">Categoria Favorita</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Histórias organizadas por categoria */}
                <div className="profile-content">
                    <div className="profile-content-header">
                        <h2><BookOpen size={22} /> Histórias Publicadas</h2>
                    </div>
                    
                    {!stories || stories.length === 0 ? (
                        <div className="no-stories">
                            <div className="no-stories-icon"><BookText size={48} /></div>
                            <p>Nenhuma história publicada ainda.</p>
                        </div>
                    ) : (
                        <div className="stories-by-category">
                            {Object.entries(storiesByCategory).map(
                                ([category, categoryStories]) => (
                                    <div
                                        key={category}
                                        className="category-group"
                                    >
                                        <h3 className="category-title">
                                            {category}
                                        </h3>
                                        <div className="profile-stories-grid">
                                            {categoryStories.map((story) => (
                                                <Link
                                                    href={`/story/${generateSlug(story.title, story.id)}`}
                                                    key={story.id}
                                                    className="story-card"
                                                >
                                                    <h4>{story.title}</h4>
                                                    <div className="story-meta-row">
                                                        <span className="story-date">
                                                            <Calendar size={14} />
                                                            {new Date(
                                                                story.created_at
                                                            ).toLocaleDateString(
                                                                "pt-BR"
                                                            )}
                                                        </span>
                                                        <span className="view-count">
                                                            <Eye size={14} />
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
        );
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        return (
            <div className="profile-page">
                <h1>Erro ao carregar perfil</h1>
                <p>Não foi possível carregar os dados do perfil.</p>
                <Link href="/" className="btn-primary">
                    Voltar para a página inicial
                </Link>
            </div>
        );
    }
}
