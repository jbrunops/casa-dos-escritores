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

    return (
        <div className="max-w-[75rem] mx-auto px-4 sm:px-0 py-[1.875rem]">
            <h1 className="text-3xl font-bold text-black mb-[1.875rem]">Histórias de {categoryName}</h1>

            {stories.length === 0 ? (
                <div className="empty-category">
                    <p>Ainda não há histórias nesta categoria.</p>
                    <Link href="/dashboard/new" className="btn primary">
                        Seja o primeiro a publicar
                    </Link>
                </div>
            ) : (
                <>
                    <div className="stories-grid category-stories">
                        {stories.map((story) => (
                            <Link
                                href={`/story/${story.id}`}
                                key={story.id}
                                className="story-card"
                            >
                                <h3>{story.title}</h3>
                                <p className="story-meta">
                                    Escrito por {story.profiles.username}
                                </p>
                                <p className="story-date">
                                    {new Date(
                                        story.created_at
                                    ).toLocaleDateString("pt-BR")}
                                </p>
                            </Link>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            baseUrl={`/categories/${params.category}`}
                        />
                    )}
                </>
            )}

            <div className="category-actions">
                <Link href="/categories" className="btn secondary">
                    Ver todas as categorias
                </Link>
            </div>
        </div>
    );
}
