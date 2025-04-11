import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 9; // Número de histórias por página

export async function generateMetadata({ params }) {
    // Converter o slug de volta para nome de categoria
    // Decodificar a URL corretamente
    const categoryName = decodeURIComponent(params.category)
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    return {
        title: `Histórias de ${categoryName}`,
        description: `Explore histórias na categoria ${categoryName}`,
    };
}

export default async function CategoryPage({ params, searchParams }) {
    const supabase = await createServerSupabaseClient();
    const page = searchParams.page ? parseInt(searchParams.page) : 1;

    // Converter o slug de volta para nome de categoria
    // Decodificar a URL corretamente
    const categoryName = decodeURIComponent(params.category)
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    // Calcular o offset para paginação
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Buscar histórias desta categoria com paginação
    const {
        data: stories,
        count,
        error,
    } = await supabase
        .from("stories")
        .select(
            `
      id,
      title,
      content,
      created_at,
      profiles(username)
    `,
            { count: "exact" }
        )
        .eq("is_published", true)
        .eq("category", categoryName)
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error || !stories) {
        notFound();
    }

    // Calcular o número total de páginas
    const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

    // Função para criar um resumo do conteúdo
    const createSummary = (htmlContent, maxLength = 150) => {
        if (!htmlContent) return "";
        // Remover tags HTML
        const textContent = htmlContent.replace(/<[^>]*>/g, "");
        // Limitar o tamanho
        if (textContent.length <= maxLength) return textContent;
        // Cortar no final de uma palavra
        let summary = textContent.substring(0, maxLength);
        summary = summary.substring(0, summary.lastIndexOf(" "));
        return `${summary}...`;
    };

    return (
        <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-[1.875rem]">
            <h1 className="text-3xl font-bold text-black mb-[1.875rem]">Histórias de {categoryName}</h1>

            {stories.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-lg text-gray-600 mb-4">Ainda não há histórias nesta categoria.</p>
                    <Link 
                        href="/dashboard/new" 
                        className="inline-block px-6 py-2.5 bg-[#484DB5] text-white font-medium rounded-md hover:bg-opacity-90 transition-all duration-300 ease-in-out"
                    >
                        Seja o primeiro a publicar
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {stories.map((story) => (
                            <Link
                                href={`/story/${story.id}`}
                                key={story.id}
                                className="block p-4 bg-white border border-[#E5E7EB] rounded-md shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 relative overflow-hidden group"
                            >
                                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#484DB5] transition-colors duration-300">{story.title}</h3>
                                
                                {story.content && (
                                    <p className="text-gray-600 mb-3 line-clamp-2">
                                        {createSummary(story.content)}
                                    </p>
                                )}
                                
                                <div className="flex items-center justify-between mt-2 text-sm">
                                    <p className="text-[#484DB5] font-medium">
                                        por {story.profiles.username}
                                    </p>
                                    <p className="text-gray-500">
                                        {new Date(story.created_at).toLocaleDateString("pt-BR")}
                                    </p>
                                </div>
                                
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left -z-10"></div>
                            </Link>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-8">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                baseUrl={`/categories/${params.category}`}
                            />
                        </div>
                    )}
                </>
            )}

            <div className="mt-8 text-center">
                <Link 
                    href="/categories" 
                    className="inline-block px-6 py-2.5 border border-[#E5E7EB] bg-white text-[#484DB5] font-medium rounded-md hover:shadow-md transition-all duration-300 ease-in-out"
                >
                    Ver todas as categorias
                </Link>
            </div>
        </div>
    );
}
