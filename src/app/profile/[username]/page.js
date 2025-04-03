import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateSlug } from "@/lib/utils";

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

        // Função para formatar URLs
        const formatUrl = (url) => {
            if (!url) return "#";
            return url.startsWith("http") ? url : `https://${url}`;
        };

        return (
            <div className="profile-page">
                <div className="profile-header">
                    {/* Avatar */}
                    <div className="profile-avatar">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Avatar"
                                className="avatar-image"
                                width={150}
                                height={150}
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

                        {/* Stats */}
                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-value">
                                    {stories?.length || 0}
                                </span>
                                <span className="stat-label">Histórias</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{totalViews}</span>
                                <span className="stat-label">
                                    Visualizações
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">
                                    {favoriteCategory}
                                </span>
                                <span className="stat-label">
                                    Categoria Favorita
                                </span>
                            </div>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <div className="profile-bio">
                                <p>{profile.bio}</p>
                            </div>
                        )}

                        {/* Links sociais */}
                        <div className="social-links">
                            {profile.website_url && (
                                <a
                                    href={formatUrl(profile.website_url)}
                                    className="social-link website"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    🌐 Website
                                </a>
                            )}
                            {profile.twitter_url && (
                                <a
                                    href={formatUrl(profile.twitter_url)}
                                    className="social-link twitter"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    🐦 Twitter
                                </a>
                            )}
                            {profile.facebook_url && (
                                <a
                                    href={formatUrl(profile.facebook_url)}
                                    className="social-link facebook"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    📘 Facebook
                                </a>
                            )}
                            {profile.instagram_url && (
                                <a
                                    href={formatUrl(profile.instagram_url)}
                                    className="social-link instagram"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    📷 Instagram
                                </a>
                            )}
                        </div>

                        {/* Actions */}
                        {isOwnProfile && (
                            <div className="profile-actions">
                                <Link
                                    href="/profile/edit"
                                    className="edit-profile-btn"
                                >
                                    Editar Perfil
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Histórias organizadas por categoria */}
                <div className="profile-content">
                    <h2>Histórias Publicadas</h2>
                    {!stories || stories.length === 0 ? (
                        <p className="no-stories">
                            Nenhuma história publicada ainda.
                        </p>
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
                                                            {new Date(
                                                                story.created_at
                                                            ).toLocaleDateString(
                                                                "pt-BR"
                                                            )}
                                                        </span>
                                                        <span className="view-count">
                                                            👁️{" "}
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
        console.error("Erro na página de perfil:", error);
        return notFound();
    }
}
