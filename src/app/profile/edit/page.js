"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import { 
    User, 
    Globe, 
    Twitter, 
    Facebook, 
    Instagram, 
    Save, 
    Upload, 
    Info, 
    CheckCircle, 
    AlertCircle
} from "lucide-react";

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
            <div className="max-w-[75rem] mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-t-[#484DB5] border-r-[#E5E7EB] border-b-[#E5E7EB] border-l-[#E5E7EB] rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-700">Carregando seu perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[75rem] mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Editar Perfil</h1>
                <p className="text-gray-600 mt-1">Atualize suas informações pessoais e links de redes sociais</p>
            </div>

            {error && (
                <div className="flex items-center p-4 mb-6 bg-red-50 text-red-700 rounded-md border border-red-200">
                    <AlertCircle size={20} className="mr-2" />
                    <span>{error}</span>
                </div>
            )}
            
            {success && (
                <div className="flex items-center p-4 mb-6 bg-green-50 text-green-700 rounded-md border border-green-200">
                    <CheckCircle size={20} className="mr-2" />
                    <span>Perfil atualizado com sucesso!</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="border-b border-[#E5E7EB] p-4 bg-gray-50">
                        <h2 className="flex items-center text-lg font-medium text-gray-900">
                            <User size={18} className="mr-2 text-[#484DB5]" /> 
                            Informações Pessoais
                        </h2>
                    </div>
                    
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-6 mb-6">
                            <div className="flex-shrink-0">
                                {avatarPreview ? (
                                    <div 
                                        className="w-32 h-32 rounded-full bg-cover bg-center"
                                        style={{
                                            backgroundImage: `url(${avatarPreview})`,
                                        }}
                                    ></div>
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
                                        {username.charAt(0).toUpperCase() || "U"}
                                    </div>
                                )}
                            </div>

                            <div className="flex-grow space-y-3">
                                <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
                                    <Upload size={16} className="inline mr-1" /> Foto de Perfil
                                </label>
                                <div className="flex items-center">
                                    <label htmlFor="avatar" className="inline-flex items-center justify-center h-10 px-4 bg-white border border-[#E5E7EB] text-gray-700 rounded-md hover:bg-gray-50 transition-all duration-200 cursor-pointer">
                                        Escolher arquivo
                                    </label>
                                    <input
                                        type="file"
                                        id="avatar"
                                        accept="image/jpeg, image/png, image/gif"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 flex items-center">
                                    <Info size={14} className="mr-1" /> 
                                    Formatos aceitos: JPG, PNG e GIF (máx. 2MB)
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    Nome de usuário*
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full p-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#484DB5] focus:border-transparent outline-none transition-all duration-200"
                                    placeholder="Seu nome de usuário único"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                                    Biografia
                                </label>
                                <textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={4}
                                    className="w-full p-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#484DB5] focus:border-transparent outline-none transition-all duration-200 resize-y"
                                    placeholder="Conte um pouco sobre você..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="border-b border-[#E5E7EB] p-4 bg-gray-50">
                        <h2 className="flex items-center text-lg font-medium text-gray-900">
                            <Globe size={18} className="mr-2 text-[#484DB5]" /> 
                            Redes Sociais
                        </h2>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="website" className="flex items-center text-sm font-medium text-gray-700">
                                <Globe size={16} className="mr-1" /> Website
                            </label>
                            <input
                                id="website"
                                type="text"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                placeholder="https://seusite.com"
                                className="w-full p-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#484DB5] focus:border-transparent outline-none transition-all duration-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="twitter" className="flex items-center text-sm font-medium text-gray-700">
                                <Twitter size={16} className="mr-1" /> Twitter
                            </label>
                            <input
                                id="twitter"
                                type="text"
                                value={twitterUrl}
                                onChange={(e) => setTwitterUrl(e.target.value)}
                                placeholder="https://twitter.com/seuperfil"
                                className="w-full p-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#484DB5] focus:border-transparent outline-none transition-all duration-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="facebook" className="flex items-center text-sm font-medium text-gray-700">
                                <Facebook size={16} className="mr-1" /> Facebook
                            </label>
                            <input
                                id="facebook"
                                type="text"
                                value={facebookUrl}
                                onChange={(e) => setFacebookUrl(e.target.value)}
                                placeholder="https://facebook.com/seuperfil"
                                className="w-full p-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#484DB5] focus:border-transparent outline-none transition-all duration-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="instagram" className="flex items-center text-sm font-medium text-gray-700">
                                <Instagram size={16} className="mr-1" /> Instagram
                            </label>
                            <input
                                id="instagram"
                                type="text"
                                value={instagramUrl}
                                onChange={(e) => setInstagramUrl(e.target.value)}
                                placeholder="https://instagram.com/seuperfil"
                                className="w-full p-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#484DB5] focus:border-transparent outline-none transition-all duration-200"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving || !username.trim()}
                        className="inline-flex items-center justify-center h-10 px-6 bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <span className="flex items-center">
                                <div className="w-4 h-4 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mr-2"></div>
                                Salvando...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <Save size={16} className="mr-2" />
                                Salvar Perfil
                            </span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
