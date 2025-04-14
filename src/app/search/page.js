// src/app/search/page.js
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { generateSlug } from "@/lib/utils";
import { ArrowLeft, Search } from "lucide-react";

export const metadata = {
    title: "Resultados de pesquisa",
    description: "Pesquise histórias em nossa plataforma",
};

export default async function SearchPage({ searchParams }) {
    const query = searchParams.q || "";

    // Se não há consulta, redirecionar para home
    if (!query) {
        return (
            <div className="mx-auto max-w-[75rem] px-4 md:px-0 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Pesquisa</h1>
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-8 text-center mb-6">
                    <Search size={40} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-6">
                        Por favor, insira um termo de pesquisa.
                    </p>
                    <Link href="/" className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-[#484DB5] text-white font-medium hover:bg-opacity-90 transition-all duration-200">
                        Voltar para o início
                    </Link>
                </div>
            </div>
        );
    }

    const supabase = await createServerSupabaseClient();

    try {
        // Buscar histórias que correspondem à consulta
        const { data: stories, error } = await supabase
            .from("stories")
            .select(
                `
                id,
                title,
                content,
                created_at,
                category,
                profiles(username)
            `
            )
            .eq("is_published", true)
            .or(
                `title.ilike.%${query}%,content.ilike.%${query}%,category.ilike.%${query}%`
            )
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        // Buscar perfis de usuário que correspondem à consulta
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select(
                `
                id,
                username,
                bio,
                avatar_url
            `
            )
            .ilike("username", `%${query}%`)
            .limit(10);

        if (profilesError) {
            console.error("Erro ao buscar perfis:", profilesError);
        }

        // Função para criar resumo do conteúdo HTML
        const createSummary = (htmlContent, maxLength = 150) => {
            // Remover todas as tags HTML
            const textContent = htmlContent?.replace(/<[^>]*>/g, "") || "";

            // Limitar o tamanho e adicionar reticências se necessário
            if (textContent.length <= maxLength) {
                return textContent;
            }

            // Cortar no final de uma palavra
            let summary = textContent.substring(0, maxLength);
            summary = summary.substring(0, summary.lastIndexOf(" "));
            return `${summary}...`;
        };

        // Destacar o termo da pesquisa no texto
        const highlightText = (text, query) => {
            // Escapar caracteres especiais na consulta
            const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            // Criar uma expressão regular para buscar o termo (não sensível a maiúsculas/minúsculas)
            const regex = new RegExp(`(${safeQuery})`, "gi");

            // Dividir o texto pelo termo e criar um array com o termo destacado
            const parts = text.split(regex);

            return parts
                .map((part, i) =>
                    regex.test(part)
                        ? `<mark class="bg-yellow-200 rounded px-0.5">${part}</mark>`
                        : part
                )
                .join("");
        };

        // Formatar a data para o formato compacto
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        };

        // Processar os resultados para destaque
        const processedStories = stories.map((story) => ({
            ...story,
            highlightedTitle: highlightText(story.title, query),
            summary: highlightText(createSummary(story.content), query),
        }));

        return (
            <div className="mx-auto max-w-[75rem] px-4 md:px-0 py-8">
                <div className="flex items-center mb-6">
                    <Link 
                        href="/"
                        className="mr-3 h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Resultados para &quot;{query}&quot;</h1>
                </div>

                <div className="text-sm text-gray-500 mb-6">
                    Encontrados {stories.length + (profiles?.length || 0)}{" "}
                    resultados
                </div>

                {/* Resultados de perfis */}
                {profiles && profiles.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Escritores</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {profiles.map((profile) => (
                                <Link
                                    href={`/profile/${encodeURIComponent(
                                        profile.username
                                    )}`}
                                    key={profile.id}
                                    className="flex items-start p-4 bg-white rounded-lg border border-[#E5E7EB] hover:shadow-md transition-all duration-200"
                                >
                                    {profile.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt={profile.username}
                                            className="w-12 h-12 rounded-full object-cover mr-4"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-[#484DB5] text-white flex items-center justify-center font-medium mr-4">
                                            {profile.username
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-medium text-gray-900">{profile.username}</h3>
                                        {profile.bio && (
                                            <p className="text-sm text-gray-500 line-clamp-2">
                                                {profile.bio}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Resultados de histórias */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Histórias</h2>

                    {processedStories.length === 0 ? (
                        <div className="bg-white rounded-lg border border-[#E5E7EB] p-8 text-center">
                            <Search size={40} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 mb-2">
                                Nenhuma história encontrada para &quot;{query}
                                &quot;.
                            </p>
                            <p className="text-gray-400 mb-6">
                                Tente outras palavras-chave ou categorias.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {processedStories.map((story) => (
                                <Link
                                    href={`/story/${generateSlug(story.title, story.id)}`}
                                    key={story.id}
                                    className="block bg-white rounded-lg border border-[#E5E7EB] p-4 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3
                                            className="text-lg font-medium text-gray-900"
                                            dangerouslySetInnerHTML={{
                                                __html: story.highlightedTitle,
                                            }}
                                        ></h3>
                                        {story.category && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                                {story.category}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center text-sm text-gray-500 mb-3">
                                        <span className="mr-3">
                                            Por {story.profiles.username}
                                        </span>
                                        <span>
                                            {formatDate(story.created_at)}
                                        </span>
                                    </div>

                                    <p
                                        className="text-gray-600 line-clamp-2"
                                        dangerouslySetInnerHTML={{
                                            __html: story.summary,
                                        }}
                                    ></p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-center mt-8">
                    <Link href="/" className="inline-flex items-center justify-center h-10 px-6 rounded-md border border-[#E5E7EB] text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200">
                        Voltar para o início
                    </Link>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Erro na busca:", error);
        return notFound();
    }
}
