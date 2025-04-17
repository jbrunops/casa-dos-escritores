"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import { User, Globe, Twitter, Facebook, Instagram, Save, Upload, Info, CheckCircle, AlertCircle } from "lucide-react";

interface Profile {
    id: string;
    username: string;
    bio?: string;
    avatar_url?: string;
    twitter_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    website_url?: string;
}

export default function EditProfilePage() {
    const [username, setUsername] = useState("");
    const [originalUsername, setOriginalUsername] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [twitterUrl, setTwitterUrl] = useState("");
    const [facebookUrl, setFacebookUrl] = useState("");
    const [instagramUrl, setInstagramUrl] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createBrowserClient();

    useEffect(() => {
        async function loadProfile() {
            try {
                setLoading(true);
                setError(null);
                const { data: { session } } = await supabase.auth.getSession();
                if (!session || !session.user) {
                    router.push("/login");
                    return;
                }
                const { data: profile, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();
                if (error) throw error;
                setUsername(profile.username || "");
                setOriginalUsername(profile.username || "");
                setBio(profile.bio || "");
                setAvatarUrl(profile.avatar_url || "");
                setTwitterUrl(profile.twitter_url || "");
                setFacebookUrl(profile.facebook_url || "");
                setInstagramUrl(profile.instagram_url || "");
                setWebsiteUrl(profile.website_url || "");
                if (profile.avatar_url) setAvatarPreview(profile.avatar_url);
            } catch (err) {
                setError("Não foi possível carregar seu perfil. Por favor, tente novamente.");
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !session.user) throw new Error("Você precisa estar logado");
            // Atualizar perfil
            const updates: Partial<Profile> = {
                username,
                bio,
                twitter_url: twitterUrl,
                facebook_url: facebookUrl,
                instagram_url: instagramUrl,
                website_url: websiteUrl,
            };
            // Upload do avatar se necessário
            if (avatarFile) {
                // Exemplo: upload para Supabase Storage
                const { data, error } = await supabase.storage.from("avatars").upload(`public/${session.user.id}.png`, avatarFile, { upsert: true });
                if (error) throw error;
                updates.avatar_url = data?.path || "";
            }
            const { error: updateError } = await supabase
                .from("profiles")
                .update(updates)
                .eq("id", session.user.id);
            if (updateError) throw updateError;
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Erro ao salvar perfil");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="edit-profile-page">
            <h1 className="text-2xl font-bold mb-4">Editar Perfil</h1>
            {loading ? (
                <div>Carregando...</div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                <form
                    className="space-y-4"
                    onSubmit={e => {
                        e.preventDefault();
                        handleSave();
                    }}
                >
                    <div>
                        <label className="block font-medium">Usuário</label>
                        <input
                            className="border rounded p-2 w-full"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-medium">Biografia</label>
                        <textarea
                            className="border rounded p-2 w-full"
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block font-medium">Avatar</label>
                        <input type="file" accept="image/*" onChange={handleAvatarChange} />
                        {avatarPreview && (
                            <img src={avatarPreview} alt="Avatar Preview" className="w-24 h-24 rounded-full mt-2" />
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="bg-[#484DB5] text-white px-4 py-2 rounded hover:bg-opacity-90"
                            disabled={saving}
                        >
                            Salvar
                        </button>
                        {success && <span className="text-green-600">Salvo!</span>}
                    </div>
                </form>
            )}
        </div>
    );
}
