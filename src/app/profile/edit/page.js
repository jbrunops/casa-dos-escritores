"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";

export default function EditProfilePage() {
    const [username, setUsername] = useState("");
    const [originalUsername, setOriginalUsername] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [twitterUrl, setTwitterUrl] = useState("");
    const [facebookUrl, setFacebookUrl] = useState("");
    const [instagramUrl, setInstagramUrl] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const supabase = createBrowserClient();

    useEffect(() => {
        async function loadProfile() {
            try {
                setLoading(true);
                setError(null);

                // Verificar se o usuário está autenticado
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session || !session.user) {
                    console.log(
                        "Usuário não autenticado, redirecionando para login"
                    );
                    router.push("/login");
                    return;
                }

                // Buscar perfil do usuário
                const { data: profile, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();

                if (error) {
                    console.error("Erro ao buscar perfil:", error);
                    throw error;
                }

                // Preencher formulário com dados existentes
                setUsername(profile.username || "");
                setOriginalUsername(profile.username || "");
                setBio(profile.bio || "");
                setAvatarUrl(profile.avatar_url || "");
                setTwitterUrl(profile.twitter_url || "");
                setFacebookUrl(profile.facebook_url || "");
                setInstagramUrl(profile.instagram_url || "");
                setWebsiteUrl(profile.website_url || "");

                if (profile.avatar_url) {
                    setAvatarPreview(profile.avatar_url);
                }
            } catch (err) {
                console.error("Erro ao carregar perfil:", err);
                setError(
                    "Não foi possível carregar seu perfil. Por favor, tente novamente."
                );
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, []);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Verificar tipo de arquivo
        const validTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!validTypes.includes(file.type)) {
            setError("Tipo de arquivo inválido. Use JPG, PNG ou GIF.");
            return;
        }

        // Verificar tamanho do arquivo (limite de 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError("A imagem deve ter no máximo 2MB.");
            return;
        }

        setAvatarFile(file);
        setError(null);

        // Criar preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setAvatarPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim()) {
            setError("Nome de usuário é obrigatório");
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            // Verificar se o usuário está autenticado
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error(
                    "Você precisa estar logado para editar seu perfil"
                );
            }

            // Verificar se o username já existe (exceto para o próprio usuário)
            if (username !== originalUsername) {
                const { data: existingUser, error: checkError } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("username", username)
                    .neq("id", user.id)
                    .single();

                if (!checkError && existingUser) {
                    setError("Este nome de usuário já está em uso");
                    setSaving(false);
                    return;
                }
            }

            // Upload do avatar, se necessário
            let finalAvatarUrl = avatarUrl;
            if (avatarFile) {
                try {
                    // Criar nome de arquivo único
                    const fileExt = avatarFile.name.split(".").pop();
                    const fileName = `${user.id}-${Math.random()
                        .toString(36)
                        .substring(2)}.${fileExt}`;
                    const filePath = `avatars/${fileName}`;

                    // Upload para o Storage
                    const { error: uploadError } = await supabase.storage
                        .from("avatars")
                        .upload(filePath, avatarFile);

                    if (uploadError) {
                        console.error("Erro no upload:", uploadError);
                        throw uploadError;
                    }

                    // Obter URL pública
                    const { data } = supabase.storage
                        .from("avatars")
                        .getPublicUrl(filePath);

                    finalAvatarUrl = data.publicUrl;
                } catch (uploadErr) {
                    console.error("Erro no upload do avatar:", uploadErr);
                    // Se houver erro no upload, manter a URL atual
                    // mas não interromper o processo de atualização do perfil
                }
            }

            // Atualizar perfil
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    username,
                    bio,
                    avatar_url: finalAvatarUrl,
                    twitter_url: twitterUrl,
                    facebook_url: facebookUrl,
                    instagram_url: instagramUrl,
                    website_url: websiteUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id);

            if (updateError) throw updateError;

            setSuccess(true);

            // Redirecionar após 1.5 segundos
            setTimeout(() => {
                router.push(`/profile/${username}`);
            }, 1500);
        } catch (err) {
            console.error("Erro ao atualizar perfil:", err);
            setError(
                err.message ||
                    "Não foi possível atualizar seu perfil. Por favor, tente novamente."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader-large"></div>
                <p>Carregando seu perfil...</p>
            </div>
        );
    }

    return (
        <div className="edit-profile-page">
            <h1>Editar Perfil</h1>

            {error && <div className="error-message">{error}</div>}
            {success && (
                <div className="success-message">
                    Perfil atualizado com sucesso!
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="avatar-section">
                    <div className="current-avatar">
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Preview do avatar"
                                className="avatar-preview"
                            />
                        ) : (
                            <div className="avatar-placeholder">
                                {username.charAt(0).toUpperCase() || "U"}
                            </div>
                        )}
                    </div>

                    <div className="avatar-upload">
                        <label htmlFor="avatar" className="avatar-label">
                            Foto de Perfil
                        </label>
                        <input
                            type="file"
                            id="avatar"
                            accept="image/jpeg, image/png, image/gif"
                            onChange={handleAvatarChange}
                            className="avatar-input"
                        />
                        <p className="avatar-hint">
                            Formatos aceitos: JPG, PNG e GIF (máx. 2MB)
                        </p>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="username">Nome de usuário*</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="bio">Biografia</label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        placeholder="Conte um pouco sobre você..."
                    />
                </div>

                <h2 className="social-heading">Redes Sociais</h2>

                <div className="form-group">
                    <label htmlFor="website">Website</label>
                    <input
                        id="website"
                        type="text"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://seusite.com"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="twitter">Twitter</label>
                    <input
                        id="twitter"
                        type="text"
                        value={twitterUrl}
                        onChange={(e) => setTwitterUrl(e.target.value)}
                        placeholder="https://twitter.com/seuperfil"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="facebook">Facebook</label>
                    <input
                        id="facebook"
                        type="text"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        placeholder="https://facebook.com/seuperfil"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="instagram">Instagram</label>
                    <input
                        id="instagram"
                        type="text"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="https://instagram.com/seuperfil"
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving || !username.trim()}
                    className="save-profile-btn"
                >
                    {saving ? (
                        <>
                            <span className="loader"></span>
                            <span>Salvando...</span>
                        </>
                    ) : (
                        "Salvar Perfil"
                    )}
                </button>
            </form>
        </div>
    );
}
